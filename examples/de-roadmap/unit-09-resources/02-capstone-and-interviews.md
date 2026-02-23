---
title: "Capstone Project & Interview Prep"
tags: [capstone, portfolio, interviews]
---

# Capstone Project & Interview Prep

## Capstone Architecture

Build an end-to-end data platform that demonstrates every skill from the 8-week sprint:

:::diagram
graph LR
    A["Event Source"] --> B["Kafka"]
    B --> C["Airflow"]
    C --> D["S3"]
    D --> E["Spark"]
    E --> F["Delta Lake"]
    F --> G["dbt"]
    G --> H["Redshift"]
    H --> I["Superset"]
:::

:::deliverables
- End-to-end pipeline: Kafka → Airflow → S3 → Spark/Delta → dbt → Redshift
- Data quality gates at ingestion and transformation layers
- Infrastructure as code with Terraform
- CI/CD with GitHub Actions (test on PR, deploy on merge)
- Documentation: architecture diagram, data dictionary, runbook
:::

## Portfolio README Template

Your GitHub repo README should include:

1. **Architecture diagram** — visual overview of the full pipeline
2. **Tech stack** — list every tool with version numbers
3. **Quick start** — `docker-compose up` or equivalent one-command setup
4. **Data flow** — describe what happens at each stage
5. **Testing** — how to run tests, what's covered
6. **Decisions** — why you chose each tool (shows engineering judgment)

## Interview Prep: Common Questions

### System Design
- Design a real-time analytics pipeline for an e-commerce platform
- How would you handle late-arriving data in a streaming pipeline?
- Design a data platform for a company going from 1GB/day to 1TB/day
- How do you ensure exactly-once processing in a Kafka pipeline?

### SQL & Modeling
- When would you use a star schema vs. a normalized schema?
- Explain SCD Type 2 and when you'd use it
- Write a query using window functions to find the top 3 per category
- How do you optimize a slow query in Redshift/PostgreSQL?

### Data Quality & Operations
- How do you detect and handle schema drift?
- Describe your approach to data quality in a production pipeline
- How do you handle pipeline failures at 3 AM?
- What metrics would you monitor for a data pipeline?

### Answer Framework (STAR)
- **Situation**: Set the context — what project, what scale
- **Task**: What was your specific responsibility
- **Action**: What did you do — be specific about technical choices
- **Result**: What was the outcome — metrics, improvements, lessons learned

## Resources

- [System Design Primer](https://github.com/donnemartin/system-design-primer)
- [Awesome Data Engineering](https://github.com/igorbarinov/awesome-data-engineering)
- [Data Engineering Wiki](https://dataengineering.wiki/)

:::goal
Prepare for data engineering interviews by building a portfolio project and practicing system design questions with real architectural trade-offs.
:::
