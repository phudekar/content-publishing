---
title: "Glossary of Key Terms"
---

# Glossary of Key Terms

| Term | Definition |
|------|-----------|
| **ACID** | Atomicity, Consistency, Isolation, Durability — transaction guarantees for databases |
| **Backfill** | Re-running a pipeline for historical date ranges to fill in missing data |
| **CDC** | Change Data Capture — tracking row-level changes in a database |
| **CTE** | Common Table Expression — named subquery using WITH clause |
| **DAG** | Directed Acyclic Graph — workflow of tasks with dependencies (no cycles) |
| **Data Lake** | Storage layer that holds raw data in any format (typically object storage) |
| **Data Lakehouse** | Architecture combining data lake flexibility with warehouse reliability |
| **Delta Lake** | Open-source storage layer adding ACID transactions to data lakes |
| **ELT** | Extract, Load, Transform — load raw data first, transform in the warehouse |
| **ETL** | Extract, Transform, Load — transform data before loading into the warehouse |
| **Grain** | The level of detail in a fact table (e.g., one row per transaction) |
| **IaC** | Infrastructure as Code — managing infra through version-controlled config files |
| **Idempotent** | Operation that produces the same result regardless of how many times it runs |
| **Medallion** | Architecture pattern with bronze (raw), silver (cleaned), gold (aggregated) layers |
| **Partition** | Physical division of data by a key (e.g., date) for faster queries |
| **SCD** | Slowly Changing Dimension — techniques for tracking dimension changes over time |
| **Schema Registry** | Service that stores and validates Avro/JSON schemas for Kafka messages |
| **Surrogate Key** | Artificial key (auto-increment or hash) used instead of natural business key |
| **XCom** | Airflow mechanism for passing small data between tasks (cross-communication) |
| **Consumer Group** | Set of Kafka consumers that share work reading from topic partitions |
| **Offset** | Kafka's pointer tracking which messages a consumer has processed |
| **Bloom Filter** | Probabilistic data structure for fast "element not present" checks |
| **Compaction** | Merging small files into larger ones for better read performance |
| **Materialized View** | Pre-computed query result stored as a table, refreshed on demand |
| **Window Function** | SQL function that operates on a set of rows related to the current row |
| **Star Schema** | Dimensional model with a central fact table joined to dimension tables |
| **Fact Table** | Table storing measurable events (transactions, clicks, trips) at defined grain |
| **Dimension Table** | Table storing descriptive context (dates, locations, customers) |
