---
title: "Apache Spark & Delta Lake — Overview"
tags: [spark, delta-lake, lakehouse, pyspark]
---

# Week 6: Lakehouse Architecture & Apache Spark

## Summary

The lakehouse paradigm merges the flexibility of data lakes (cheap storage, any format) with the reliability of data warehouses (ACID transactions, schema enforcement). This week you'll learn Apache Spark for distributed data processing and Delta Lake for building reliable lakehouse tables. You'll understand partitioning strategies, the difference between Parquet and Delta, time travel for data recovery, and how to run Spark SQL analytics on large datasets. The US Flights dataset (millions of rows) is ideal for experiencing Spark's distributed processing power vs. Pandas.

Before Spark, Hadoop MapReduce was the standard for big data but required writing Java and was extremely slow due to disk-based processing. Spark improved on MapReduce by keeping data in memory (10-100x faster) and providing a Python API (PySpark). Before Delta Lake, data lakes had no ACID guarantees -- concurrent writes could corrupt data, there was no schema enforcement, and you couldn't undo mistakes. Parquet improved on CSV by adding columnar storage and compression, but Delta added a transaction log on top for reliability. Before the lakehouse pattern, organizations maintained separate lakes and warehouses, duplicating data and creating consistency nightmares.

## Key Topics

- **[Spark Architecture](https://spark.apache.org/docs/latest/cluster-overview.html)** — Driver coordinates, executors process data in parallel. DAG scheduler optimizes execution plans with lazy evaluation.
- **[DataFrames](https://spark.apache.org/docs/latest/sql-programming-guide.html)** — Distributed tabular data with SQL-like API. Schema-aware, optimized by Catalyst query planner -- preferred over RDDs.
- **[Spark SQL](https://spark.apache.org/docs/latest/sql-ref.html)** — SQL interface on DataFrames and Delta tables. Supports window functions, CTEs, and complex joins at distributed scale.
- **[Parquet](https://parquet.apache.org/) & [Delta](https://delta.io/)** — Parquet is columnar storage (fast reads, compression). Delta adds ACID transactions, time travel, and schema enforcement on top.
- **[Delta Lake Time Travel](https://docs.delta.io/latest/delta-batch.html#query-an-older-snapshot-of-a-table-time-travel)** — Query any historical version of a table by version number or timestamp. Enables data recovery and audit trails.
- **Partitioning** — Organize data files by column values (e.g., date). Enables partition pruning for faster queries on filtered data.
- **[Medallion Architecture](https://www.databricks.com/glossary/medallion-architecture)** — Bronze (raw ingestion), Silver (cleaned, deduplicated), Gold (aggregated, business-ready). Standard lakehouse pattern.
- **[Performance Tuning](https://spark.apache.org/docs/latest/sql-performance-tuning.html)** — Broadcast joins for small tables, caching for reuse, partition pruning, and AQE (Adaptive Query Execution).

## Resources

- [Apache Spark Documentation](https://spark.apache.org/docs/latest/)
- [Delta Lake Documentation](https://docs.delta.io/latest/index.html)
- [PySpark API Reference](https://spark.apache.org/docs/latest/api/python/)
- [Databricks Lakehouse Guide](https://www.databricks.com/glossary/lakehouse)

:::goal
Build a lakehouse pipeline with Spark and Delta Lake -- understand distributed computing at scale.
:::

:::deliverables
- Spark CSV-to-Parquet ingestion job
- Delta tables with partitioning and schema enforcement
- Time travel demo with version rollback
- Spark SQL analytics queries
- Full medallion pipeline (Bronze, Silver, Gold)
:::

:::diagram
graph LR
    A["Raw Files"] -->|Spark Ingest| B["Bronze"]
    B -->|Clean, Deduplicate| C["Silver"]
    C -->|Aggregate, Join| D["Gold"]
    D --> E["Analytics"]
:::

:::cheat
spark-submit job.py | Submit Spark job
spark-sql | Interactive SQL shell
pyspark | Interactive Python shell
df.explain(True) | Show query plan
df.cache() | Cache DataFrame
:::
