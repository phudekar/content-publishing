---
title: "Cookbook: Airflow, dbt & Spark"
tags: [airflow, dbt, spark, cheat-sheet]
---

# Cookbook: Airflow, dbt & Spark

## Airflow Cheat Sheet

:::cheat
airflow db init | Initialize metadata DB
airflow webserver -p 8080 | Start web UI
airflow scheduler | Start scheduler
airflow dags list | List all DAGs
airflow dags trigger dag_id | Trigger DAG run
airflow tasks test dag task date | Test single task
airflow dags backfill -s START -e END dag | Backfill date range
airflow connections list | List connections
airflow variables set KEY VALUE | Set variable
:::

### DAG Pattern

```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

default_args = {
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
    "email_on_failure": True,
}

with DAG(
    "etl_pipeline",
    default_args=default_args,
    schedule="0 6 * * *",  # Daily at 6 AM
    start_date=datetime(2024, 1, 1),
    catchup=False,
) as dag:
    extract = PythonOperator(task_id="extract", python_callable=extract_fn)
    transform = PythonOperator(task_id="transform", python_callable=transform_fn)
    load = PythonOperator(task_id="load", python_callable=load_fn)

    extract >> transform >> load
```

### Sensor Pattern

```python
from airflow.sensors.filesystem import FileSensor

wait_for_file = FileSensor(
    task_id="wait_for_data",
    filepath="/data/incoming/{{ ds }}.csv",
    poke_interval=60,
    timeout=3600,
    mode="reschedule",  # Free up worker slot while waiting
)
```

---

## dbt Cheat Sheet

:::cheat
dbt init project_name | Create new project
dbt run | Build all models
dbt run --select staging.* | Run staging models only
dbt test | Run all tests
dbt test --select model_name | Test specific model
dbt docs generate | Generate documentation
dbt docs serve | Serve docs locally
dbt snapshot | Run snapshots (SCD)
dbt seed | Load CSV seed files
dbt source freshness | Check source freshness
:::

### Model Patterns

```sql
-- staging/stg_orders.sql (materialized: view)
WITH source AS (
    SELECT * FROM {{ source('raw', 'orders') }}
),
renamed AS (
    SELECT
        id AS order_id,
        customer_id,
        CAST(order_date AS DATE) AS order_date,
        CAST(amount AS NUMERIC(10,2)) AS order_amount,
        status
    FROM source
    WHERE id IS NOT NULL
)
SELECT * FROM renamed
```

```sql
-- marts/fct_daily_revenue.sql (materialized: table)
SELECT
    order_date,
    COUNT(*) AS order_count,
    SUM(order_amount) AS total_revenue,
    AVG(order_amount) AS avg_order_value
FROM {{ ref('stg_orders') }}
WHERE status = 'completed'
GROUP BY order_date
```

### Schema Test YAML

```yaml
models:
  - name: stg_orders
    columns:
      - name: order_id
        tests: [unique, not_null]
      - name: order_amount
        tests:
          - not_null
          - dbt_utils.accepted_range:
              min_value: 0
              max_value: 100000
```

---

## Spark Cheat Sheet

:::cheat
spark-submit job.py | Submit Spark application
pyspark | Interactive Python shell
spark-sql | Interactive SQL shell
spark-submit --master local[*] job.py | Run locally with all cores
spark-submit --conf spark.sql.shuffle.partitions=200 job.py | Set config
df.explain(True) | Show query execution plan
df.cache() | Cache DataFrame in memory
df.repartition(10) | Repartition to N partitions
:::

### PySpark Patterns

```python
from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = SparkSession.builder.appName("etl").getOrCreate()

# Read, transform, write
df = (spark.read.parquet("s3://bucket/raw/")
    .filter(F.col("amount") > 0)
    .withColumn("date", F.to_date("timestamp"))
    .groupBy("date", "category")
    .agg(F.sum("amount").alias("total"), F.count("*").alias("count")))

df.write.format("delta").partitionBy("date").mode("overwrite").save("s3://bucket/gold/")
```

### Delta Lake MERGE

```python
from delta.tables import DeltaTable

target = DeltaTable.forPath(spark, "s3://bucket/silver/")
target.alias("t").merge(
    updates.alias("s"), "t.id = s.id"
).whenMatchedUpdateAll().whenNotMatchedInsertAll().execute()
```

## Resources

- [Apache Airflow Documentation](https://airflow.apache.org/docs/)
- [dbt Documentation](https://docs.getdbt.com/)
- [Apache Spark Documentation](https://spark.apache.org/docs/latest/)
- [Delta Lake Documentation](https://docs.delta.io/latest/index.html)
