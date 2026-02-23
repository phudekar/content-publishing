---
title: "Modern SQL & Data Modeling — Overview"
tags: [sql, postgresql, dimensional-modeling, window-functions]
---

# Week 2: Modern SQL & Data Modeling

## Summary

Move beyond SELECT statements — master window functions (ROW_NUMBER, LAG, LEAD, NTILE), CTEs, EXPLAIN ANALYZE. Second half covers Kimball dimensional modeling: facts vs dimensions, star schemas, SCDs.

## Key Topics

- **Window Functions** — ROW_NUMBER, RANK, LAG, LEAD, NTILE — perform calculations across rows without GROUP BY. Essential for analytics queries.
- **CTEs** — Common Table Expressions break complex queries into readable named steps. Support recursive patterns for hierarchical data.
- **[EXPLAIN ANALYZE](https://www.postgresql.org/docs/current/sql-explain.html)** — PostgreSQL's query execution plan tool. Shows actual execution time, row counts, and buffer usage for optimization.
- **[Kimball Dimensional Modeling](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/)** — Industry-standard methodology for designing data warehouses. Separates facts (events) from dimensions (context).
- **Star Schema** — Central fact table surrounded by dimension tables. Optimized for analytical queries with simple joins.
- **Slowly Changing Dimensions (SCD)** — Techniques to track historical changes in dimension data. Type 2 adds effective date ranges.
- **[PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)** — Binary JSON storage with indexing support. Enables semi-structured data queries alongside relational data.
- **[Materialized Views](https://www.postgresql.org/docs/current/sql-creatematerializedview.html)** — Pre-computed query results stored as tables. Refresh on demand for frequently-used aggregations.

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/current/)
- [Kimball Group Techniques](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/)
- [PostgreSQL Window Functions](https://www.postgresql.org/docs/current/tutorial-window.html)
- [Use The Index, Luke (SQL Performance)](https://use-the-index-luke.com/)

:::goal
Master analytical SQL patterns and design a dimensional model from scratch.
:::

:::deliverables
- Chinook DB loaded in PostgreSQL
- 10+ analytical queries using window functions and CTEs
- Star schema ERD diagram
- Fact + dimension DDL scripts with constraints
- Query performance comparison (before/after indexing)
:::

:::diagram
graph LR
    D1["dim_date"] --- F["fact_trips"]
    D2["dim_location"] --- F
    D3["dim_payment"] --- F
:::

:::cheat
\dt | List tables
\d+ table_name | Describe table
EXPLAIN ANALYZE query | Execution plan
CREATE INDEX ... | Add index
REFRESH MATERIALIZED VIEW mv | Refresh view
:::
