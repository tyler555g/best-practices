# Secrets Management Best Practices

A practical guide to storing, retrieving, and rotating secrets across macOS, Linux, and Windows — using OS-native credential stores, Git Credential Manager, and HashiCorp Vault.

---

## Principles

1. **Never store secrets in plaintext** — not in dotfiles, `.env` files, shell profiles, source code, or configuration repos.
2. **Use native OS credential stores or centralized secret managers** — every major OS ships with an encrypted keystore. Use it.
3. **Prefer Just-In-Time (JIT) fetching** — fetch secrets inline for a single command instead of `export`-ing them into the environment globally.
4. **Maintain an audit trail** — centralized managers like Vault log every access. Prefer them for shared and production secrets.
5. **Rotate regularly** — machine credentials should rotate on a regular schedule. Production human credentials MUST use dynamic, short-lived leases.
6. **Least privilege** — grant the narrowest scope needed. Prefer read-only tokens where possible.

---

## Security Trade-offs

Not all secret-retrieval methods are equal. Understand the risk profile of each:

| Method | Disk Security | Memory Security | Leak Risk | Best For |
|---|---|---|---|---|
| Plaintext in dotfiles (`.env`, `.bashrc`) | ❌ Unencrypted | ❌ Persistent in env | ❌ High — exposed to any process, backups, git | **Never use** |
| `export` from credential store | ✅ Encrypted at rest | ⚠️ Exposed in env for session lifetime | ⚠️ Medium — visible via `/proc`, `ps e`, child processes | Tools that require a persistent `$ENV_VAR` |
| JIT fetching (**recommended**) | ✅ Encrypted at rest | ✅ Single-command scope only | ✅ Low — secret exists only for one process invocation | CLI tools, scripts, API calls |

**Always prefer JIT.** Fall back to `export` only when a tool explicitly requires a persistent environment variable.

---

## macOS — Keychain via `security` CLI

macOS Keychain encrypts secrets at rest using the user's login password (or Secure Enclave on Apple Silicon). The `security` command-line tool provides full access.

### Store a Secret

```bash
# Inline (⚠️ secret appears in shell history)
security add-generic-password -a "$(whoami)" -s "GITLAB_TOKEN" -w "glpat-xxxxxxxxxxxx" -U

# Interactive — prompts for value (safer — avoids shell history)
security add-generic-password -a "$(whoami)" -s "GITLAB_TOKEN" -w -U
```

> **Tip:** The `-U` flag updates the entry if it already exists, avoiding "duplicate item" errors.

### JIT Fetching (Recommended)

Define a helper function in your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
# Fetch a secret from macOS Keychain (returns empty string on failure)
_keychain_get() {
  security find-generic-password -s "$1" -w 2>/dev/null
}
```

Use it inline — the secret never persists in your environment:

```bash
# Alias for a CLI tool — env var is scoped to the child process
alias gl='GITLAB_TOKEN=$(_keychain_get GITLAB_TOKEN) glab'

# For curl/scripts — assign to local variable first:
token=$(_keychain_get GITLAB_TOKEN)
curl -sH "PRIVATE-TOKEN: $token" https://gitlab.com/api/v4/projects
unset token

# In scripts (full example)
#!/usr/bin/env bash
set -euo pipefail
token=$(_keychain_get GITLAB_TOKEN) || { echo "Missing GITLAB_TOKEN in Keychain" >&2; exit 1; }
curl -sH "PRIVATE-TOKEN: $token" https://gitlab.com/api/v4/projects | jq '.[] | .name'
unset token
```

> **Shell expansion note:** `VAR=value command` works for child processes (the alias pattern), but `$VAR` in the **same** command line expands before the assignment takes effect. For inline use with string interpolation, assign to a variable first.

### Export Fallback

Only when a tool requires a persistent environment variable:

```bash
export GITLAB_TOKEN=$(security find-generic-password -s "GITLAB_TOKEN" -w 2>/dev/null)
```

### Manage (Rotate, Delete)

```bash
# Rotate — update the stored value (interactive, avoids shell history)
security add-generic-password -a "$(whoami)" -s "GITLAB_TOKEN" -w -U

