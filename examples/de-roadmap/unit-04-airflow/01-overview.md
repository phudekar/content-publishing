---
title: "Apache Airflow — Overview"
tags: [airflow, orchestration, etl, dag]
---

# Week 4: Orchestration with Apache Airflow

## Summary

Orchestration turns ad-hoc scripts into reliable data pipelines. Airflow is the industry standard — used at Airbnb, Uber, Spotify. Learn to think in DAGs: decomposing pipelines into tasks with dependencies, retries, and scheduling.

## Key Topics

- **[Airflow Architecture](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/overview.html)** — Scheduler triggers tasks, webserver provides UI, executor runs tasks, metadata DB tracks state. Runs as multiple cooperating services.
- **[DAGs](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dags.html)** — Directed Acyclic Graphs define task dependencies and execution order. Python files in the dags/ folder are auto-discovered.
- **[Operators](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/operators.html)** — Pre-built task types — BashOperator runs shell commands, PythonOperator calls functions, PostgresOperator runs SQL.
- **[Sensors](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/sensors.html)** — Tasks that wait for external conditions — file arrival, API response, upstream DAG completion. Enable event-driven pipelines.
- **[XCom](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/xcoms.html)** — Cross-communication between tasks. Small data (file paths, row counts) pushed/pulled between operator instances.
- **[Scheduling & Backfill](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dag-run.html)** — Cron-based scheduling with catchup for missed runs. Backfill replays historical dates on demand.
- **[Connections & Hooks](https://airflow.apache.org/docs/apache-airflow/stable/howto/connection.html)** — Credential management via Airflow UI. Hooks abstract database/API connections for reuse across operators.
- **Idempotency** — Design principle — running a task multiple times produces the same result. Critical for reliable retries and backfills.

## Resources

- [Apache Airflow Documentation](https://airflow.apache.org/docs/)
- [Airflow Best Practices](https://airflow.apache.org/docs/apache-airflow/stable/best-practices.html)
- [Astronomer Guides](https://www.astronomer.io/guides/)

:::goal
Build a production-style ETL pipeline that downloads, transforms, and loads data on a schedule.
:::

:::deliverables
- ETL DAG for NYC Taxi data (monthly schedule)
- Transformation step with Pandas (clean, deduplicate, compute fields)
- PostgreSQL upsert using ON CONFLICT
- Retry and alerting configuration
- Backfill demo for 3 historical months
:::

:::diagram
graph LR
    A["Download"] --> B["Transform"]
    B --> C["Validate"]
    C --> D["Load"]
    D --> E["Notify"]
:::

:::cheat
airflow db init | Initialize metadata DB
airflow dags list | List discovered DAGs
airflow dags trigger dag_id | Manual trigger
airflow dags backfill -s START -e END dag_id | Backfill range
airflow connections add conn_id --conn-uri uri | Add connection
:::
