---
title: "Capstone Project & Interview Prep"
tags: [capstone, portfolio, interviews]
---

# Capstone Project & Interview Prep

## Capstone Architecture

Build an end-to-end data platform that demonstrates every skill from the 8-week sprint:

:::diagram
graph LR
    A["Event Source"] --> B["Kafka"]
    B --> C["Airflow"]
    C --> D["S3"]
    D --> E["Spark"]
    E --> F["Delta Lake"]
    F --> G["dbt"]
    G --> H["Redshift"]
    H --> I["Superset"]
:::

:::deliverables
- End-to-end pipeline: Kafka → Airflow → S3 → Spark/Delta → dbt → Redshift
- Data quality gates at ingestion and transformation layers
- Infrastructure as code with Terraform
- CI/CD with GitHub Actions (test on PR, deploy on merge)
- Documentation: architecture diagram, data dictionary, runbook
:::

## Portfolio README Template

Your GitHub repo README should include:

1. **Architecture diagram** — visual overview of the full pipeline
2. **Tech stack** — list every tool with version numbers
3. **Quick start** — `docker-compose up` or equivalent one-command setup
4. **Data flow** — describe what happens at each stage
5. **Testing** — how to run tests, what's covered
6. **Decisions** — why you chose each tool (shows engineering judgment)

## Capstone: End-to-End Pipeline Commands

```bash
# 1. Start infrastructure
docker-compose up -d

# 2. Create Kafka topic
kafka-topics --bootstrap-server localhost:9092 \
  --create --topic trades --partitions 3 --replication-factor 1

# 3. Start producing events
python producer.py --messages 100000

# 4. Trigger Airflow DAG
airflow dags trigger trade_etl --conf '{"date": "2025-01-15"}'

# 5. Run Spark job
spark-submit --master local[4] spark_jobs/bronze_to_silver.py

# 6. Run dbt
cd dbt_project && dbt run && dbt test

# 7. Validate data quality
great_expectations checkpoint run trades_checkpoint
```

## GitHub Repo Structure

```
capstone-data-platform/
├── dags/                    # Airflow DAGs
│   ├── trade_etl.py
│   └── sql/
├── spark_jobs/              # PySpark scripts
│   ├── bronze_to_silver.py
│   └── silver_to_gold.py
├── dbt_project/             # dbt models + tests
│   ├── models/
│   ├── tests/
│   └── dbt_project.yml
├── terraform/               # Infrastructure as code
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── .github/                 # CI/CD workflows
│   └── workflows/
│       ├── ci.yml
│       └── cd.yml
├── docker-compose.yml       # Local dev stack
├── Makefile                 # Convenience commands
└── README.md                # Architecture + quick start
```

## Realistic Outcomes

After completing the capstone, you will be able to talk about:

- **Pipeline design**: "I chose Kafka for ingestion because we needed to decouple producers from consumers and handle back-pressure gracefully."
- **Data quality**: "I implemented Great Expectations checkpoints at the silver layer to catch schema drift before data reaches the warehouse."
- **Infrastructure**: "I used Terraform to provision S3 and Redshift, with lifecycle policies moving cold data to Glacier after 90 days."
- **Trade-offs**: "I evaluated Flink vs Spark Structured Streaming, and chose Spark because our latency requirements were minutes, not seconds."
- **Debugging**: "When our pipeline lagged behind, I used Kafka consumer group lag metrics to identify the bottleneck was in the Spark job's shuffle phase."

## Interview Prep: Common Questions

### System Design
- Design a real-time analytics pipeline for an e-commerce platform
- How would you handle late-arriving data in a streaming pipeline?
- Design a data platform for a company going from 1GB/day to 1TB/day
- How do you ensure exactly-once processing in a Kafka pipeline?

### SQL & Modeling
- When would you use a star schema vs. a normalized schema?
- Explain SCD Type 2 and when you'd use it
- Write a query using window functions to find the top 3 per category
- How do you optimize a slow query in Redshift/PostgreSQL?

### Architecture & Trade-offs
- ETL vs ELT: when would you choose each approach?
- Batch vs streaming: what factors drive the decision?
- When would you use Spark vs a simpler tool like Pandas?
- How do you decide between managed cloud services and self-hosted?

### Data Quality & Operations
- How do you detect and handle schema drift?
- Describe your approach to data quality in a production pipeline
- How do you handle pipeline failures at 3 AM?
- What metrics would you monitor for a data pipeline?

### Answer Framework (STAR)
- **Situation**: Set the context — what project, what scale
- **Task**: What was your specific responsibility
- **Action**: What did you do — be specific about technical choices
- **Result**: What was the outcome — metrics, improvements, lessons learned

### Sample Answer Framework (STAR)

Situation: "In my portfolio project, I built a real-time
           stock trading pipeline using Kafka and Spark."

Task:      "I needed to handle 10K events/sec with < 5 min
           end-to-end latency and zero data loss."

Action:    "I configured Kafka with acks=all and
           enable.idempotence=true for exactly-once
           delivery. I used Delta Lake MERGE for upserts
           and Great Expectations checkpoints to catch
           schema drift before data reached the warehouse."

Result:    "The pipeline processed 500K events/day with
           99.9% uptime. Data quality checks caught 3
           schema changes during development that would
           have caused silent data corruption."

## Quick Reference: When to Use What

### Data Storage

| Tool | When to Use |
|------|-------------|
| PostgreSQL | Structured data < 1TB, strong consistency, ACID, complex queries |
| S3 / Object Storage | Any size, any format, cheap, immutable files (Parquet, JSON, CSV) |
| Delta Lake / Iceberg | ACID on object storage, time travel, schema evolution, lakehouse |
| Redshift / BigQuery | Analytical queries on TB-PB scale, columnar, managed |

### Data Processing

| Tool | When to Use |
|------|-------------|
| Pandas | Single machine, < 10GB, prototyping, quick analysis |
| Apache Spark | Distributed, > 10GB, production ETL, cluster processing |
| dbt | SQL transforms in warehouse, testing, documentation, lineage |
| Apache Flink | True streaming (event-at-a-time), low latency, stateful processing |

### Orchestration

| Tool | When to Use |
|------|-------------|
| Apache Airflow | Batch scheduling, DAG-based, mature ecosystem, Python-native |
| Dagster | Asset-oriented, type-safe, great testing, modern alternative |
| GitHub Actions | CI/CD, lightweight scheduling, code-triggered workflows |

### Streaming

| Tool | When to Use |
|------|-------------|
| Apache Kafka | High-throughput message bus, event sourcing, pub/sub at scale |
| AWS SQS / SNS | Simple queuing, managed, no cluster ops, lower throughput |

### Data Quality

| Tool | When to Use |
|------|-------------|
| Great Expectations | Batch validation, expectation suites, data docs, rich ecosystem |
| dbt tests | SQL-based tests integrated with transform layer |

### Infrastructure

| Tool | When to Use |
|------|-------------|
| Docker | Local dev, packaging, reproducible environments |
| Docker Compose | Multi-container local stacks, dev/test environments |
| Terraform | Cloud infrastructure as code, reproducible, version-controlled |
| Kubernetes | Production container orchestration (after mastering Docker) |

## Resources

- [System Design Primer](https://github.com/donnemartin/system-design-primer)
- [Awesome Data Engineering](https://github.com/igorbarinov/awesome-data-engineering)
- [Data Engineering Wiki](https://dataengineering.wiki/)

:::goal
Prepare for data engineering interviews by building a portfolio project and practicing system design questions with real architectural trade-offs.
:::
