---
title: "Public Datasets & Recommended Reading"
tags: [datasets, books, learning]
---

# Public Datasets & Recommended Reading

## Public Datasets for Practice

- **[NYC Taxi Trip Data](https://www.nyc.gov/site/tlc/about/tlc-trip-record-data.page)** — Millions of taxi rides with pickup/dropoff locations, fares, and timestamps. The go-to dataset for data engineering tutorials — large enough to stress-test pipelines, small enough to run locally.
- **[Kaggle Datasets](https://www.kaggle.com/datasets)** — Community-curated datasets across every domain. Great for finding realistic data to practice transformations and quality checks.
- **[UCI Machine Learning Repository](https://archive.ics.uci.edu/)** — Classic academic datasets with well-documented schemas. Good for building reproducible ETL pipelines.
- **[Google BigQuery Public Datasets](https://cloud.google.com/bigquery/public-data)** — Petabyte-scale datasets queryable via SQL. Includes GitHub activity, Stack Overflow, Wikipedia, and NOAA weather data.
- **[GitHub Archive](https://www.gharchive.org/)** — Every public GitHub event (pushes, PRs, issues) since 2011. Excellent for practicing streaming ingestion and time-series analytics.
- **[World Bank Open Data](https://data.worldbank.org/)** — Economic indicators for every country. Clean, well-structured data ideal for dimensional modeling practice.

## Recommended Books

- **[Designing Data-Intensive Applications](https://dataintensive.net/)** (Martin Kleppmann) — The bible of distributed systems. Covers replication, partitioning, consistency, batch/stream processing. Read this before your first system design interview.
- **[Fundamentals of Data Engineering](https://www.oreilly.com/library/view/fundamentals-of-data/9781098108298/)** (Joe Reis & Matt Housley) — Modern overview of the DE landscape. Covers the full lifecycle from generation to serving, with practical architecture patterns.
- **[The Data Warehouse Toolkit](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/books/data-warehouse-dw-toolkit/)** (Ralph Kimball & Margy Ross) — The definitive guide to dimensional modeling. Star schemas, slowly changing dimensions, and bus architecture explained with real-world examples.
- **[Streaming Systems](https://www.oreilly.com/library/view/streaming-systems/9781491983867/)** (Tyler Akidau, Slava Chernyak & Reuven Lax) — Deep dive into stream processing theory. Windowing, triggers, watermarks, and exactly-once semantics from the creators of Apache Beam.

## Weekly Study Plan Template

Use this template to structure your 15 hours each week. Adapt it to your schedule, but stick to the ratio: 30% learning, 50% building, 20% reading.

**Monday-Tuesday: Learn (5 hrs)**
- Watch tutorials / read documentation for the week's core tool
- Follow along with official quickstart guides
- Take notes on key concepts and architecture decisions

**Wednesday-Friday: Build (7 hrs)**
- Set up the tool locally (Docker, pip install, etc.)
- Implement the week's deliverables step by step
- Write tests as you build (not after)
- Commit working code to Git daily

**Weekend: Read + Reflect (3 hrs)**
- Read the corresponding book chapters (see Recommended Reading)
- Review and refactor your code from the week
- Write a brief README for what you built
- Plan next week's focus areas

## Progress Tracking

| Week | Mon | Tue | Wed | Thu | Fri | Sat | Sun | Done? |
|------|-----|-----|-----|-----|-----|-----|-----|-------|
| 1 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | |
| 2 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | |
| 3 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | |
| 4 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | |
| 5 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | |
| 6 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | |
| 7 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | |
| 8 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | |

## Tips for Success

- Don't skip Docker week. Every production issue traces back to containers.
- Write tests from day one. Testing isn't optional in data engineering.
- Use Git branches for each week's project. Practice the workflow.
- If stuck for > 30 minutes, check Stack Overflow or official Discord.
- Focus on understanding WHY, not just HOW. Interview questions test depth.

:::goal
Build a consistent study habit — 15 hours/week for 8 weeks. Prioritize hands-on practice over passive learning.
:::
