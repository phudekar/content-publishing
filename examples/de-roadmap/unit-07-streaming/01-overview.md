---
title: "Kafka & Data Quality — Overview"
tags: [kafka, streaming, great-expectations, data-quality]
---

# Week 7: Streaming, Kafka & Data Quality

## Summary

Real-time data is everywhere: user clickstreams, IoT sensors, financial transactions, application logs. Apache Kafka is the backbone of streaming infrastructure at LinkedIn, Netflix, and most modern tech companies. This week you'll learn Kafka's architecture (brokers, topics, partitions, consumer groups) and build a producer/consumer pipeline. Then you'll add Great Expectations for data quality -- automated validation that catches schema drift, null spikes, and distribution anomalies before bad data reaches your warehouse. Data quality is what separates hobby projects from production systems.

Before Kafka, message queues like RabbitMQ handled event-by-event processing but couldn't handle millions of events per second or replay messages. Kafka's log-based architecture solved this by treating messages as an immutable, ordered log that consumers can read at their own pace. Before Great Expectations, data quality was checked manually or with ad-hoc SQL queries after problems were discovered. GX brings the concept of "data unit tests" -- automated, version-controlled expectations that run as part of your pipeline. For comparison, dbt tests handle quality for SQL transforms, but GX works on any data (files, DataFrames, databases) at any stage of the pipeline.

## Key Topics

- **[Kafka Architecture](https://kafka.apache.org/documentation/#design)** — Brokers store data, topics organize streams, partitions enable parallelism, replication ensures durability. Distributed commit log.
- **[Producers](https://kafka.apache.org/documentation/#producerapi)** — Applications that publish messages to topics. Configure serialization, partitioning strategy, and acknowledgment levels.
- **[Consumers & Consumer Groups](https://kafka.apache.org/documentation/#consumerapi)** — Read messages from topics with offset tracking. Consumer groups enable parallel processing with automatic rebalancing.
- **[Schema Registry](https://docs.confluent.io/platform/current/schema-registry/index.html)** — Central schema store (Avro/JSON Schema) for Kafka messages. Enforces compatibility rules to prevent breaking changes.
- **[Great Expectations (GX)](https://greatexpectations.io/)** — Open-source data quality framework. Define expectations (rules), group into suites, run via checkpoints.
- **[Custom Expectations](https://docs.greatexpectations.io/docs/guides/expectations/creating_custom_expectations/overview)** — Domain-specific validation rules extending GX's built-in library. E.g., validate OHLCV candlestick data relationships.
- **Data Quality in Pipelines** — Inline validation (fail fast) vs. post-load checks (report and continue). Quality gates prevent bad data propagation.
- **Alerting** — Integrate quality failures with Slack, email, or PagerDuty. Automated notifications when data quality degrades.

## Resources

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Confluent Kafka Python](https://github.com/confluentinc/confluent-kafka-python)
- [Great Expectations Documentation](https://docs.greatexpectations.io/)
- [Schema Registry Documentation](https://docs.confluent.io/platform/current/schema-registry/index.html)

:::goal
Build a streaming pipeline with data quality gates -- reliable data is more valuable than fast data.
:::

:::deliverables
- Kafka producer simulating real-time events
- Consumer writing validated records to PostgreSQL
- Great Expectations suite with 10+ expectations
- Airflow integration for scheduled quality checks
- Data Docs site with validation results
:::

:::diagram
graph LR
    A["Event Source"] -->|Produce| B["Kafka"]
    B -->|Consume| C["Consumer"]
    C -->|Validate| D["GX Checkpoint"]
    D -->|Pass| E["PostgreSQL"]
    D -->|Fail| F["Data Docs"]
:::

:::cheat
kafka-topics --list | List all topics
kafka-console-producer --topic t | Produce messages
kafka-console-consumer --topic t | Consume messages
kafka-consumer-groups --describe | Check consumer lag
:::
