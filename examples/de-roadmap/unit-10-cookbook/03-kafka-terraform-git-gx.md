---
title: "Cookbook: Kafka, Terraform, Git & Great Expectations"
tags: [kafka, terraform, git, great-expectations, cheat-sheet]
---

# Cookbook: Kafka, Terraform, Git & Great Expectations

## Kafka Cheat Sheet

:::cheat
kafka-topics --create --topic t --partitions 3 | Create topic
kafka-topics --list --bootstrap-server localhost:9092 | List topics
kafka-topics --describe --topic t | Describe topic
kafka-console-producer --topic t | Produce messages (stdin)
kafka-console-consumer --topic t --from-beginning | Consume all messages
kafka-consumer-groups --list | List consumer groups
kafka-consumer-groups --describe --group g | Check consumer lag
kafka-configs --alter --topic t --add-config retention.ms=86400000 | Set retention
:::

### Producer Pattern

```python
from confluent_kafka import Producer
import json

producer = Producer({"bootstrap.servers": "localhost:9092"})

def produce_event(topic: str, key: str, value: dict):
    producer.produce(
        topic, key=key.encode(),
        value=json.dumps(value).encode(),
        callback=lambda err, msg: print(f"Error: {err}") if err else None,
    )
    producer.flush()
```

### Python Client Patterns

```python
# confluent-kafka producer with delivery report
from confluent_kafka import Producer

def delivery_report(err, msg):
    if err:
        print(f"FAILED: {err}")
    else:
        print(f"OK: {msg.topic()}[{msg.partition()}]")

p = Producer({"bootstrap.servers": "localhost:9092"})
p.produce("topic", value=b"hello",
           callback=delivery_report)
p.flush()

# JSON serialization pattern
import json
p.produce("topic",
           key=record["id"].encode(),
           value=json.dumps(record).encode())
```

### Consumer Patterns

```python
# Batch consumer with manual commit
from confluent_kafka import Consumer
import json

c = Consumer({
    "bootstrap.servers": "localhost:9092",
    "group.id": "etl-pipeline",
    "auto.offset.reset": "earliest",
    "enable.auto.commit": False,
    "max.poll.interval.ms": 300000,
})
c.subscribe(["trades"])

BATCH_SIZE = 500
batch = []

while True:
    msg = c.poll(1.0)
    if msg is None:
        if batch:  # flush remaining
            write_to_db(batch)
            c.commit()
            batch.clear()
        continue
    if msg.error():
        handle_error(msg.error())
        continue
    batch.append(json.loads(msg.value()))
    if len(batch) >= BATCH_SIZE:
        write_to_db(batch)
        c.commit()  # commit AFTER successful write
        batch.clear()
```

### Consumer Pattern

```python
from confluent_kafka import Consumer

consumer = Consumer({
    "bootstrap.servers": "localhost:9092",
    "group.id": "etl-consumer",
    "auto.offset.reset": "earliest",
})
consumer.subscribe(["events"])

while True:
    msg = consumer.poll(1.0)
    if msg is None: continue
    if msg.error(): print(f"Error: {msg.error()}"); continue
    event = json.loads(msg.value())
    process_event(event)
```

### Kafka Configuration Reference

| Setting | Description |
|---|---|
| `acks=all` | Wait for all replicas to acknowledge (strongest durability) |
| `linger.ms=10` | Wait 10ms to batch messages (throughput vs latency) |
| `compression.type=snappy` | Compress messages (30-50% size reduction) |
| `enable.idempotence=true` | Exactly-once producer semantics |
| `max.poll.records=500` | Max messages per consumer poll() |
| `session.timeout.ms=45000` | Consumer heartbeat timeout |

### Kafka Docker Compose

```yaml
# Minimal Kafka + Schema Registry for local dev
services:
  kafka:
    image: confluentinc/cp-kafka:7.6.0
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      KAFKA_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      CLUSTER_ID: MkU3OEVBNTcwNTJENDM2Qk
    ports: ["9092:9092"]

  schema-registry:
    image: confluentinc/cp-schema-registry:7.6.0
    depends_on: [kafka]
    environment:
      SCHEMA_REGISTRY_KAFKASTORE_BOOTSTRAP_SERVERS: kafka:9092
      SCHEMA_REGISTRY_HOST_NAME: schema-registry
    ports: ["8081:8081"]
```

---

## Terraform Cheat Sheet

:::cheat
terraform init | Initialize providers and backend
terraform plan | Preview infrastructure changes
terraform apply | Apply changes (with confirmation)
terraform apply -auto-approve | Apply without confirmation
terraform destroy | Tear down all resources
terraform fmt | Format HCL files
terraform validate | Check syntax
terraform state list | List managed resources
terraform import TYPE.NAME ID | Import existing resource
terraform output | Show output values
:::