# Delete
security delete-generic-password -a "$(whoami)" -s "GITLAB_TOKEN"

# List all generic passwords (useful for auditing)
security dump-keychain | grep "svce" | sort -u
```

### Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `security: SecKeychainSearchCopyNext: The specified item could not be found` | Secret doesn't exist or wrong service name | Verify with `security dump-keychain \| grep "svce"` |
| Keychain prompt every time | "Always Allow" not set for `security` | Open Keychain Access → find the item → Access Control → add `/usr/bin/security` |
| `errSecDuplicateItem` on add | Entry already exists | Use `-U` flag to update, or delete first |
| Empty string returned | Secret exists but locked keychain | Run `security unlock-keychain ~/Library/Keychains/login.keychain-db` |
| Works in Terminal, not in IDE | IDE uses a different shell / keychain context | Ensure `_keychain_get` is in the shell profile sourced by your IDE |

---

## Linux — Kernel Keyring via `keyctl`

The Linux kernel keyring stores secrets in kernel memory — they never touch disk. Secrets are scoped to the session and cleared on logout (for `@s`) or persist for the user session (for `@u`).

### Install keyutils

```bash
# Debian / Ubuntu
sudo apt-get install -y keyutils

# RHEL / Fedora / Amazon Linux
sudo dnf install -y keyutils

# Alpine
sudo apk add keyutils
```

### Store a Secret

```bash
# Inline (⚠️ appears in shell history)
keyctl add user GITLAB_TOKEN "glpat-xxxxxxxxxxxx" @u

# Interactive — avoids shell history
read -rsp "Enter secret: " val && keyctl add user GITLAB_TOKEN "$val" @u && unset val
```

### JIT Fetching (Recommended)

```bash
# Fetch a secret from Linux kernel keyring
_keyring_get() {
  local key_id
  key_id=$(keyctl search @u user "$1" 2>/dev/null) || return 1
  keyctl pipe "$key_id" 2>/dev/null
}
```

Use it inline:

```bash
GITLAB_TOKEN=$(_keyring_get GITLAB_TOKEN) glab auth status
GITLAB_TOKEN=$(_keyring_get GITLAB_TOKEN) curl -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  https://gitlab.com/api/v4/projects
```

### Export Fallback

```bash
export GITLAB_TOKEN=$(_keyring_get GITLAB_TOKEN)
```

### Keyring Types

| Keyring | Symbol | Scope | Lifetime | Best For |
|---|---|---|---|---|
| Thread | `@t` | Current thread only | Thread exit | Highly isolated, short-lived ops |
| Process | `@p` | Current process only | Process exit | Single-script secrets |
| Session | `@s` | Current login session | Logout / session end | Interactive shell secrets |
| User | `@u` | All sessions for the user | Until explicitly removed or reboot | Persistent per-user secrets |

> **Recommendation:** Use `@u` for secrets that should survive across terminal sessions. Use `@s` for secrets you want auto-cleared on logout.

### Manage (Rotate, Delete)

```bash
# Rotate — overwrite existing key
keyctl add user GITLAB_TOKEN "glpat-new-value" @u

# Delete
key_id=$(keyctl search @u user GITLAB_TOKEN 2>/dev/null) && keyctl unlink "$key_id" @u

# List all keys in user keyring
keyctl show @u

# Set expiry (auto-delete after 1 hour)
key_id=$(keyctl search @u user GITLAB_TOKEN 2>/dev/null) && keyctl timeout "$key_id" 3600
```

---

## Windows — Git Credential Manager

Git Credential Manager (GCM) ships with Git for Windows and stores credentials in the Windows Credential Manager (DPAPI-encrypted). It works in Git Bash, PowerShell, and CMD.

### Verify GCM Installed

```bash
git credential-manager --version
# Expected: git-credential-manager 2.x.x
```

If missing, install [Git for Windows](https://gitforwindows.org/) (GCM is bundled) or install standalone from [GitHub](https://github.com/git-ecosystem/git-credential-manager/releases).

### Store a Secret

**Git Bash:**

```bash
printf "protocol=https\nhost=secrets.local\npath=GITLAB_TOKEN\nusername=token\npassword=glpat-xxxxxxxxxxxx\n\n" \
  | git credential approve
