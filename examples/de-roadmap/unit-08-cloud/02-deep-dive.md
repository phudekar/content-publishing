---
title: "Cloud & CI/CD Deep-Dive: Code Examples"
tags: [terraform, aws, github-actions, redshift]
---

# Cloud & CI/CD Deep-Dive: Code Examples

## 1. Terraform S3 + Redshift

```hcl
# main.tf
provider "aws" {
  region = var.aws_region
}

resource "aws_s3_bucket" "data_lake" {
  bucket = "${var.project}-data-lake"
  tags   = { Environment = var.env }
}

resource "aws_s3_bucket_lifecycle_configuration" "archive" {
  bucket = aws_s3_bucket.data_lake.id
  rule {
    id     = "archive-old-data"
    status = "Enabled"
    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }
    transition {
      days          = 365
      storage_class = "GLACIER"
    }
  }
}

resource "aws_redshift_cluster" "warehouse" {
  cluster_identifier  = "${var.project}-warehouse"
  database_name       = "analytics"
  master_username     = var.redshift_user
  master_password     = var.redshift_password
  node_type           = "dc2.large"
  number_of_nodes     = 2
  skip_final_snapshot = true
}
```

## 2. Terraform Variables

```hcl
# variables.tf
variable "project" {
  type    = string
  default = "taxi-platform"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "env" {
  type    = string
  default = "dev"
}

variable "redshift_user" {
  type      = string
  sensitive = true
}

variable "redshift_password" {
  type      = string
  sensitive = true
}
```

## 3. IAM Policy

```hcl
resource "aws_iam_role" "redshift_s3_reader" {
  name = "${var.project}-redshift-s3-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "redshift.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "s3_read" {
  name = "s3-read-access"
  role = aws_iam_role.redshift_s3_reader.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject", "s3:ListBucket"]
      Resource = [
        aws_s3_bucket.data_lake.arn,
        "${aws_s3_bucket.data_lake.arn}/*"
      ]
    }]
  })
}
```

## 4. Redshift COPY

```sql
COPY analytics.fact_trips
FROM 's3://taxi-platform-data-lake/gold/trips/'
IAM_ROLE 'arn:aws:iam::123456789:role/taxi-platform-redshift-s3-role'
FORMAT AS PARQUET;
```

## 5. AWS CLI S3 Operations

```bash
# Upload file to S3
aws s3 cp data/output.parquet s3://taxi-platform-data-lake/bronze/

# Sync local directory to S3
aws s3 sync data/gold/ s3://taxi-platform-data-lake/gold/ --delete

# List objects with prefix
aws s3 ls s3://taxi-platform-data-lake/silver/trips/ --recursive
```

## 6. GitHub Actions CI

```yaml
# .github/workflows/ci.yml
name: CI Pipeline
on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.11", "3.12"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
      - run: pip install -e ".[dev]"
      - run: ruff check .
      - run: pytest tests/ -v --tb=short

  dbt-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install dbt-postgres
      - run: dbt deps
      - run: dbt build --target ci
```

## 7. GitHub Actions CD

```yaml
# .github/workflows/cd.yml
name: CD Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy DAGs to S3
        run: aws s3 sync dags/ s3://taxi-platform-airflow/dags/

      - name: Run dbt in production
        run: |
          pip install dbt-redshift
          dbt run --target prod
          dbt test --target prod

      - name: Apply Terraform
        run: |
          cd infra/
          terraform init
          terraform apply -auto-approve
        env:
          TF_VAR_redshift_password: ${{ secrets.REDSHIFT_PASSWORD }}
```

## Resources

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS S3 Bucket Resource](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket)
- [Redshift COPY Command](https://docs.aws.amazon.com/redshift/latest/dg/r_COPY.html)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

:::cheat
terraform init | Initialize providers
terraform plan | Preview changes
terraform apply | Apply changes
terraform destroy | Tear down resources
aws s3 ls | List buckets
aws s3 cp file s3://bucket/ | Upload file
aws redshift describe-clusters | List clusters
gh workflow run ci.yml | Trigger workflow
:::
