---
title: "Apache Airflow — Overview"
tags: [airflow, orchestration, etl, dag]
---

# Week 4: Orchestration with Apache Airflow

## Summary

Orchestration is what turns ad-hoc scripts into reliable data pipelines. Apache Airflow is the industry standard — used at Airbnb, Uber, Spotify, and thousands of companies. This week you'll learn to think in DAGs (Directed Acyclic Graphs): decomposing pipelines into tasks with clear dependencies, retries, and scheduling. You'll understand operators (BashOperator, PythonOperator, PostgresOperator), sensors for event-driven triggers, XCom for inter-task communication, and the critical distinction between orchestrating work vs. doing work inside Airflow. The NYC Taxi dataset is large enough to simulate real-world pipeline challenges.

**Why Airflow matters and what it replaced:**

- **Airflow over cron jobs** — Before Airflow, data pipelines were cron jobs with no dependency management, no retry logic, no UI, and no way to track what ran or failed. If step 3 of a pipeline failed, there was no built-in mechanism to retry just that step, alert the team, or prevent downstream steps from running on bad data. Airflow provides a web UI, dependency graphs, automatic retries with backoff, SLA monitoring, and full execution history.
- **DAGs over manually ordered scripts** — Before DAGs, engineers manually ordered script execution and hoped the sequence was correct. DAGs make dependencies explicit and declarative — Airflow's scheduler automatically determines execution order, parallelizes independent tasks, and prevents downstream tasks from running when upstream tasks fail.
- **Airflow vs. modern alternatives** — Dagster is newer and offers strong typing and software-defined assets, but has a smaller ecosystem and fewer production deployments. Prefect is cloud-first with a simpler API, but less battle-tested at scale. Luigi (Airflow's predecessor from Spotify) lacked a web UI, had weaker scheduling, and required more boilerplate. Airflow remains the most widely adopted orchestrator with the largest community, operator library, and managed-service options (MWAA, Cloud Composer, Astronomer).

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
