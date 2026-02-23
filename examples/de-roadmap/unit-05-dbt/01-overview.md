---
title: "dbt (Data Build Tool) — Overview"
tags: [dbt, elt, sql, analytics-engineering]
---

# Week 5: Modern ELT with dbt

## Summary

dbt has revolutionized analytics engineering by bringing software engineering practices to SQL transformations. Instead of writing monolithic stored procedures, you write modular SQL models with version control, testing, and documentation built in. This week you'll learn the ELT paradigm (Extract-Load first, then Transform in the warehouse) and build a full dbt project: staging models that clean raw data, intermediate models for business logic, and mart models optimized for analysts. You'll add schema tests (not_null, unique, relationships), write custom macros with Jinja, and generate a documentation site that makes your data warehouse self-describing.

Before dbt, SQL transformations were stored procedures or scheduled scripts with no version control, no testing, and no documentation. The shift from ETL to ELT happened because cloud warehouses (Redshift, BigQuery, Snowflake) made compute cheap enough to transform in-place. Before dbt's `ref()` function, tracking dependencies between SQL models was manual and error-prone. Before schema tests, data quality issues were discovered by analysts finding wrong numbers in dashboards -- a reactive, costly process that dbt replaces with proactive, automated validation.

## Key Topics

- **ELT vs ETL** — Extract-Load first, then Transform in the warehouse. Leverages warehouse compute power instead of external processing.
- **[dbt Project Structure](https://docs.getdbt.com/docs/build/projects)** — models/, tests/, macros/, seeds/, snapshots/ directories. Convention-driven organization with ref() for dependencies.
- **[Model Materialization](https://docs.getdbt.com/docs/build/materializations)** — view (lightweight), table (full rebuild), incremental (append new), ephemeral (inline CTE). Choose based on data volume and freshness.
- **Staging -> Intermediate -> Mart** — Layered transformation pattern. Staging cleans raw data, intermediate applies business logic, marts serve analytics.
- **[Schema Tests](https://docs.getdbt.com/docs/build/data-tests)** — Built-in validators: not_null, unique, accepted_values, relationships. Run with `dbt test` to catch data issues early.
- **[Jinja Templating](https://docs.getdbt.com/docs/build/jinja-macros)** — Macros for reusable SQL patterns. Control structures (if/for) and variables for dynamic model generation.
- **[dbt Docs](https://docs.getdbt.com/docs/collaborate/documentation)** — Auto-generated documentation site with model lineage graph. Column descriptions and business metadata in YAML.
- **[Snapshots](https://docs.getdbt.com/docs/build/snapshots)** — Track slowly changing dimensions using dbt's built-in SCD Type 2 pattern. Adds valid_from/valid_to columns automatically.

## Resources

- [dbt Documentation](https://docs.getdbt.com/)
- [dbt Best Practices](https://docs.getdbt.com/best-practices)
- [dbt Learn (Free Courses)](https://learn.getdbt.com/)
- [dbt Package Hub](https://hub.getdbt.com/)

:::goal
Build a complete dbt project that transforms raw data into clean, tested, documented analytics models.
:::

:::deliverables
- dbt project with layered models (staging, intermediate, mart)
- Schema tests covering all critical columns
- Custom Jinja macro for reusable SQL logic
- Generated docs site with full lineage graph
:::

:::diagram
graph LR
    A["Raw Sources"] -->|"ref()"| B["Staging"]
    B -->|"ref()"| C["Intermediate"]
    C -->|"ref()"| D["Marts"]
    D --> E["Analytics / BI"]
:::

:::cheat
dbt run | Build all models
dbt test | Run all tests
dbt docs generate | Generate docs
dbt docs serve | Serve docs site
dbt run --select staging.* | Run staging only
:::
