---
title: "Spark & Delta Lake Deep-Dive: Code Examples"
tags: [pyspark, delta-lake, spark-sql, partitioning]
---

# Spark & Delta Lake Deep-Dive: Code Examples

:::diagram
graph LR
    CSV["flights.csv"] --> B["Bronze<br/>(raw, append-only)<br/>Delta"]
    B --> S["Silver<br/>(clean, dedup)<br/>Delta"]
    S --> G["Gold<br/>(aggregates)<br/>Delta"]
    G --> SQL["Spark SQL /<br/>Redshift"]
:::

## 1. PySpark Read + Transform

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import col

spark = SparkSession.builder \
    .appName("FlightIngestion") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .getOrCreate()

df = spark.read.csv("data/raw/flights.csv", header=True, inferSchema=True)

cleaned = df \
    .withColumn("is_delayed", col("DEP_DELAY") > 15) \
    .filter(col("CANCELLED") == 0)

cleaned.write \
    .format("delta") \
    .mode("overwrite") \
    .save("data/lakehouse/bronze/flights")
```

## 2. Delta Lake Time Travel

```python
# Write initial Delta table
cleaned.write.format("delta").mode("overwrite") \
    .save("data/lakehouse/silver/flights")

# Query a previous version by number
df_v0 = spark.read.format("delta") \
    .option("versionAsOf", 0) \
    .load("data/lakehouse/silver/flights")

# Query by timestamp
df_hist = spark.read.format("delta") \
    .option("timestampAsOf", "2025-01-15T10:00:00") \
    .load("data/lakehouse/silver/flights")

# View table history
from delta.tables import DeltaTable
dt = DeltaTable.forPath(spark, "data/lakehouse/silver/flights")
dt.history().show(truncate=False)
```

## 3. Spark SQL Analytics

```python
cleaned.createOrReplaceTempView("flights")

spark.sql("""
    SELECT
        CARRIER,
        ROUND(AVG(DEP_DELAY), 2)               AS avg_dep_delay,
        COUNT(CASE WHEN DEP_DELAY > 15
              THEN 1 END)                       AS delayed_flights,
        COUNT(*)                                AS total_flights,
        ROUND(COUNT(CASE WHEN DEP_DELAY > 15
              THEN 1 END) * 100.0
              / COUNT(*), 2)                    AS delay_pct
    FROM flights
    GROUP BY CARRIER
    ORDER BY avg_dep_delay DESC
""").show()
```

## 4. Performance Tuning

```python
from pyspark.sql.functions import broadcast

# Broadcast join — small dimension table
airports = spark.read.parquet("data/dims/airports/")
result = cleaned.join(broadcast(airports), "ORIGIN")

# Set shuffle partitions for this job
spark.conf.set("spark.sql.shuffle.partitions", "50")

# Cache frequently-used DataFrame
cleaned.cache()
cleaned.count()  # Trigger materialization

# Enable AQE (Adaptive Query Execution)
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
```

## 5. Delta MERGE (Upsert)

```python
from delta.tables import DeltaTable

target = DeltaTable.forPath(spark, "data/lakehouse/silver/flights")
new_data = spark.read.parquet("data/staging/new_flights/")

target.alias("t").merge(
    new_data.alias("s"),
    "t.flight_id = s.flight_id"
).whenMatchedUpdate(set={
    "DEP_DELAY": "s.DEP_DELAY",
    "ARR_DELAY": "s.ARR_DELAY",
    "updated_at": "current_timestamp()"
}).whenNotMatchedInsertAll().execute()

# Delta maintenance
target.optimize().executeCompaction()
target.vacuum(168)  # Remove files older than 168 hours (7 days)
```

## 6. Medallion Pipeline

```python
# Bronze: raw ingestion, append-only
raw_df = spark.read.csv("data/raw/flights.csv", header=True, inferSchema=True)
raw_df.write.format("delta").mode("append") \
    .save("data/lakehouse/bronze/flights")

# Silver: clean and deduplicate
bronze = spark.read.format("delta").load("data/lakehouse/bronze/flights")
silver = bronze \
    .dropDuplicates(["flight_id"]) \
    .filter(col("CANCELLED") == 0) \
    .withColumn("processed_at", current_timestamp())
silver.write.format("delta").mode("overwrite") \
    .save("data/lakehouse/silver/flights")

# Gold: aggregate for analytics
gold = spark.read.format("delta").load("data/lakehouse/silver/flights") \
    .groupBy("CARRIER", "ORIGIN") \
    .agg(
        count("*").alias("flight_count"),
        avg("DEP_DELAY").alias("avg_delay")
    )
gold.write.format("delta").mode("overwrite") \
    .save("data/lakehouse/gold/flight_summary")
```

## Resources

- [PySpark DataFrame Guide](https://spark.apache.org/docs/latest/sql-programming-guide.html)
- [Delta Lake Quick Start](https://docs.delta.io/latest/quick-start.html)
- [Delta MERGE INTO](https://docs.delta.io/latest/delta-update.html#upsert-into-a-table-using-merge)
- [Spark Performance Tuning](https://spark.apache.org/docs/latest/sql-performance-tuning.html)

:::cheat
spark-submit job.py | Submit Spark job
spark-sql | Interactive SQL shell
pyspark | Interactive Python shell
df.explain(True) | Show query plan
df.cache() | Cache DataFrame
df.repartition(N) | Repartition to N parts
spark.catalog.listTables() | List registered tables
:::