### S3 + IAM Pattern

```hcl
resource "aws_s3_bucket" "data_lake" {
  bucket = "company-data-lake-${var.environment}"
  tags   = { Environment = var.environment }
}

resource "aws_iam_role" "pipeline" {
  name = "data-pipeline-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "redshift.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "s3_access" {
  role = aws_iam_role.pipeline.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject", "s3:ListBucket"]
      Resource = ["${aws_s3_bucket.data_lake.arn}/*"]
    }]
  })
}
```

### Common Resource Patterns

```hcl
# Variables with defaults
variable "env" {
  type    = string
  default = "dev"
}

# Locals for computed values
locals {
  prefix = "${var.project}-${var.env}"
}

# IAM role for Redshift to access S3
resource "aws_iam_role" "redshift_s3" {
  name = "${local.prefix}-redshift-s3"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "redshift.amazonaws.com"
      }
    }]
  })
}

# Output values
output "bucket_arn" {
  value = aws_s3_bucket.lakehouse.arn
}
```

### Terraform for Data Pipelines

```hcl
# S3 bucket with lifecycle (move old data to Glacier)
resource "aws_s3_bucket_lifecycle_configuration" "lake" {
  bucket = aws_s3_bucket.lakehouse.id

  rule {
    id     = "archive-old-bronze"
    status = "Enabled"
    filter { prefix = "bronze/" }
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    expiration { days = 365 }
  }
}

# Redshift with IAM role attachment
resource "aws_redshift_cluster" "wh" {
  cluster_identifier = "${local.prefix}-wh"
  database_name      = "analytics"
  node_type          = "dc2.large"
  number_of_nodes    = 2
  master_username    = "admin"
  master_password    = var.redshift_password
  iam_roles = [aws_iam_role.redshift_s3.arn]
}
```

---

## Git + GitHub Actions Cheat Sheet

:::cheat
git log --oneline -20 | Recent commit history
git branch -a | List all branches
git stash && git stash pop | Stash and restore changes
git rebase -i HEAD~3 | Interactive rebase last 3 commits
git cherry-pick HASH | Apply specific commit
git bisect start | Binary search for bug introduction
gh pr create --title "T" --body "B" | Create PR via CLI
gh pr merge --squash | Squash merge PR
gh run list | List workflow runs
gh run watch | Watch running workflow
:::

### CI Workflow Pattern

```yaml
name: CI
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.11" }
      - run: pip install -e ".[dev]"
      - run: ruff check .
      - run: mypy src/ --strict
      - run: pytest tests/ -v --cov --cov-report=xml
      - run: dbt test --profiles-dir .
```

### Git Branching Strategy

```bash
# Feature branch workflow
git checkout -b feature/add-kafka-consumer main
# ... make changes, commit ...
git push -u origin feature/add-kafka-consumer
# Create PR, get review, merge

# Release branch workflow
git checkout -b release/v1.2.0 main
# Cherry-pick hotfixes:
git cherry-pick <hotfix-sha>
git tag v1.2.0
git push origin v1.2.0

# Useful aliases for .gitconfig
# [alias]
#   lg = log --oneline --graph --all
#   st = status -sb
#   co = checkout
#   unstage = reset HEAD --
```

### GitHub Actions Workflow Patterns

```yaml
# Reusable workflow (called by other workflows)
on:
  workflow_call:
    inputs:
      environment:
        type: string
        required: true

# Matrix builds
strategy:
  matrix:
    python: ["3.11", "3.12"]
    os: [ubuntu-latest, macos-latest]

# Cache dependencies
- uses: actions/cache@v4
  with:
    path: ~/.cache/pip
    key: ${{ runner.os }}-pip-${{ hashFiles("**/requirements.txt") }}

# Deploy on push to main
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

---

## Great Expectations Cheat Sheet

:::cheat
great_expectations init | Initialize GX project
great_expectations suite new | Create expectation suite
great_expectations checkpoint run cp | Run checkpoint
great_expectations docs build | Build Data Docs site
great_expectations datasource new | Add data source
:::

### Expectation Suite Pattern

```python
import great_expectations as gx

context = gx.get_context()
suite = context.add_expectation_suite("orders_suite")

# Column-level expectations
suite.add_expectation(
    gx.expectations.ExpectColumnValuesToNotBeNull(column="order_id"))
suite.add_expectation(
    gx.expectations.ExpectColumnValuesToBeUnique(column="order_id"))
