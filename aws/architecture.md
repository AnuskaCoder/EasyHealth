# EasyHealth Proposed Cloud Architecture on AWS

This is a proposed target architecture, not infrastructure currently provisioned for the live application. The current Vercel deployment hosts the frontend only; the complete backend is not deployed there.

```
                              [ Users / Mobile App / Web ]
                                           │
                                  [ Route 53 DNS ]
                                           │
                            [ AWS CloudFront (Global CDN) ]
                                           │
                           [ AWS Application Load Balancer ]
                                ┌──────────┴──────────┐
                       (Path: /api/*)             (Path: /ai/*)
                                │                      │
                 [ ECS / Fargate Service ]   [ ECS / Fargate Service ]
                 (Node.js / Express Backend) (Python / FastAPI AI Service)
                                │                      │
                ┌───────────────┼──────────────────────┤
                │               │                      │
        [ Amazon RDS ]  [ Amazon ElastiCache ]  [ Amazon S3 Bucket ]
        (PostgreSQL 15)   (Redis 7 Cluster)     (Encrypted EHR Reports)
          Multi-AZ           In-Memory             SSE-KMS + HIPAA
```

---

## AWS Services Mapping

| Layer | AWS Service | Purpose & Configuration |
|---|---|---|
| **Edge & DNS** | **Amazon Route 53** | High-availability DNS routing, SSL/TLS certificate termination via ACM. |
| **CDN** | **AWS CloudFront** | Low-latency caching of static React web assets and mobile bundle files. |
| **Load Balancing** | **Application Load Balancer (ALB)** | Path-based routing: `/api/*` to Node.js backend target group, `/ai/*` to Python FastAPI target group. |
| **Compute / Containers** | **Amazon ECS with AWS Fargate** | Serverless container execution for backend & AI microservices with auto-scaling (CPU/memory triggers). |
| **Relational Database** | **Amazon RDS PostgreSQL** | Multi-AZ deployment, automated daily snapshots, read replicas, and SSL enforcement. |
| **Cache & Sessions** | **Amazon ElastiCache (Redis)** | High-throughput sub-millisecond session caching, JWT token revocation list, rate limiting. |
| **EHR File Storage** | **Amazon S3** | Medical reports, scans, and prescriptions stored with SSE-KMS encryption and S3 Object Lock for HIPAA compliance. |
| **Security & Secrets** | **AWS Secrets Manager & KMS** | Management of JWT signing keys, DB credentials, and AES-256 master keys. |
| **Observability** | **Amazon CloudWatch & X-Ray** | Container log aggregation, distributed tracing, latency monitoring, and alarm alerts. |
| **CI/CD** | **AWS ECR & GitHub Actions** | Automated image builds, vulnerability scanning, and rolling deployment to ECS Fargate. |
