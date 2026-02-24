---
title: "Airflow Deep-Dive: Code Examples"
tags: [airflow, dag, operators, etl]
---

# Airflow Deep-Dive: Code Examples

## 1. Complete ETL DAG — taxi_etl.py

```python
from datetime import datetime, timedelta
from pathlib import Path
import pandas as pd
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.operators.postgres import PostgresOperator

default_args = {
    "owner": "data-eng",
    "retries": 3,
    "retry_delay": timedelta(minutes=5),
    "email_on_failure": True,
}

def download_taxi_data(year, month, **context):
    import httpx
    url = (
        f"https://d37ci6vzurychx.cloudfront.net/trip-data/"
        f"yellow_tripdata_{year}-{int(month):02d}.parquet"
    )
    dest = Path(f"/data/raw/taxi_{year}_{int(month):02d}.parquet")
    dest.parent.mkdir(parents=True, exist_ok=True)
    with httpx.Client(timeout=120) as client:
        with client.stream("GET", url) as resp:
            resp.raise_for_status()
            with open(dest, "wb") as f:
                for chunk in resp.iter_bytes(chunk_size=8192):
                    f.write(chunk)
    return str(dest)

def transform(**context):
    filepath = context["ti"].xcom_pull(task_ids="download_parquet")
    df = pd.read_parquet(filepath)
    df = df.drop_duplicates()
    df = df[df["fare_amount"] > 0]
    output = filepath.replace("raw", "clean")
    Path(output).parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(output, index=False)
    return output

with DAG(
    dag_id="taxi_etl",
    schedule="@monthly",
    start_date=datetime(2024, 1, 1),
    catchup=True,
    max_active_runs=2,
    default_args=default_args,
    tags=["etl", "taxi"],
) as dag:

    create_table = PostgresOperator(
        task_id="create_table",
        postgres_conn_id="taxi_db",
        sql="""
            CREATE TABLE IF NOT EXISTS trips (
                trip_id     BIGSERIAL PRIMARY KEY,
                vendor_id   SMALLINT,
                pickup_at   TIMESTAMP,
                dropoff_at  TIMESTAMP,
                passenger_count SMALLINT,
                trip_distance   NUMERIC(8,2),
                fare_amount     NUMERIC(10,2),
                tip_amount      NUMERIC(10,2),
                total_amount    NUMERIC(10,2)
            );
        """,
    )

    download = PythonOperator(
        task_id="download_parquet",
        python_callable=download_taxi_data,
        op_kwargs={
            "year": "{{ data_interval_start.year }}",
            "month": "{{ data_interval_start.month }}",
        },
    )

    transform_task = PythonOperator(
        task_id="transform",
        python_callable=transform,
    )

    load = PostgresOperator(
        task_id="load_to_postgres",
        postgres_conn_id="taxi_db",
        sql="sql/upsert_trips.sql",
    )

    create_table >> download >> transform_task >> load
```

:::diagram
graph LR
    CT["create_table<br/>(PostgresOperator)"] --> DL["download_parquet<br/>(PythonOperator)"]
    DL --> TR["transform<br/>(PythonOperator)"]
    TR --> LD["load_to_postgres<br/>(PostgresOperator)"]
    DL -.->|"XCom: filepath"| TR
    style CT fill:#e1f5fe
    style DL fill:#fff3e0
    style TR fill:#fff3e0
    style LD fill:#e1f5fe
:::

## 2. Connections

```bash
# Add PostgreSQL connection via CLI
airflow connections add taxi_db \
    --conn-type postgres \
    --conn-host postgres \
    --conn-port 5432 \
    --conn-login etl_user \
    --conn-password secret \
    --conn-schema taxi

# Or via environment variable
export AIRFLOW_CONN_TAXI_DB=\
    "postgresql://etl_user:secret@postgres:5432/taxi"
```

## 3. Backfill

```bash
# Backfill 6 months of historical data
airflow dags backfill taxi_etl \
    --start-date 2024-01-01 \
    --end-date 2024-06-30 \
    --reset-dagruns
```

## 4. XCom — Passing Data Between Tasks

```python
# Push a value (implicit via return)
def download_taxi_data(year, month, **context):
    filepath = f"/data/raw/taxi_{year}_{int(month):02d}.parquet"
    # ... download logic ...
    return filepath  # auto-pushed to XCom

# Pull a value in another task
def transform(**context):
    filepath = context["ti"].xcom_pull(task_ids="download_parquet")
    df = pd.read_parquet(filepath)
    # ... transform logic ...

# WARNING: XCom is stored in metadata DB
# Never pass large data (DataFrames, files)
# Pass file paths or S3 URIs instead
```

## 5. Sensors — Wait for External Conditions

```python
from airflow.sensors.filesystem import FileSensor
from airflow.operators.python import PythonOperator

wait_for_file = FileSensor(
    task_id="wait_for_data",
    filepath="/data/incoming/trades_{{ ds }}.csv",
    poke_interval=60,      # check every 60 seconds
    timeout=3600,          # give up after 1 hour
    mode="reschedule",     # free worker slot between checks
)

process = PythonOperator(
    task_id="process_data",
    python_callable=process_trades,
)

wait_for_file >> process
```

## 6. Custom Operator — UpsertOperator

```python
from airflow.models import BaseOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook

class UpsertOperator(BaseOperator):
    def __init__(self, conn_id: str, table: str, filepath: str, **kwargs):
        super().__init__(**kwargs)
        self.conn_id = conn_id
        self.table = table
        self.filepath = filepath

    def execute(self, context):
        hook = PostgresHook(postgres_conn_id=self.conn_id)
        import pandas as pd
        df = pd.read_parquet(self.filepath)
        hook.insert_rows(
            table=self.table,
            rows=df.values.tolist(),
            target_fields=df.columns.tolist(),
            replace=True,
            replace_index="trip_id",
        )
        self.log.info("Upserted %d rows into %s", len(df), self.table)
```

## Resources

- [Airflow Operators Guide](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/operators.html)
- [Airflow XCom Guide](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/xcoms.html)
- [Airflow PostgreSQL Provider](https://airflow.apache.org/docs/apache-airflow-providers-postgres/stable/index.html)
- [Airflow Sensors Guide](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/sensors.html)

:::cheat
airflow db init | Initialize metadata DB
airflow dags list | List discovered DAGs
airflow dags trigger dag_id | Manual trigger
airflow dags backfill -s START -e END dag_id | Backfill range
airflow connections add conn_id --conn-uri uri | Add connection
:::