suite.add_expectation(
    gx.expectations.ExpectColumnValuesToBeBetween(
        column="amount", min_value=0, max_value=100000))
suite.add_expectation(
    gx.expectations.ExpectColumnValuesToBeInSet(
        column="status", value_set=["pending", "completed", "cancelled"]))
```

### Common Expectations

```python
# Column-level expectations
expect_column_values_to_not_be_null("id")
expect_column_values_to_be_unique("id")
expect_column_values_to_be_between(
    "price", min_value=0, max_value=10000)
expect_column_values_to_be_in_set(
    "status", ["active", "closed", "pending"])
expect_column_values_to_match_regex(
    "email", r"^[\w.]+@[\w.]+\.[a-z]{2,}$")

# Table-level expectations
expect_table_row_count_to_be_between(
    min_value=1000, max_value=10_000_000)
expect_table_columns_to_match_ordered_list(
    ["id", "name", "price", "quantity", "ts"])

# Multi-column expectations
expect_compound_columns_to_be_unique(
    ["date", "symbol"])
expect_column_pair_values_a_to_be_greater_than_b(
    "end_time", "start_time")
```

### Checkpoint Configuration

```yaml
# great_expectations/checkpoints/trades.yml
name: trades_checkpoint
config_version: 1.0
class_name: Checkpoint
run_name_template: "trades_%Y%m%d"
validations:
  - batch_request:
      datasource_name: warehouse
      data_asset_name: trades
    expectation_suite_name: trades_quality
action_list:
  - name: store_validation_result
    action:
      class_name: StoreValidationResultAction
  - name: update_data_docs
    action:
      class_name: UpdateDataDocsAction
```

### GX + Pandas Quick Start

```python
import great_expectations as gx
import pandas as pd

# Quick validation without project setup
df = pd.read_parquet("data/trades.parquet")

context = gx.get_context()  # ephemeral context
ds = context.sources.add_pandas("mem")
asset = ds.add_dataframe_asset("trades")

batch = asset.build_batch_request(
    dataframe=df
)
validator = context.get_validator(
    batch_request=batch,
    expectation_suite_name="quick_check",
    create_expectation_suite_with_name="quick_check",
)

# Run expectations interactively
validator.expect_table_row_count_to_be_between(
    min_value=100, max_value=1_000_000)
validator.expect_column_values_to_not_be_null("symbol")
validator.expect_column_mean_to_be_between(
    "price", min_value=1, max_value=1000)

# Get results
results = validator.validate()
print(f"Success: {results.success}")
print(f"Failed: {results.statistics['unsuccessful_expectations']}")
```

### GX Project Structure

```
great_expectations/
+-- great_expectations.yml      # main config
+-- expectations/
|   +-- trades_quality.json     # expectation suite
|   +-- orders_quality.json
+-- checkpoints/
|   +-- trades_checkpoint.yml   # validation config
+-- plugins/
|   +-- custom_expectations/
|       +-- expect_valid_ticker.py
+-- uncommitted/
    +-- data_docs/              # generated HTML reports
        +-- local_site/
            +-- index.html
```

### Data Quality Strategy by Layer

| Layer | What to Check | When |
|-------|--------------|------|
| Bronze | Schema, nulls, row count | On ingestion |
| Silver | Uniqueness, referential integrity, ranges | After transform |
| Gold | Business rules, aggregation totals, freshness | Before serving |

:::diagram
graph LR
    A["Raw Data"] -->|Ingest| B["Bronze"]
    B -->|Validate Schema| C{"GX Checkpoint"}
    C -->|Pass| D["Silver"]
    C -->|Fail| E["Alert + Quarantine"]
    D -->|Validate Quality| F{"GX Checkpoint"}
    F -->|Pass| G["Gold"]
    F -->|Fail| E
    G --> H["Analytics / BI"]
:::

### Data Quality Strategy by Layer

```python
# Bronze (raw): minimal checks
# - Schema matches expected columns
# - Row count > 0
# - No completely empty columns

# Silver (cleaned): data validity
# - Primary keys are unique and not null
# - Values in expected ranges
# - Foreign keys exist in dimension tables
# - Timestamps are in valid ranges

# Gold (aggregated): business logic
# - Totals match across tables
# - No negative revenue/quantities
# - Row counts within expected bounds
# - Distributions haven't shifted dramatically
```

## Resources

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Terraform Documentation](https://developer.hashicorp.com/terraform/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Great Expectations Documentation](https://docs.greatexpectations.io/)
- [Confluent Kafka Python](https://github.com/confluentinc/confluent-kafka-python)