```

**PowerShell:**

```powershell
@"
protocol=https
host=secrets.local
path=GITLAB_TOKEN
username=token
password=glpat-xxxxxxxxxxxx

"@ | git credential approve
```

### JIT Fetching (Recommended)

**Git Bash:**

```bash
_gcm_get() {
  printf "protocol=https\nhost=secrets.local\npath=%s\nusername=token\n\n" "$1" \
    | git credential fill 2>/dev/null \
    | grep "^password=" | cut -d= -f2-
}

# Use inline
GITLAB_TOKEN=$(_gcm_get GITLAB_TOKEN) glab auth status
```

**PowerShell:**

```powershell
function Get-Secret {
    param([string]$Name)
    $input = "protocol=https`nhost=secrets.local`npath=$Name`nusername=token`n`n"
    $result = $input | git credential fill 2>$null
    ($result | Select-String "^password=") -replace "^password=", ""
}

# Use inline
$env:GITLAB_TOKEN = Get-Secret "GITLAB_TOKEN"
glab auth status
$env:GITLAB_TOKEN = $null  # Clear after use
```

### Export Fallback

**Git Bash:**

```bash
export GITLAB_TOKEN=$(_gcm_get GITLAB_TOKEN)
```

**CMD (.bat file):**

```bat
@echo off
for /f "tokens=2 delims==" %%a in (
  'echo protocol^=https^&echo host^=secrets.local^&echo path^=GITLAB_TOKEN^&echo username^=token^&echo.^| git credential fill 2^>nul ^| findstr "^password="'
) do set "GITLAB_TOKEN=%%a"
```

### Manage (Rotate, Delete)

```bash
# Delete (then re-store with new value to rotate)
printf "protocol=https\nhost=secrets.local\npath=GITLAB_TOKEN\nusername=token\npassword=anything\n\n" \
  | git credential reject

# Verify deletion
_gcm_get GITLAB_TOKEN  # Should return empty
```

---

## Cross-Platform — Git Credential Manager

GCM works identically on **macOS**, **Linux**, and **Windows**. If your team uses multiple operating systems, GCM provides a single workflow everywhere:

```bash
# Install (macOS — via Homebrew)
brew install --cask git-credential-manager

# Install (Linux — .deb)
curl -sL https://aka.ms/gcm/linux-install-source.sh | sh
git-credential-manager configure

# Store, retrieve, and delete commands are identical across all platforms
# (see the Windows section above — same commands work everywhere)
```

The `_gcm_get` helper function from the Windows section works unchanged on macOS and Linux.

> **When to prefer GCM over OS-native stores:** When you need a single set of shell functions that work across all your machines, or when working in containers/WSL where native Keychain/keyring may not be available.

---

## HashiCorp Vault (Enterprise & Team Sharing)

Vault provides centralized secret management, auditable access, dynamic credentials, and team secret sharing.

### When to Use Vault

- **Centralized management** — single source of truth for team/org secrets
- **Audit requirements** — every secret access is logged
- **Dynamic credentials** — database passwords generated on demand with short TTLs
- **Team sharing** — RBAC-controlled access to shared secrets
- **Compliance** — production databases should use Vault for dynamic credentials

### Install CLI

```bash
# macOS
brew install hashicorp/tap/vault

# Linux (Debian/Ubuntu)
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" \
  | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt-get update && sudo apt-get install -y vault

# Windows (Chocolatey)
choco install vault

