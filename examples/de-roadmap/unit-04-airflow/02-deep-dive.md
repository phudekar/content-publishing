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

## 3. Backfill

```bash
# Backfill 3 months of historical data
airflow dags backfill taxi_etl_monthly \
    --start-date 2024-01-01 \
    --end-date 2024-03-31 \
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
