---
title: "Spark & Delta Lake Deep-Dive: Code Examples"
tags: [pyspark, delta-lake, spark-sql, partitioning]
---

# Spark & Delta Lake Deep-Dive: Code Examples

## 1. PySpark Read + Transform

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, year, month, to_date

spark = SparkSession.builder \
    .appName("TaxiIngestion") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .getOrCreate()

df = spark.read.csv("s3://raw-data/taxi_trips.csv", header=True, inferSchema=True)

cleaned = df \
    .filter(col("fare_amount") > 0) \
    .withColumn("trip_date", to_date("pickup_datetime")) \
    .withColumn("trip_year", year("pickup_datetime")) \
    .withColumn("trip_month", month("pickup_datetime"))

cleaned.write \
    .partitionBy("trip_year", "trip_month") \
    .parquet("s3://bronze/taxi_trips/")
```

## 2. Delta Lake Time Travel

```python
# Write initial Delta table
cleaned.write.format("delta").mode("overwrite") \
    .save("s3://silver/taxi_trips/")

# Query a previous version by number
df_v0 = spark.read.format("delta") \
    .option("versionAsOf", 0) \
    .load("s3://silver/taxi_trips/")

# Query by timestamp
df_hist = spark.read.format("delta") \
    .option("timestampAsOf", "2025-01-15T10:00:00") \
    .load("s3://silver/taxi_trips/")

# View table history
from delta.tables import DeltaTable
dt = DeltaTable.forPath(spark, "s3://silver/taxi_trips/")
dt.history().show(truncate=False)
```

## 3. Spark SQL Analytics

```python
cleaned.createOrReplaceTempView("trips")

spark.sql("""
    SELECT
        trip_date,
        COUNT(*)                        AS total_trips,
        ROUND(AVG(fare_amount), 2)      AS avg_fare,
        ROUND(SUM(fare_amount), 2)      AS total_revenue,
        PERCENTILE_APPROX(fare_amount, 0.95) AS p95_fare
    FROM trips
    WHERE trip_year = 2024
    GROUP BY trip_date
    ORDER BY trip_date
""").show()
```

## 4. Performance Tuning

```python
from pyspark.sql.functions import broadcast

# Broadcast join — small dimension table
zones = spark.read.parquet("s3://dims/taxi_zones/")
result = cleaned.join(broadcast(zones), "location_id")

# Cache frequently-used DataFrame
cleaned.cache()
cleaned.count()  # Trigger materialization

# Repartition for balanced parallelism
balanced = cleaned.repartition(200, "trip_date")

# Enable AQE (Adaptive Query Execution)
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
```

## 5. Delta MERGE (Upsert)

```python
from delta.tables import DeltaTable

target = DeltaTable.forPath(spark, "s3://silver/taxi_trips/")
new_data = spark.read.parquet("s3://staging/new_trips/")

target.alias("t").merge(
    new_data.alias("s"),
    "t.trip_id = s.trip_id"
).whenMatchedUpdate(set={
    "fare_amount": "s.fare_amount",
    "tip_amount": "s.tip_amount",
    "updated_at": "current_timestamp()"
}).whenNotMatchedInsertAll().execute()
```

## 6. Medallion Pipeline

```python
# Bronze: raw ingestion, append-only
raw_df = spark.read.json("s3://landing/events/")
raw_df.write.format("delta").mode("append") \
    .save("s3://bronze/events/")

# Silver: clean and deduplicate
bronze = spark.read.format("delta").load("s3://bronze/events/")
silver = bronze \
    .dropDuplicates(["event_id"]) \
    .filter(col("event_type").isNotNull()) \
    .withColumn("processed_at", current_timestamp())
silver.write.format("delta").mode("overwrite") \
    .save("s3://silver/events/")

# Gold: aggregate for analytics
gold = spark.read.format("delta").load("s3://silver/events/") \
    .groupBy("event_date", "event_type") \
    .agg(count("*").alias("event_count"))
gold.write.format("delta").mode("overwrite") \
    .save("s3://gold/event_summary/")
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
