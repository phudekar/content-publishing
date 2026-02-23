---
title: "Cloud, CI/CD & IaC — Overview"
tags: [aws, terraform, github-actions, ci-cd]
---

# Week 8: Cloud, CI/CD & Infrastructure as Code

## Summary

Everything you've built locally now goes to the cloud. AWS dominates the job market for data engineering, so you'll learn S3 (object storage for your lakehouse), Redshift (cloud data warehouse), and IAM (security). Terraform lets you define all this infrastructure as code -- version-controlled, reviewable, and reproducible. Finally, GitHub Actions automates your pipeline: run dbt tests on every PR, lint SQL, validate schemas, and deploy on merge. This week ties everything together into a production-grade, cloud-native data platform.

Before Terraform, cloud infrastructure was created manually through the AWS console -- unreproducible, undocumented, and impossible to review. Spinning up a new environment meant hours of clicking through web forms. Terraform vs. alternatives: CloudFormation is AWS-only; Pulumi uses general-purpose languages but has a smaller community. Before CI/CD for data, broken SQL and schema changes were discovered in production. GitHub Actions vs. alternatives: Jenkins requires self-hosting; GitLab CI is tightly coupled to GitLab; CircleCI is cloud-only. S3 replaced HDFS as the standard data lake storage because it's infinitely scalable, cheap, and requires zero maintenance.

## Key Topics

- **[AWS S3](https://docs.aws.amazon.com/s3/)** — Object storage for data lakes. Lifecycle policies manage storage tiers (Standard, IA, Glacier). Foundation for lakehouse architecture.
- **[AWS Redshift](https://docs.aws.amazon.com/redshift/)** — Columnar cloud data warehouse. COPY command for bulk loading from S3, distribution/sort keys for query optimization.
- **[IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/)** — Identity and Access Management: least-privilege policies, roles for services, instance profiles. Security foundation for all AWS services.
- **[Terraform](https://developer.hashicorp.com/terraform/docs)** — HashiCorp's infrastructure as code tool. Declarative HCL syntax, state management, plan/apply workflow for safe changes.
- **[Terraform Modules](https://developer.hashicorp.com/terraform/language/modules)** — Reusable infrastructure components. Package S3+IAM or Redshift+VPC into composable building blocks.
- **[GitHub Actions CI](https://docs.github.com/en/actions)** — Automated testing on every PR: run dbt test, lint SQL, validate schemas. Matrix builds for multiple Python versions.
- **GitHub Actions CD** — Deploy on merge to main: push DAGs to S3, run dbt in production, update Redshift models.
- **[Secrets Management](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions)** — Store credentials in GitHub Secrets or AWS SSM Parameter Store. Never hardcode API keys or passwords.

## Resources

- [AWS Documentation](https://docs.aws.amazon.com/)
- [Terraform Documentation](https://developer.hashicorp.com/terraform/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)

:::goal
Deploy your entire data platform to the cloud with infrastructure as code and automated CI/CD.
:::

:::deliverables
- Terraform modules for S3 + Redshift + IAM
- Airflow DAG with S3 upload and Redshift COPY
- GitHub Actions CI/CD workflows (test + deploy)
- Cloud architecture diagram
:::

:::diagram
graph LR
    A["GitHub PR"] -->|Trigger| B["CI: Tests"]
    B -->|Merge| C["CD: Deploy"]
    C --> D["S3"]
    C --> E["Redshift"]
    D -->|COPY| E
    E --> F["Superset"]
:::

:::cheat
terraform init | Initialize providers
terraform plan | Preview changes
terraform apply | Apply changes
aws s3 ls | List buckets
aws s3 cp file s3://bucket/ | Upload file
:::
