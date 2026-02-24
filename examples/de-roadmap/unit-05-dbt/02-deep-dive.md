---
title: "dbt Deep-Dive: Code Examples"
tags: [dbt, sql, jinja, testing]
---

# dbt Deep-Dive: Code Examples

:::diagram
graph TD
    SRC["Source: raw.taxi_trips"] --> STG["stg_taxi_trips<br/>(view)"]
    STG --> FCT["fct_daily_trips<br/>(table)"]
    STG --> INC["fct_trips_incremental<br/>(incremental)"]
    STG -.->|"tests: not_null, accepted_range"| T["Schema Tests"]
    FCT -.->|"tests: unique, not_null"| T
:::

## 1. dbt_project.yml

```yaml
name: taxi_analytics
version: "1.0.0"
config-version: 2
profile: taxi

model-paths: ["models"]
test-paths: ["tests"]
macro-paths: ["macros"]
seed-paths: ["seeds"]
snapshot-paths: ["snapshots"]

models:
  taxi_analytics:
    staging:
      +materialized: view
      +schema: staging
    intermediate:
      +materialized: ephemeral
    marts:
      +materialized: table
      +schema: analytics
```

## 2. Staging Model — stg_taxi_trips.sql

```sql
-- models/staging/stg_taxi_trips.sql
with source as (
    select * from {{ source('raw', 'taxi_trips') }}
),

renamed as (
    select
        tpep_pickup_datetime  as pickup_at,
        tpep_dropoff_datetime as dropoff_at,
        pulocationid          as pickup_zone_id,
        dolocationid          as dropoff_zone_id,
        passenger_count,
        trip_distance,
        fare_amount,
        tip_amount,
        total_amount
    from source
    where tpep_pickup_datetime is not null
)

select * from renamed
```

## 3. Mart Model — fct_daily_trips.sql

```sql
-- models/marts/fct_daily_trips.sql
with trips as (
    select * from {{ ref('stg_taxi_trips') }}
),

daily_agg as (
    select
        pickup_zone_id,
        count(*)                                    as trip_count,
        avg(fare_amount)                            as avg_fare,
        avg(trip_distance)                          as avg_distance,
        sum(tip_amount)                             as total_tips,
        avg(tip_amount / nullif(fare_amount, 0))    as avg_tip_pct
    from trips
    group by 1
)

select * from daily_agg
```

## 4. Schema Tests — schema.yml

```yaml
# models/staging/schema.yml
version: 2

sources:
  - name: raw
    schema: public
    tables:
      - name: taxi_trips
        loaded_at_field: tpep_pickup_datetime
        freshness:
          warn_after: {count: 24, period: hour}
          error_after: {count: 48, period: hour}

models:
  - name: stg_taxi_trips
    columns:
      - name: pickup_at
        tests: [not_null]
      - name: fare_amount
        tests:
          - not_null
          - dbt_utils.accepted_range:
              min_value: 0
              max_value: 1000

  - name: fct_daily_trips
    columns:
      - name: pickup_zone_id
        tests:
          - unique
          - not_null
```

## 5. Jinja Macro — cents_to_dollars

```sql
-- macros/cents_to_dollars.sql
{% macro cents_to_dollars(column_name, precision=2) %}
    round({{ column_name }} / 100.0, {{ precision }})
{% endmacro %}
```

Usage in a model:

```sql
select
    trip_id,
    {{ cents_to_dollars('fare_amount_cents') }} as fare_dollars,
    {{ cents_to_dollars('tip_amount_cents') }}  as tip_dollars
from {{ ref('stg_raw_payments') }}
```

## 6. Incremental Model — fct_trips_incremental.sql

```sql
-- models/marts/fct_trips_incremental.sql
{{
    config(
        materialized='incremental',
        unique_key='trip_sk',
        incremental_strategy='merge'
    )
}}

select
    {{ dbt_utils.generate_surrogate_key(['trip_id', 'pickup_at']) }} as trip_sk,
    trip_id,
    pickup_at,
    fare_amount,
    current_timestamp as loaded_at
from {{ ref('stg_taxi_trips') }}

{% if is_incremental() %}
where pickup_at > (
    select max(pickup_at) from {{ this }}
)
{% endif %}
```

## 7. Sources & Freshness

### Sources with Per-Table Freshness

Different tables may have different freshness requirements. Static reference tables
(like zone lookups) can disable freshness checks entirely, while transactional tables
need tight SLAs:

```yaml
# models/staging/sources.yml
version: 2

sources:
  - name: raw
    schema: public
    tables:
      - name: taxi_trips
        loaded_at_field: tpep_pickup_datetime
        freshness:
          warn_after: {count: 24, period: hour}
          error_after: {count: 48, period: hour}
      - name: taxi_zones
        freshness: null  # static reference data

# Check freshness: dbt source freshness
```

Run freshness check:

```bash
dbt source freshness
```

## 8. Snapshots — SCD Type 2

```sql
-- snapshots/snap_taxi_zones.sql
{% snapshot snap_taxi_zones %}
{{
    config(
        target_schema='snapshots',
        unique_key='zone_id',
        strategy='check',
        check_cols=['zone_name', 'borough']
    )
}}

select * from {{ source('raw', 'taxi_zones') }}

{% endsnapshot %}
```

## Resources

- [dbt Project Configuration](https://docs.getdbt.com/reference/dbt_project.yml)
- [dbt Sources](https://docs.getdbt.com/docs/build/sources)
- [dbt Snapshots](https://docs.getdbt.com/docs/build/snapshots)
- [dbt Incremental Models](https://docs.getdbt.com/docs/build/incremental-models)
- [Jinja Template Designer](https://jinja.palletsprojects.com/en/3.1.x/templates/)

:::cheat
dbt run | Build all models
dbt test | Run all tests
dbt docs generate | Generate docs
dbt docs serve | Serve docs site
dbt run --select staging.* | Run staging only
dbt source freshness | Check source freshness
dbt snapshot | Run snapshots
dbt run --full-refresh | Rebuild incremental
:::