# Verify
vault version
```

### Authentication Methods

| Method | Use Case | Command |
|---|---|---|
| OIDC (browser) | Standard interactive developer access | `vault login -method=oidc` |
| Token (paste) | When behind proxy or browser-assisted | `vault login` (paste token from UI) |
| AppRole | Machine-to-machine, services, CI/CD | `vault write auth/approle/login role_id=X secret_id=Y` |
| LDAP | Enterprise directory integration | `vault login -method=ldap username=jsmith` |

> ⚠️ **Azure AD App Proxy limitation:** If your Vault instance is behind Azure AD Application Proxy (common in enterprise environments), standard `vault login -method=oidc` will **fail** because the proxy intercepts the OIDC callback. Use the **browser-assisted token** method instead:
>
> 1. Open the Vault UI in your browser (authenticates via Azure AD SSO)
> 2. Copy your token from the UI (top-right → "Copy token")
> 3. Run `vault login` and paste the token
>
> Wrap this in a shell helper:
> ```bash
> vault-login() {
>   echo "Opening Vault UI — copy your token after SSO login..."
>   open "https://vault.example.com/ui/vault/dashboard"  # macOS
>   read -rsp "Paste token: " token && echo
>   vault login "$token" && unset token
> }
> ```

### Store and Retrieve (KV v2)

```bash
# Set the Vault address in your shell profile
export VAULT_ADDR="https://vault.example.com"

# Authenticate (use vault-login helper if behind App Proxy)
vault login -method=oidc   # or: vault-login

# Store a secret
vault kv put secret/tokens/gitlab value="glpat-xxxxxxxxxxxx"

# Retrieve (full output)
vault kv get secret/tokens/gitlab

# Retrieve a specific field
vault kv get -field=value secret/tokens/gitlab
```

### JIT Fetching (Recommended)

```bash
# Fetch a secret from Vault KV v2
_vault_get() {
  vault kv get -field="${2:-value}" "secret/$1" 2>/dev/null
}

# Use with alias (env var scoped to child process)
alias gl='GITLAB_TOKEN=$(_vault_get tokens/gitlab) glab'

# Use with variable assignment (for string interpolation)
token=$(_vault_get tokens/gitlab)
curl -sH "PRIVATE-TOKEN: $token" https://gitlab.com/api/v4/projects
unset token
```

### Resilient Fallback Wrapper

Use Vault as the primary source with OS-native credential stores as a fallback:

```bash
# Universal secret getter: Vault → OS keychain → fail
_secret_get() {
  local name="$1"

  # Try Vault first (if VAULT_ADDR is set and vault is authenticated)
  if [ -n "${VAULT_ADDR:-}" ] && command -v vault &>/dev/null; then
    local val
    val=$(vault kv get -field=value "secret/$name" 2>/dev/null) && [ -n "$val" ] && echo "$val" && return 0
  fi

  # Fall back to OS-native store
  case "$(uname -s)" in
    Darwin)
      security find-generic-password -s "$name" -w 2>/dev/null && return 0
      ;;
    Linux)
      local key_id
      key_id=$(keyctl search @u user "$name" 2>/dev/null) && keyctl pipe "$key_id" 2>/dev/null && return 0
      ;;
    MINGW*|MSYS*|CYGWIN*)
      printf "protocol=https\nhost=secrets.local\npath=%s\nusername=token\n\n" "$name" \
        | git credential fill 2>/dev/null | grep "^password=" | cut -d= -f2- && return 0
      ;;
  esac

  echo "ERROR: Secret '$name' not found in Vault or OS store" >&2
  return 1
}

# Usage — works everywhere, prefers Vault when available
GITLAB_TOKEN=$(_secret_get GITLAB_TOKEN) glab auth status
```

### Dynamic Database Credentials

For production databases, Vault generates short-lived credentials on demand:

```bash
# Request dynamic credentials (returns username + password with a TTL)
vault read database/creds/myapp-readonly
# Key             Value
# ---             -----
# lease_id        database/creds/myapp-readonly/abcd1234
# lease_duration  15m
# username        v-oidc-myapp-readonly-abc123
# password        A1b2C3d4E5f6...

# Use in a script
creds=$(vault read -format=json database/creds/myapp-readonly)
DB_USER=$(echo "$creds" | jq -r '.data.username')
DB_PASS=$(echo "$creds" | jq -r '.data.password')
psql "postgresql://${DB_USER}:${DB_PASS}@db.example.com:5432/mydb" -c "SELECT 1;"

