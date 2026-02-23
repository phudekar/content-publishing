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

### DAG Patterns

```python
# Idempotent task: use UPSERT / MERGE
# instead of INSERT to handle re-runs

# Task branching
from airflow.operators.python import BranchPythonOperator

def choose_branch(**ctx):
    if ctx["ds"] > "2024-06-01":
        return "new_pipeline"
    return "legacy_pipeline"

# Task groups (sub-DAGs replacement)
from airflow.utils.task_group import TaskGroup

with TaskGroup("extract") as extract:
    task_a = PythonOperator(...)
    task_b = PythonOperator(...)

extract >> transform >> load
```

### Common Pitfalls

```python
# BAD: doing heavy work inside the DAG file
import pandas as pd
df = pd.read_csv("huge.csv")  # runs at DAG parse time!

# GOOD: defer work to task execution
def process(**ctx):
    import pandas as pd  # import inside function
    df = pd.read_csv("huge.csv")

# BAD: passing large data via XCom
# XCom stores in metadata DB (Postgres)
# return big_dataframe  # will serialize entire DF!

# GOOD: pass file paths, not data
def extract(**ctx):
    path = "/tmp/data.parquet"
    download_to(path)
    return path  # small string, not data
```

### Airflow Docker Compose

```yaml
# Minimal Airflow for local development
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: airflow
      POSTGRES_USER: airflow
      POSTGRES_PASSWORD: airflow
    volumes: [pg_data:/var/lib/postgresql/data]

  airflow-init:
    image: apache/airflow:2.9.0
    entrypoint: /bin/bash -c
    command: airflow db migrate && airflow users create
      --role Admin --username admin --password admin
      --email admin@local.dev --firstname Admin
      --lastname User
    depends_on: [postgres]

  airflow-webserver:
    image: apache/airflow:2.9.0
    command: airflow webserver
    ports: ["8080:8080"]
    volumes: [./dags:/opt/airflow/dags]
    depends_on: [airflow-init]

  airflow-scheduler:
    image: apache/airflow:2.9.0
    command: airflow scheduler
    volumes: [./dags:/opt/airflow/dags]
    depends_on: [airflow-init]
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

### Jinja Snippets

```sql
-- Conditional logic
{% if target.name == 'prod' %}
    {{ config(materialized="table") }}
{% else %}
    {{ config(materialized="view") }}
{% endif %}

-- Loop over columns
{% set metrics = ["revenue", "cost", "profit"] %}
{% for m in metrics %}
    SUM({{ m }}) AS total_{{ m }}{% if not loop.last %},{% endif %}
{% endfor %}

-- Source reference
SELECT * FROM {{ source("raw", "orders") }}

-- Ref another model
SELECT * FROM {{ ref("stg_orders") }}
```

### dbt Test Patterns

```sql
# Custom data test (tests/assert_positive_revenue.sql)
-- This query should return 0 rows to pass
SELECT order_id, revenue
FROM {{ ref("fct_orders") }}
WHERE revenue < 0

# Custom generic test (tests/generic/test_is_even.sql)
{% test is_even(model, column_name) %}
SELECT {{ column_name }}
FROM {{ model }}
WHERE {{ column_name }} % 2 != 0
{% endtest %}

# Usage in schema.yml:
# columns:
#   - name: quantity
#     tests:
#       - is_even
```

### dbt packages.yml

```yaml
# packages.yml — install community packages
packages:
  - package: dbt-labs/dbt_utils
    version: ">=1.0.0"
  - package: calogica/dbt_expectations
    version: ">=0.10.0"
  - package: dbt-labs/codegen
    version: ">=0.12.0"

# Install with: dbt deps
# Use dbt_utils macros:
# {{ dbt_utils.generate_surrogate_key(["col1", "col2"]) }}
# {{ dbt_utils.star(from=ref("stg_orders")) }}
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

### Common Transformations

```python
from pyspark.sql import functions as F

# Filter + add columns
df = df.filter(F.col("amount") > 0) \
       .withColumn("year", F.year("ts")) \
       .withColumn("amount_usd",
           F.col("amount") * F.col("rate"))

# Window function
from pyspark.sql.window import Window
w = Window.partitionBy("user_id").orderBy("ts")
df = df.withColumn("prev_amount", F.lag("amount").over(w))

# Dedup by key (keep latest)
df = df.dropDuplicates(["id"])

# Pivot
pivoted = df.groupBy("date").pivot("category") \
            .agg(F.sum("amount"))
```

### Spark SQL Functions Reference

```python
# Date/time functions
F.year("ts"), F.month("ts"), F.dayofweek("ts")
F.date_trunc("month", "ts")    # truncate to month
F.datediff("end_ts", "start_ts")  # days between

# String functions
F.lower("col"), F.upper("col"), F.trim("col")
F.regexp_extract("col", r"(\d+)", 1)
F.split("col", ".")  # returns array

# Null handling
F.coalesce("col1", "col2", F.lit(0))
F.when(F.col("x").isNull(), "missing")
 .otherwise(F.col("x"))

# Aggregation
F.count_distinct("user_id")
F.approx_count_distinct("user_id")  # faster
F.collect_list("tag")    # array of values
F.collect_set("tag")     # unique values
```

## Resources

- [Apache Airflow Documentation](https://airflow.apache.org/docs/)
- [dbt Documentation](https://docs.getdbt.com/)
- [Apache Spark Documentation](https://spark.apache.org/docs/latest/)
- [Delta Lake Documentation](https://docs.delta.io/latest/index.html)
