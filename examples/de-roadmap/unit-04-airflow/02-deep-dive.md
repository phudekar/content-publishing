---
title: "Airflow Deep-Dive: Code Examples"
tags: [airflow, dag, operators, etl]
---

# Airflow Deep-Dive: Code Examples

## 1. Complete ETL DAG

```python
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.operators.postgres import PostgresOperator

default_args = {
    "owner": "data-eng",
    "retries": 3,
    "retry_delay": timedelta(minutes=5),
    "email_on_failure": True,
}

with DAG(
    dag_id="taxi_etl_monthly",
    schedule="0 6 1 * *",        # 6 AM on the 1st of each month
    start_date=datetime(2024, 1, 1),
    catchup=True,
    default_args=default_args,
    tags=["etl", "taxi"],
) as dag:

    download = PythonOperator(
        task_id="download_parquet",
        python_callable=download_taxi_data,
        op_kwargs={"year": "{{ data_interval_start.year }}",
                   "month": "{{ data_interval_start.month }}"},
    )

    transform = PythonOperator(
        task_id="transform",
        python_callable=clean_and_deduplicate,
    )

    load = PostgresOperator(
        task_id="load_to_postgres",
        postgres_conn_id="taxi_db",
        sql="sql/upsert_trips.sql",
    )

    download >> transform >> load
```

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
```

### Airflow Connections

```bash
# Set via CLI (preferred for automation)
airflow connections add warehouse \
    --conn-type postgres \
    --conn-host postgres \
    --conn-port 5432 \
    --conn-login de_user \
    --conn-password "${PG_PASSWORD}" \
    --conn-schema warehouse

# Or via environment variable
export AIRFLOW_CONN_WAREHOUSE=\
    "postgresql://de_user:pass@postgres:5432/warehouse"
```

## 3. Backfill

```bash
# Backfill 3 months of historical data
airflow dags backfill taxi_etl_monthly \
    --start-date 2024-01-01 \
    --end-date 2024-03-31 \
    --reset-dagruns

# Backfill 6 months of taxi data
airflow dags backfill taxi_etl_monthly \
    --start-date 2024-01-01 \
    --end-date 2024-06-30 \
    --reset-dagruns
```

## 4. XCom — Passing Data Between Tasks

```python
def download_taxi_data(year, month, **context):
    filepath = f"/data/raw/taxi_{year}_{month:02d}.parquet"
    # ... download logic ...
    context["ti"].xcom_push(key="filepath", value=filepath)
    return filepath

def clean_and_deduplicate(**context):
    filepath = context["ti"].xcom_pull(
        task_ids="download_parquet", key="filepath"
    )
    import pandas as pd
    df = pd.read_parquet(filepath)
    df = df.drop_duplicates(subset=["trip_id"])
    df = df[df["fare_amount"] > 0]
    output = filepath.replace("raw", "clean")
    df.to_parquet(output, index=False)
    return output
```

### XCom: Inter-Task Communication

```python
# Push a value (implicit via return)
def extract(**ctx):
    path = "/tmp/data_2024_01.parquet"
    download(path)
    return path  # auto-pushed to XCom

# Pull a value in another task
def transform(**ctx):
    path = ctx["ti"].xcom_pull(task_ids="extract")
    df = pd.read_parquet(path)
    # ... transform ...

# Push multiple values with explicit keys
def extract_multi(**ctx):
    ctx["ti"].xcom_push(key="row_count", value=10_000)
    ctx["ti"].xcom_push(key="file_path", value="/tmp/data.parquet")

# Pull specific key
def load(**ctx):
    count = ctx["ti"].xcom_pull(
        task_ids="extract_multi", key="row_count")

# WARNING: XCom is stored in metadata DB
# Never pass large data (DataFrames, files)
# Pass file paths or S3 URIs instead
```

## 5. Sensors — Wait for External Conditions

```python
from airflow.sensors.filesystem import FileSensor

wait_for_file = FileSensor(
    task_id="wait_for_upload",
    filepath="/data/incoming/taxi_{{ ds_nodash }}.parquet",
    poke_interval=60,          # Check every 60 seconds
    timeout=3600,              # Fail after 1 hour
    mode="poke",
)

wait_for_file >> download >> transform >> load
```

### Sensor: Wait for File

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

## 6. Custom Operator

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

### Custom Operator: DownloadOperator

```python
from airflow.models import BaseOperator
from airflow.utils.context import Context
import httpx
from pathlib import Path

class DownloadOperator(BaseOperator):
    """Download a file from a URL and save locally."""

    template_fields = ("url", "dest_path")

    def __init__(self, url: str, dest_path: str, **kwargs):
        super().__init__(**kwargs)
        self.url = url
        self.dest_path = dest_path

    def execute(self, context: Context):
        self.log.info(f"Downloading {self.url}")
        resp = httpx.get(self.url, timeout=120)
        resp.raise_for_status()
        Path(self.dest_path).write_bytes(resp.content)
        self.log.info(f"Saved to {self.dest_path}")
        return self.dest_path
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
