---
title: "Kafka & Data Quality Deep-Dive: Code Examples"
tags: [kafka, python, great-expectations, avro]
---

# Kafka & Data Quality Deep-Dive: Code Examples

:::diagram
graph LR
    P["Producer<br/>(generate_trade)"] -->|"JSON/Avro"| T["Kafka Broker<br/>Topic: trades<br/>3 partitions"]
    T --> C1["Consumer Group<br/>trade-writer<br/>(batch 500)"]
    T --> C2["Consumer Group<br/>trade-analytics"]
    SR["Schema Registry<br/>:8081"] -.->|"Avro schema"| T
:::

## 1. Kafka Producer

```python
from confluent_kafka import Producer
import json, random, time
from datetime import datetime, timezone

config = {
    "bootstrap.servers": "localhost:9092",
    "client.id": "trade-producer",
    "acks": "all",
    "retries": 3,
    "linger.ms": 10,
}

producer = Producer(config)

SYMBOLS = ["AAPL", "GOOG", "MSFT", "AMZN", "TSLA", "META", "NVDA"]

def delivery_report(err, msg):
    if err:
        print(f"Delivery failed: {err}")

def generate_trade():
    symbol = random.choice(SYMBOLS)
    return {
        "symbol": symbol,
        "price": round(random.uniform(100, 500), 2),
        "quantity": random.randint(1, 1000),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

for _ in range(10_000):
    trade = generate_trade()
    producer.produce(
        topic="trades",
        key=trade["symbol"],
        value=json.dumps(trade).encode("utf-8"),
        callback=delivery_report,
    )
    producer.poll(0)

producer.flush()
```

## 2. Kafka Consumer

```python
from confluent_kafka import Consumer
import json

config = {
    "bootstrap.servers": "localhost:9092",
    "group.id": "trade-writer",
    "auto.offset.reset": "earliest",
    "enable.auto.commit": False,
}

consumer = Consumer(config)
consumer.subscribe(["trades"])

batch = []

try:
    while True:
        msg = consumer.poll(timeout=1.0)
        if msg is None:
            continue
        if msg.error():
            print(f"Error: {msg.error()}")
            continue

        trade = json.loads(msg.value().decode("utf-8"))
        batch.append(trade)

        if len(batch) >= 500:
            # Process the batch (e.g., write to database / S3)
            print(f"Processing batch of {len(batch)} trades")
            # ... insert into warehouse or write to parquet ...
            consumer.commit(asynchronous=False)
            batch = []
finally:
    consumer.close()
```

## 3. Avro Schema + Schema Registry

```json
{
  "type": "record",
  "name": "Trade",
  "namespace": "com.exchange.events",
  "fields": [
    {"name": "symbol", "type": "string"},
    {"name": "price", "type": "double"},
    {"name": "quantity", "type": "int"},
    {"name": "timestamp", "type": "long", "logicalType": "timestamp-millis"}
  ]
}
```

```python
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.schema_registry.avro import AvroSerializer

sr_client = SchemaRegistryClient({"url": "http://localhost:8081"})
avro_serializer = AvroSerializer(sr_client, schema_str, trade_to_dict)
```

## 4. Great Expectations Suite

```python
import great_expectations as gx

context = gx.get_context()

# Define expectation suite
suite = context.add_or_update_expectation_suite("trades_suite")

# Add expectations to the suite
suite.add_expectation(
    gx.expectations.ExpectColumnToExist(column="symbol")
)
suite.add_expectation(
    gx.expectations.ExpectColumnValuesToNotBeNull(column="price")
)
suite.add_expectation(
    gx.expectations.ExpectColumnValuesToBeBetween(
        column="price", min_value=0, max_value=100000
    )
)
suite.add_expectation(
    gx.expectations.ExpectColumnValuesToNotBeNull(column="quantity")
)

# Create and run checkpoint
checkpoint = context.add_or_update_checkpoint(
    name="trades_checkpoint",
    validations=[{
        "batch_request": batch_request,
        "expectation_suite_name": "trades_suite",
    }],
)

result = checkpoint.run()
print(f"Validation passed: {result.success}")
```

## 5. Custom Expectation

```python
from great_expectations.expectations.expectation import ColumnPairMapExpectation

class ExpectHighPriceGreaterThanLow(ColumnPairMapExpectation):
    """Validate OHLCV: high >= low for every row."""

    map_metric = "column_pair_values.high_gte_low"
    default_kwarg_values = {
        "column_A": "high",
        "column_B": "low",
        "mostly": 1.0,
    }

    @classmethod
    def _prescriptive_renderer(cls, **kwargs):
        return "High price must be >= Low price"
```

### Custom Expectation: Valid Ticker

```python
from great_expectations.expectations.expectation import (
    ColumnMapExpectation,
)

class ExpectColumnValuesToBeValidTicker(ColumnMapExpectation):
    """Expect stock ticker symbols to be 1-5 uppercase letters."""

    map_metric = "column_values.match_regex"
    success_keys = ("regex",)

    default_kwarg_values = {
        "regex": r"^[A-Z]{1,5}$",
        "mostly": 1.0,
    }

# Usage:
# suite.add_expectation(
#     ExpectColumnValuesToBeValidTicker(column="symbol")
# )
```

## 6. GX Checkpoint in Airflow

```python
from airflow.decorators import dag, task
from datetime import datetime

@dag(schedule="@hourly", start_date=datetime(2025, 1, 1), catchup=False)
def trade_quality_pipeline():

    @task
    def validate_trades():
        import great_expectations as gx
        context = gx.get_context()
        result = context.run_checkpoint(
            checkpoint_name="trades_checkpoint"
        )
        if not result.success:
            raise ValueError(
                f"Data quality failed: {result.statistics}"
            )
        return result.statistics

    @task
    def load_to_postgres(stats):
        print(f"Loading validated trades: {stats}")

    stats = validate_trades()
    load_to_postgres(stats)

trade_quality_pipeline()
```

### GX in Airflow (PythonOperator Style)

```python
# Inside an Airflow PythonOperator
def validate_loaded_data(**ctx):
    import great_expectations as gx
    import pandas as pd

    df = pd.read_sql("SELECT * FROM trades", engine)
    context = gx.get_context()
    result = context.run_checkpoint(
        checkpoint_name="trades_checkpoint",
        batch_request={
            "runtime_parameters": {"batch_data": df},
            "batch_identifiers": {"run_id": ctx["run_id"]},
        },
    )
    if not result.success:
        raise ValueError("Data quality check failed!")

# In DAG: download >> load >> validate >> notify
validate = PythonOperator(
    task_id="validate",
    python_callable=validate_loaded_data,
)
```

## Resources

- [confluent-kafka-python API](https://docs.confluent.io/platform/current/clients/confluent-kafka-python/html/index.html)
- [Avro Specification](https://avro.apache.org/docs/current/specification/)
- [Great Expectations Core Concepts](https://docs.greatexpectations.io/docs/conceptual_guides/expectation_classes)
- [GX Checkpoints Guide](https://docs.greatexpectations.io/docs/guides/validation/checkpoints/how_to_create_a_new_checkpoint)

:::cheat
kafka-topics --list | List all topics
kafka-console-producer --topic t | Produce messages
kafka-console-consumer --topic t | Consume messages
kafka-consumer-groups --describe | Check consumer lag
kafka-topics --create --topic t --partitions 3 | Create topic
great_expectations init | Initialize GX project
great_expectations checkpoint run cp | Run checkpoint
:::
