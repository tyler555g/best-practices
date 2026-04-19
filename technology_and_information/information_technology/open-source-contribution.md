# Open Source Contribution Best Practices

## The Golden Rule

**When you improve open source code, contribute it back before publishing independently.**

## Correct Flow

```
fork → improve → PR upstream
               ↓ (if accepted)
               upstream maintainer publishes
               ↓ (if declined, with good reason)
               publish standalone with explicit attribution
```

## What NOT to Do

- ❌ Fork → improve → publish as your own package without a PR
- ❌ Strip or obscure the original project's attribution
- ❌ Change the license without understanding the original license terms
- ❌ Fragment the ecosystem when the improvement belongs upstream

## When Opening a PR Upstream

1. Ensure your changes are non-breaking and additive where possible
2. Reference any methodologies, frameworks, or sources you used
3. Include attribution for AI tools used in development
4. Write a clear description of what changed and why

## Attribution in Your Fork

Always include in `README.md` and `package.json`:
```markdown
Forked from [original-org/original-repo](https://github.com/original-org/original-repo)
```

Always include in commit messages:
```
Co-authored-by: Original Author <email>
```

## License Compliance

- MIT: keep copyright notice, include license
- Apache 2.0: include NOTICE file, keep copyright
- GPL: derivative works must also be GPL
- When in doubt, read the license and ask

## See Also
- [Open Source Guide — How to Contribute](https://opensource.guide/how-to-contribute/)
- [Choose a License](https://choosealicense.com)
