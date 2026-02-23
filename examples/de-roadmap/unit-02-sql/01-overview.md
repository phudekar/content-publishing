---
title: "Modern SQL & Data Modeling — Overview"
tags: [sql, postgresql, dimensional-modeling, window-functions]
---

# Week 2: Modern SQL & Data Modeling

## Summary

SQL is the lingua franca of data engineering, and this week you'll move well beyond SELECT statements. You'll master window functions (ROW_NUMBER, LAG, LEAD, NTILE), CTEs for readable query composition, and query optimization using EXPLAIN ANALYZE. The second half focuses on dimensional modeling — the Kimball methodology that underpins every modern data warehouse. You'll learn to identify facts (measurable events) vs. dimensions (descriptive context), design star schemas, and handle slowly changing dimensions (SCDs). This is the foundation that makes dbt, Redshift, and Snowflake work effectively.

**Why these techniques matter and what they replaced:**

- **Window functions over correlated subqueries** — Before window functions, solving ranking, running totals, and row-comparison problems required correlated subqueries that executed once per row, making them slow on large datasets and extremely hard to read. Window functions perform these calculations in a single pass over a defined partition, with clear and composable syntax.
- **CTEs over nested subqueries** — Before CTEs, complex analytical queries were written as deeply nested subqueries — sometimes five or six levels deep — making them nearly impossible to debug or modify. CTEs let you name each logical step, read top-to-bottom, and reuse intermediate results within the same query.
- **Dimensional modeling (Kimball) over normalized schemas** — Before Kimball's methodology, data warehouses used fully normalized (3NF) schemas designed for transactional systems. These required many joins for even simple analytical queries and performed poorly at warehouse scale. Star schemas denormalize dimensions around a central fact table, enabling fast aggregations with simple, predictable join patterns that analysts and BI tools can work with directly.

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
