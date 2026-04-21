# Power BI Semantic Model Best Practices

Comprehensive reference for designing, building, and operating Power BI / Microsoft Fabric semantic models. Covers model design, query folding, incremental refresh, performance, TMDL authoring, deployment, and security.

**Sources:**
- [Power BI Optimization Guide](https://learn.microsoft.com/en-us/power-bi/guidance/power-bi-optimization)
- [Star Schema Design](https://learn.microsoft.com/en-us/power-bi/guidance/star-schema)
- [Query Folding Guidance](https://learn.microsoft.com/en-us/power-bi/guidance/power-query-folding)
- [Incremental Refresh Overview](https://learn.microsoft.com/en-us/power-bi/connect-data/incremental-refresh-overview)
- [Import Modeling Data Reduction](https://learn.microsoft.com/en-us/power-bi/guidance/import-modeling-data-reduction)
- [Measures in Power BI](https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-measures)
- [TMDL Overview](https://learn.microsoft.com/en-us/analysis-services/tmdl/tmdl-overview)

---

## 1. Semantic Model Design

### Star Schema

- **Always prefer star schema** over flat/wide tables. Dimension tables filter and group; fact tables store numeric measures.
- Each fact table should load data at a **consistent grain** (e.g., one row per order line, one row per day-product).
- Denormalize snowflake dimensions into single dimension tables — fewer tables = simpler filter propagation and faster queries.
- Avoid single flat tables with 100+ columns; split into fact + dimension tables linked by surrogate keys.

### Storage Mode Selection

| Mode | Use When |
|---|---|
| **Import** | Best performance. Data fits in memory. Refresh latency is acceptable (scheduled). Default choice. |
| **Direct Lake** | Data resides in OneLake (Delta/Parquet). Combines Import-like performance with DirectQuery-like freshness. Fabric-native — no scheduled refresh needed for data already in lakehouse. |
| **DirectQuery** | Real-time requirement. Source is a fast analytical engine (Synapse, Databricks SQL). Data too large for import. |
| **Composite** | Mix Import dimensions (fast filtering) with DirectQuery fact tables (real-time or very large). Drillthrough pages on DirectQuery, summary on Import. |

- Start with **Import** unless you have a compelling reason for another mode.
- In **Fabric**, prefer **Direct Lake** when data is already in a lakehouse — it avoids refresh scheduling entirely.
- Direct Lake has **guardrails** (row count, column count limits per SKU). When guardrails are exceeded the behavior depends on the `DirectLakeBehavior` model property: in **Automatic** mode (the default) the engine falls back to DirectQuery over the SQL analytics endpoint; in **DirectLakeOnly** mode the query fails instead. Monitor the `DirectLakeQueryMode` DAX event to detect fallback. See [Direct Lake overview](https://learn.microsoft.com/en-us/power-bi/enterprise/directlake-overview).
- DirectQuery and Dual tables **must** fold all Power Query steps — no client-side transforms allowed.

### Naming Conventions

- Use **business-friendly names** for tables, columns, and measures — `Sales Amount`, not `SLS_AMT`.
- No abbreviations, underscores, or prefixes unless they are universally understood (`SKU`, `UPC`).
- Table names should be **singular nouns** (`Product`, `Customer`, `Calendar`) or descriptive phrases (`Sales Order`).
- Measure names should describe the calculation: `Total Revenue`, `YTD Sales`, `Avg Order Value`.

### Column and Data Type Best Practices

- Choose the **narrowest data type** that fits the data: `Int64` over `Decimal` when no fractional part exists.
- Convert text-prefixed numeric IDs to integers where possible — VertiPaq compresses numeric values (value encoding) far better than text (hash encoding).
- Set `summarizeBy: none` on key columns and non-aggregatable fields to prevent accidental SUM in visuals.
- Apply **data categories** to columns: `Geography`, `WebURL`, `ImageURL` — enables map visuals and clickable links.

### Relationships

- Use **single-direction** cross-filtering (one-to-many from dimension to fact) by default.
- **Avoid bi-directional** relationships unless required for many-to-many bridge tables — they expand filter context unpredictably and complicate RLS.
- Every relationship must have a **single unique key** on the "one" side. Add a Power Query index column if the source lacks one.

### Role-Playing Dimensions (Date Tables)

Two valid approaches — choose based on your audience:

**Option A: Separate date tables per role** (recommended for self-service models)
- Create distinct date tables (`Order Date`, `Ship Date`, `Due Date`) — each with an active relationship to the fact table.
- Consumers can filter by any date role without DAX knowledge.
- Trades slightly more memory for better discoverability.

**Option B: Single date table with inactive relationships** (acceptable for developer-authored models)
- One physical `Calendar` table with an active relationship for the primary date role.
- Secondary date roles use inactive relationships, activated in DAX: `CALCULATE([Sales], USERELATIONSHIP(Orders[ShipDate], Calendar[Date]))`.
- Saves memory but requires measure authors to know `USERELATIONSHIP`.

### Date Table Requirements

- Every model with date-based analysis **must** have a dedicated date/calendar table.
- **Mark as Date Table** in the model so time intelligence functions (TOTALYTD, SAMEPERIODLASTYEAR) work correctly.
- Disable **Auto date/time** in Power BI Desktop options — it creates hidden date tables for every date column, bloating the model.

---

## 2. Query Folding & Data Loading

### What Query Folding Is

**Query folding** is the ability of Power Query to translate M steps into a single native query (SQL, OData, etc.) executed by the data source. When folding occurs, the source does the heavy lifting — filtering, joining, projecting — instead of the Power Query mashup engine fetching all rows and processing in memory.

### Why It Matters

- **Import mode:** Folding dramatically reduces refresh time and memory. Without it, the mashup engine downloads the entire table before filtering.
- **DirectQuery / Dual mode:** Folding is **mandatory**. Steps that break folding will fail or cause full table scans.
- **Incremental refresh:** If the `RangeStart`/`RangeEnd` filter doesn't fold, every partition refresh downloads all rows — defeating the purpose.

### Verifying Folding

- **Power Query Diagnostics:** Enable diagnostics, run a refresh preview, and inspect the generated SQL in the diagnostics output.
- **SQL Profiler / Extended Events:** Trace queries against SQL Server or Azure SQL to confirm WHERE clauses include your date filters.
- **pg_stat_activity / query logs:** For PostgreSQL sources, check active queries during refresh.
- **Right-click a step → "View Native Query":** If grayed out, that step does not fold.

### Value.NativeQuery Patterns

Use `Value.NativeQuery` when you need full control over the SQL sent to the source:

```m
// Folding enabled — subsequent M steps CAN fold on top of this query
let
    Source = Sql.Database("server", "database"),
    Data = Value.NativeQuery(Source,
        "SELECT * FROM dbo.FactSales WHERE Status = 'Active'",
        null,
        [EnableFolding = true]
    ),
    Filtered = Table.SelectRows(Data, each [OrderDate] >= RangeStart and [OrderDate] < RangeEnd)
in
    Filtered
```

```m
// Folding disabled — use when the query is final (stored proc, complex CTE)
let
    Source = Sql.Database("server", "database"),
    Data = Value.NativeQuery(Source,
        "EXEC dbo.usp_GetSales @start, @end",
        [start = RangeStart, end = RangeEnd],
        [EnableFolding = false]
    )
in
    Data
```

- Set `EnableFolding = true` when the native query is a simple SELECT that Power Query can further optimize.
- Set `EnableFolding = false` for stored procedures, CTEs, or any query where additional folding is unwanted.
- **DirectQuery tables cannot use stored procedures or CTEs** in native queries — only SELECT statements.

### Parameter Passing for Incremental Refresh

The **recommended** pattern for incremental refresh is `Table.SelectRows` with a foldable source — this guarantees proper partition pruning:

```m
// RECOMMENDED: Standard foldable pattern for incremental refresh
let
    Source = Sql.Database("server", "database"),
    Data = Source{[Schema="dbo", Item="FactSales"]}[Data],
    Filtered = Table.SelectRows(Data, each [OrderDate] >= RangeStart and [OrderDate] < RangeEnd)
in
    Filtered
```

**Alternative — Value.NativeQuery with parameters:** Works for SQL Server (named parameters fold), but requires **verification** for other connectors (PostgreSQL, Oracle). Always confirm folding via diagnostics:

```m
// ALTERNATIVE: Native query with RangeStart/RangeEnd — verify folding!
let
    Source = Sql.Database("server", "database"),
    Data = Value.NativeQuery(Source,
        "SELECT * FROM dbo.FactSales WHERE OrderDate >= @start AND OrderDate < @end",
        [start = RangeStart, end = RangeEnd],
        [EnableFolding = true]
    )
in
    Data
```

**⚠️ Warning:** If the `RangeStart`/`RangeEnd` filter does not fold, the engine downloads all rows and filters client-side — defeating the purpose of incremental refresh. Always verify.

### M String Interpolation Fallback

For non-folding connectors (REST APIs, files), embed `RangeStart`/`RangeEnd` directly in the query string:

```m
let
    startStr = DateTime.ToText(RangeStart, [Format="yyyy-MM-dd'T'HH:mm:ss'Z'"]),
    endStr   = DateTime.ToText(RangeEnd,   [Format="yyyy-MM-dd'T'HH:mm:ss'Z'"]),
    url = "https://api.example.com/data?from=" & startStr & "&to=" & endStr,
    Source = Json.Document(Web.Contents(url))
in
    Source
```

### Single Data Source Rule

- **All partitions** (import and DirectQuery) in an incremental refresh table must query from a **single data source**.
- You cannot mix two SQL servers or a SQL server and a file source within the same partitioned table.

---

## 3. Incremental Refresh

### RangeStart / RangeEnd Parameters

- **Case-sensitive**, **DateTime type** — must be named exactly `RangeStart` and `RangeEnd`.
- Created as Power Query parameters; the service overrides their values at refresh time to define each partition's date window.
- The filter using these parameters must **fold** to the data source. If it doesn't fold, the engine downloads all rows and filters client-side — causing full table scans.

### Rolling Window Pattern

Incremental refresh creates two zones of partitions:

| Zone | Behavior |
|---|---|
| **Archive (historical)** | Partitions outside the refresh window. **Never re-refreshed** unless manually via XMLA. Merged over time for efficiency. |
| **Refresh window** | Recent partitions re-refreshed on every scheduled refresh to capture late-arriving data. |

- Set the **archive period** to cover all data history needed for reporting (e.g., 3 years).
- Set the **refresh window** to the period where data may still change (e.g., 30 days).

### Granularity Choices

| Granularity | When to Use |
|---|---|
| **Day** | Default for most transactional data. Good balance of partition count and refresh precision. |
| **Hour** | High-velocity data where you need sub-day refresh targeting. Increases partition count. |
| **Month** | Slowly changing data or very long history (many years). Fewer partitions, coarser refresh. |

- More partitions = more precise refresh targeting but higher management overhead.
- For most scenarios, **Day** granularity is the right default.

### Detect Data Changes (pollingExpression)

- Enables the service to skip refreshing partitions **within the incremental refresh window** when no data has changed, by evaluating a polling expression such as `MAX(ModifiedDate)` against each partition's date range.
- Applies to partitions in the **refresh window** (not archive partitions — those are already excluded from routine refresh). If the polling expression returns the same value as the previous refresh, the partition is skipped.
- Configure via the Power BI Desktop incremental refresh dialog ("Detect data changes" checkbox and column picker). Advanced users can also set `pollingExpression` directly via XMLA/TMDL:

```json
"pollingExpression": "MAX([ModifiedDate])"
```

- See [Incremental refresh — detect data changes](https://learn.microsoft.com/en-us/power-bi/connect-data/incremental-refresh-configure#detect-data-changes).

### Partition Management via XMLA (Advanced)

- Premium/Fabric capacity exposes an **XMLA read/write endpoint** for direct partition management.
- Use cases: force-refresh a specific historical partition, add custom partitions, merge old partitions.
- Tools: SQL Server Management Studio (SSMS), Tabular Editor, TMSL scripts, TOM via C#/Python.

### Real-Time DirectQuery Partition (Premium Only)

- Adds a **DirectQuery partition** that covers the period after the last import refresh, so reports always show the latest data.
- Requires Premium/PPU/Embedded capacity and a foldable data source.
- The DirectQuery partition filter is automatically updated after each import refresh.

### Common Pitfalls

- **Client-side filtering if folding fails:** The mashup engine silently downloads all rows and filters locally. Verify folding.
- **Full table scan on first refresh:** The first publish creates all historical partitions at once. Plan capacity for this initial load.
- **No proper datetime column:** Incremental refresh requires a datetime (or integer surrogate key) column. Without one, the date filter cannot be applied.
- **Time limits:** Pro models have a 2-hour refresh limit; Premium models have 5 hours. Design partitions to stay within limits.

---

## 4. Model Optimization for Consumers

### Descriptions (Self-Service Discoverability)

- Add **descriptions** to every table, column, and measure. These appear in Power BI Desktop field tooltips, Excel "Analyze in Excel", and the web Field List.
- Explain not just *what* the field is, but *how to use it*: `"Net revenue after returns and discounts. Use for P&L reporting."`

### Hide Technical Columns

- **Hide** surrogate keys, relationship columns, and any columns not intended for direct reporting use.
- Hidden columns are still available for DAX calculations and can be un-hidden by advanced users.
- Hide raw data columns that have a corresponding measure (e.g., hide `Quantity` column, expose `Total Quantity` measure).

### Measures vs Calculated Columns

- **Prefer measures** for any aggregation or computation displayed in visuals. Measures are evaluated at query time and respect filter context.
- Use **calculated columns** only when you need row-level values for sorting, filtering, or relationships that cannot be expressed in a measure.
- Calculated columns consume memory (stored in the model) and increase refresh time. Power Query computed columns are more efficient than DAX calculated columns.

```dax
// Good — measure, evaluated at query time
Sales Amount = SUMX('Sales', 'Sales'[Quantity] * 'Sales'[Net Price])

// Avoid unless necessary — calculated column, stored in memory
Margin % = DIVIDE('Sales'[Profit], 'Sales'[Revenue])
```

### Format Strings

- Apply format strings to all measures: currency (`$ #,##0`), percentages (`0.0%`), dates (`yyyy-MM-dd`).
- Use **dynamic format strings** for locale-aware or conditional formatting.

### Data Categories

- Set `dataCategory` on applicable columns: `City`, `Country`, `StateOrProvince`, `WebURL`, `ImageURL`.
- Enables auto-mapping in map visuals and clickable links in tables.

### Display Folders

- Organize measures into **display folders** when a table has more than ~10 measures.
- Use backslash for nesting: `Financial\Revenue`, `Financial\Cost`.
- Create a dedicated measures table for cross-table measures.

### Calculation Groups

- Use **calculation groups** for reusable time intelligence patterns (YTD, QTD, PY, PY YTD) instead of duplicating measures.
- A single `Time Calculation` group can replace dozens of individual time-intelligence measures.
- Calculation groups apply to all measures uniformly — test edge cases with non-additive measures.

---

## 5. Performance Best Practices

### Data Reduction (Filter Early, Project Only Needed Columns)

- Apply **vertical filtering** — remove columns not needed for reporting or model structure.
- Apply **horizontal filtering** — load only the rows needed (filter by date range, active records, relevant regions).
- Push `GROUP BY` / aggregation to the source (SQL view or stored procedure) when detail rows are not needed.
- The VertiPaq engine achieves ~10x compression, but less data in = faster refresh + smaller model + better query performance.

### Avoid High-Cardinality Text Columns

- Text columns use **hash encoding** — each unique value gets a numeric ID. High-cardinality text (GUIDs, free-text descriptions, long URLs) compresses poorly.
- If a text column has millions of unique values and isn't needed for filtering/display, remove it.
- Convert text-prefixed numeric IDs to integers where possible.

### Pre-Aggregate at the Source

- For summary-only reporting, load pre-aggregated data (daily totals, monthly summaries) instead of transaction-level detail.
- Use Composite models to combine aggregated Import tables with DirectQuery detail tables for drillthrough.

### Aggregation Tables

- For large DirectQuery/Composite models, define **aggregation tables** — smaller Import tables with pre-aggregated data that the engine uses to answer high-level queries without hitting the source.
- Use **automatic aggregations** (Fabric/Premium) or manually define aggregation mappings via Manage Aggregations in Power BI Desktop.
- The engine transparently routes queries to the aggregation table when the query grain matches; falls through to DirectQuery for detail.
- Design aggregation tables at the most common reporting grain (e.g., daily by product by region).

### Bi-Directional Relationship Impact

- Bi-directional cross-filtering expands the filter context in both directions, which can cause:
  - Unexpected query results (filters flowing "backwards" through the model).
  - Performance degradation from larger materialized tables during query evaluation.
  - RLS bypass risks if not carefully tested.
- Use single-direction filtering and explicit DAX (`CROSSFILTER`) when bidirectional behavior is needed in specific calculations.

### DAX Performance

- Use `SUMMARIZECOLUMNS` over `SUMMARIZE` — it is the function the engine generates for visual queries and is optimized by the storage engine.
- Avoid iterator functions (`SUMX`, `FILTER`) over large tables when a simpler aggregation (`SUM`, `CALCULATE`) works.
- Use variables (`VAR`) to avoid repeated evaluation of the same sub-expression.

```dax
// Good — variable prevents double evaluation
VAR TotalSales = [Sales Amount]
VAR TotalCost  = [Total Cost]
RETURN DIVIDE(TotalSales - TotalCost, TotalSales)
```

### Default Report Filters

- Configure **default filters/slicers** on reports to avoid loading the entire dataset on first render.
- Use "Top N" filters on table visuals to cap row counts (e.g., 10,000) — users can still filter further.

---

## 6. Report Design

### Default Filters and Slicers

- **Always set restrictive defaults** — filter to the current year/month, active products, relevant region.
- Use **relative date filters** (e.g., "Last 30 days") so reports stay current without manual adjustment.

### Visual Count Per Page

- Limit to **8–10 visuals per page** for optimal rendering performance.
- Each visual generates a separate DAX query; more visuals = more concurrent queries = slower page load.
- Use **drillthrough pages** for detail instead of cramming everything onto one page.

### Bookmarks Over Duplicate Pages

- Use **bookmarks** to toggle visibility of visual groups rather than creating many similar pages.
- Reduces report file size and simplifies maintenance.

### Conditional Formatting

- Prefer **conditional formatting rules** (color scales, icons, data bars) over many static formatting overrides.
- Reference measures for dynamic formatting thresholds.

### Drillthrough Pages

- Create **drillthrough pages** for entity-level detail (e.g., drill from a product summary to individual order lines).
- Keep the drillthrough page focused — 3–5 visuals maximum.

### Cross-Filter vs Cross-Highlight

- **Cross-highlight** (default): Other visuals dim non-matching data but still show totals. Better for context.
- **Cross-filter**: Other visuals remove non-matching data entirely. Better for focused analysis.
- Set the default interaction type per visual under **Format → Edit interactions**.

---

## 7. TMDL Authoring Best Practices

### File Structure

Standard TMDL folder layout:

```
.SemanticModel/
├── definition/
│   ├── database.tmdl
│   ├── model.tmdl
│   ├── expressions.tmdl
│   ├── relationships.tmdl
│   ├── roles/
│   │   └── reader.tmdl
│   ├── tables/
│   │   ├── Calendar.tmdl
│   │   ├── Product.tmdl
│   │   ├── Sales.tmdl
│   │   └── ...
│   └── cultures/
│       └── en-US.tmdl
└── .platform
```

- One file per table — all columns, measures, hierarchies, and partitions for that table live in its `.tmdl` file.
- Root-level files for model metadata, expressions (shared M parameters), relationships, and data sources.

### lineageTag GUIDs

- Every table, column, measure, hierarchy, and partition has a `lineageTag` GUID.
- **Must be unique** within the model and **stable across deployments** — do not regenerate on each save.
- If you copy a table definition, **generate new GUIDs** for the copy to avoid conflicts.
- Format: lowercase UUID without braces — `e9374b9a-faee-4f9e-b2e7-d9aafb9d6a91`.

### Annotation Patterns

Common annotations and what they mean:

| Annotation | Purpose |
|---|---|
| `PBI_ResultType` | Marks the output type of a measure (e.g., `Table` for calculated tables). |
| `__PBI_IncrRefreshPolicy` | Stores incremental refresh policy JSON for a table. |
| `SummarizationSetBy` | Records who/what set the default aggregation (e.g., `User`, `Default`). The actual aggregation is controlled by the `summarizeBy` column property — set `summarizeBy: none` on keys and non-aggregatable columns. |
| `PBI_FormatHint` | Stores format string metadata for Power BI Desktop. |
| `PBI_NavigationStepName` | Tracks the Power Query navigation step name for source binding. |

### sourceColumn Matching

- `sourceColumn` must exactly match the column name output by the partition M expression.
- **Case-sensitive** for many connectors (PostgreSQL, Spark, Fabric Lakehouse).
- If the source column has spaces, quote it in the M expression and use the exact name in `sourceColumn`.

```tmdl
column 'Net Price'
    dataType: double
    sourceColumn: Net Price
    summarizeBy: none
    lineageTag: a1b2c3d4-...
```

### Partition Expressions

- Use triple-backtick blocks for multi-line M expressions:

```tmdl
partition 'Sales-Partition' = m
    mode: import
    source = ```
        let
            Source = Sql.Database(Server, Database),
            dbo_Sales = Source{[Schema="dbo", Item="FactSales"]}[Data],
            Filtered = Table.SelectRows(dbo_Sales, each [OrderDate] >= RangeStart and [OrderDate] < RangeEnd)
        in
            Filtered
        ```
```

- Indentation within backtick blocks is preserved verbatim.
- For single-line expressions, use inline syntax: `partition P1 = m ... source = Source{[...]}[Data]`

### Compatibility Levels

- Fabric / Power BI Premium: **1567+** (latest features including calculation groups, dynamic format strings).
- Azure Analysis Services: **1200–1600** depending on feature set.
- Always set `compatibilityLevel` in `database.tmdl` to match your target deployment environment.

---

## 8. Deployment & Operations

### Git Integration (Fabric Workspace ↔ Repo)

- Fabric workspaces can sync directly with **Azure DevOps or GitHub** repositories.
- Each semantic model is serialized as a TMDL folder in the repo.
- Changes in the workspace are committed to the connected branch via an explicit **Commit** action; changes pushed to the branch are pulled into the workspace via an explicit **Update from Git** action. Neither direction is automatic — teams must actively sync. See [Fabric Git integration](https://learn.microsoft.com/en-us/fabric/cicd/git-integration/intro-to-git-integration).
- Use **feature branches** for development; merge to main to deploy.

### Deployment Pipelines (Dev → Test → Prod)

- Use Fabric **deployment pipelines** or Azure DevOps / GitHub Actions to promote artifacts across stages.
- Each stage can point to a different capacity, gateway, and data source connection.
- Parameterize connection strings in `expressions.tmdl` so they resolve per environment:

```tmdl
expression Server = "prod-server.database.windows.net"
    meta [IsParameterQuery=true, Type="Text", IsParameterQueryRequired=true]

expression Database = "SalesDB"
    meta [IsParameterQuery=true, Type="Text", IsParameterQueryRequired=true]
```

### Refresh Scheduling and Monitoring

- Schedule refreshes during **off-peak hours** to minimize capacity contention.
- Pro models: up to **8 refreshes/day**. Premium: up to **48 refreshes/day**.
- Monitor refresh history in the Power BI service → Dataset settings → Refresh history.
- Set up **email alerts** for refresh failures.
- Use the **Power BI REST API** `GET /datasets/{id}/refreshes` for programmatic monitoring.

### Gateway Configuration

- Required for **on-premises** or **VNet-private** data sources.
- Install the on-premises data gateway on a dedicated VM with sufficient CPU/RAM for concurrent refreshes.
- Use **gateway clusters** for high availability — distribute load across multiple gateway members.
- Map data source credentials in the gateway to service accounts, not personal accounts.

### XMLA Endpoint

- Premium/Fabric capacity exposes XMLA read/write for **programmatic management**.
- Use for: partition management, scripted deployments (TMSL/TOM), third-party tools (Tabular Editor, ALM Toolkit).
- Connection string: `powerbi://api.powerbi.com/v1.0/myorg/<workspace name>`.

### Monitoring

- **Refresh failures:** Power BI service alerts, REST API polling, Log Analytics integration.
- **Long-running queries:** Enable query logging in Premium capacity metrics app.
- **Capacity utilization:** Fabric Capacity Metrics app — monitor CU consumption, throttling events, overload state.
- Set up **Azure Monitor alerts** for sustained high utilization or repeated throttling.

---

## 9. Security

### Row-Level Security (RLS)

- Define roles in TMDL with DAX filter expressions on tables:

```tmdl
role RegionalManager
    modelPermission: read

    tablePermission Sales = 'Sales'[Region] = USERPRINCIPALNAME()
```

- Test with `EVALUATE CALCULATETABLE('Sales', ...)` queries via DAX query view or SSMS.
- RLS filters propagate through relationships — ensure relationship directions don't create unintended bypasses.
- **Dynamic RLS** (filter by `USERPRINCIPALNAME()` or a security table) is preferred over creating many static roles.

### Object-Level Security (OLS)

- Restrict visibility of sensitive columns or tables per role (e.g., hide `Salary` from non-HR roles).
- Defined via XMLA endpoint or Tabular Editor — not exposed in Power BI Desktop UI.
- OLS returns an error if a user queries a restricted column — plan report design accordingly.

### Workspace Roles

| Role | Can Do |
|---|---|
| **Admin** | Full control — manage members, delete workspace, configure settings. |
| **Member** | Publish content, edit items, share datasets. Cannot manage workspace settings. |
| **Contributor** | Create and edit content in the workspace. Cannot share or manage members. |
| **Viewer** | View reports and dashboards. Cannot edit or export underlying data (unless granted Build permission). |

- Follow **least privilege** — most consumers should be Viewers. Grant Build permission separately for self-service authoring.

### Service Principal Authentication

- Use **service principals** (Azure AD app registrations) for automated deployments, refresh orchestration, and CI/CD pipelines.
- Add the service principal to the workspace with the appropriate role (typically Member or Contributor).
- Enable "Allow service principals to use Power BI APIs" in the Fabric admin portal.

### Sensitivity Labels

- Apply **Microsoft Information Protection sensitivity labels** (Public, Internal, Confidential, Highly Confidential) to semantic models.
- Labels inherit downstream — reports built on a Confidential dataset inherit the Confidential label.
- Labels control export restrictions (e.g., block export to CSV for Highly Confidential data).

---

## 10. Common Antipatterns

### Using DirectQuery When Import Would Work

- DirectQuery sends a query to the source for **every visual interaction**. If the data fits in memory and doesn't need real-time, Import is dramatically faster.
- **Fix:** Default to Import. Switch to DirectQuery only for real-time or very large data.

### Not Verifying Query Folding

- If folding breaks silently, the mashup engine downloads the entire table and filters locally. Refresh times balloon; incremental refresh provides no benefit.
- **Fix:** Always verify folding via "View Native Query", Power Query Diagnostics, or source-side query tracing.

### Incremental Refresh Without a Proper DateTime Column

- Without a datetime (or integer surrogate key) column, `RangeStart`/`RangeEnd` filters have nothing to bind to.
- **Fix:** Ensure every fact table has a datetime column suitable for partitioning. Add one at the source if necessary.

### Over-Using Calculated Columns

- Calculated columns are evaluated at refresh time, stored in memory, and cannot leverage query folding.
- **Fix:** Use measures for aggregations. Use Power Query computed columns for row-level transformations that must be persisted.

### Bi-Directional Relationships Everywhere

- Bi-directional filtering causes ambiguous filter paths, unexpected query results, and potential RLS bypasses.
- **Fix:** Use single-direction relationships by default. Use `CROSSFILTER` in specific DAX measures where bidirectional behavior is needed.

### Single Flat Table With 100+ Columns

- Destroys compression efficiency, makes the model hard to understand, and forces every query to scan a massive table.
- **Fix:** Decompose into a star schema with proper dimension and fact tables.

### Not Setting Default Aggregation (`summarizeBy`)

- Key columns and non-aggregatable fields default to SUM in visuals if not explicitly set.
- **Fix:** Set `summarizeBy: none` on every key column, foreign key, and identifier in TMDL.

### Exposing All Columns to Report Authors

- A model with hundreds of visible columns overwhelms report authors and increases the chance of incorrect field usage.
- **Fix:** Hide technical columns (IDs, relationship keys, raw data columns with corresponding measures). Use display folders for organization.

---

## See Also

- [Star schema design guidance](https://learn.microsoft.com/en-us/power-bi/guidance/star-schema)
- [Query folding guidance](https://learn.microsoft.com/en-us/power-bi/guidance/power-query-folding)
- [Incremental refresh configure](https://learn.microsoft.com/en-us/power-bi/connect-data/incremental-refresh-configure)
- [Direct Lake overview](https://learn.microsoft.com/en-us/fabric/get-started/direct-lake-overview)
- [TMDL overview](https://learn.microsoft.com/en-us/analysis-services/tmdl/tmdl-overview)
- [Fabric Git integration](https://learn.microsoft.com/en-us/fabric/cicd/git-integration/intro-to-git-integration)
- [Power BI performance analyzer](https://learn.microsoft.com/en-us/power-bi/create-reports/desktop-performance-analyzer)
