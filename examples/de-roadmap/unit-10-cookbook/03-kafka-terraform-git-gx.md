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

## Resources

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Terraform Documentation](https://developer.hashicorp.com/terraform/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Great Expectations Documentation](https://docs.greatexpectations.io/)
- [Confluent Kafka Python](https://github.com/confluentinc/confluent-kafka-python)