# Credentials auto-expire after the lease duration (typically 15 min)
# Revoke early if done sooner:
vault lease revoke database/creds/myapp-readonly/abcd1234
```

### Vault vs OS-Native Stores

| Feature | OS Keychain / Keyring / GCM | HashiCorp Vault |
|---|---|---|
| Encryption at rest | ✅ OS-managed | ✅ Vault-managed (seal/unseal) |
| Audit logging | ❌ None | ✅ Every access logged |
| Dynamic credentials | ❌ Static only | ✅ Short-lived, auto-rotating |
| Team sharing | ❌ Single user | ✅ RBAC, policies, namespaces |
| Offline access | ✅ Always available | ❌ Requires network |
| Setup complexity | ✅ Zero (built-in) | ⚠️ Requires server, auth config |
| CI/CD integration | ⚠️ Limited | ✅ Native (AppRole, JWT, OIDC) |
| Cost | Free | Requires infrastructure |

---

## Quick Decision Guide

```
Do you have a HashiCorp Vault instance?
├── YES → Use Vault with OS-native fallback (_secret_get wrapper)
│         └── Production database? → use Vault dynamic credentials
└── NO → Which OS?
         ├── macOS    → Keychain via `security` CLI
         ├── Linux    → Kernel keyring via `keyctl`
         ├── Windows  → Git Credential Manager
         └── Cross-platform team? → Git Credential Manager (works everywhere)

Does the tool require a persistent $ENV_VAR?
├── YES → `export VAR=$(...)` fallback (clear when done)
└── NO  → JIT fetching (recommended — always prefer this)
```

---

## Common Mistakes

- **Storing tokens in `.bashrc` / `.zshrc` / `.env` files** — these are plaintext, backed up, and often accidentally committed to git. Use a credential store instead.
- **Committing `.env` files to source control** — add `.env*` to `.gitignore` globally:
  ```bash
  echo ".env*" >> ~/.gitignore_global
  git config --global core.excludesfile ~/.gitignore_global
  ```
- **Using `export` when JIT suffices** — `export` keeps the secret in your environment for the entire session, visible to all child processes and debuggers.
- **Hardcoding secrets in Terraform / IaC** — reference Vault or a secrets manager instead.
- **Sharing secrets via Slack / email / tickets** — use Vault or a secrets manager with RBAC. If you must share one-time, use a tool like [Yopass](https://yopass.se/) or Vault's transit engine.
- **Never rotating credentials** — machine credentials should rotate on a regular schedule. Set a calendar reminder or automate with Vault.
- **Reusing the same token everywhere** — if one system is compromised, all are compromised. Use scoped, per-service tokens.
- **Ignoring the audit trail** — if you can't answer "who accessed this secret and when?", you have a compliance gap. Use Vault for anything beyond personal dev tokens.
- **Baking secrets into container images** — images are cached, shared, and inspectable. Inject secrets at runtime via env vars or mounted volumes.
- **Using interactive `read -s` in CI/CD** — CI has no TTY. Use Vault AppRole or environment-injected secrets from your CI platform's secret store.

---

## See Also

### Man Pages and CLI Help
- `man security` — macOS Keychain CLI (or `security help`)
- `man keyctl` — Linux kernel keyring management
- `git credential --help` — Git Credential Manager
- `vault --help` — HashiCorp Vault CLI

### Official Documentation
- [macOS Keychain Services](https://developer.apple.com/documentation/security/keychain_services)
- [Linux Kernel Key Retention Service](https://www.kernel.org/doc/html/latest/security/keys/core.html)
- [Git Credential Manager](https://github.com/git-ecosystem/git-credential-manager)
- [HashiCorp Vault](https://developer.hashicorp.com/vault/docs)
- [Vault Database Secrets Engine](https://developer.hashicorp.com/vault/docs/secrets/databases)
- [Vault KV Secrets Engine v2](https://developer.hashicorp.com/vault/docs/secrets/kv/kv-v2)
