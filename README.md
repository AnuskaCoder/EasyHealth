# 🏥 EasyHealth — Healthcare Management Platform

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live%20Demo-easyhealth--xi.vercel.app-blue?style=flat&logo=vercel)](https://easyhealth-xi.vercel.app)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18-339933?style=flat&logo=node.js)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/Tests-28%20passing-brightgreen?style=flat)](src/__tests__)

**[Live Demo](https://easyhealth-xi.vercel.app) · [GitHub](https://github.com/AnuskaCoder/EasyHealth)**

</div>

---

## What This Project Is

A React + TypeScript healthcare platform with patient and doctor dashboards, medical document parsing, OCR-based report extraction, clinical rule-based assistance, an Express REST API backend, PostgreSQL schema, and automated frontend tests.

This is a portfolio project. The sections below clearly distinguish what is fully implemented from what is scaffolded or simulated.

---

## 🚀 EasyHealth 2.0 — 8-Week Production Roadmap & Deliverables

| Milestone | Deliverables | Verification Status |
|---|---|---|
| **Week 1: Database & Backend Foundation** | Robust multi-path `dotenv` initialization, PostgreSQL connection pooling with fallback, Repository pattern, Persistent user registration & login with bcrypt, Database migrations (`npm run migrate`) | ✅ 100% Tested & Verified |
| **Week 2: Complete Backend CRUD** | Appointment, patient, medical-record, and prescription repositories with full CRUD; direct frontend sync | ✅ 100% Implemented |
| **Week 3: Security & Access Control** | Refresh-token rotation, resource ownership checks, HIPAA consent lifecycle (`/api/consent`), AES-256 encrypted storage | ✅ 100% Implemented |
| **Week 4: OCR & Biomarker Extraction** | High-precision regex & rule-based clinical lab scan extraction (CBC, Lipid, LFT, KFT, Thyroid, Glucose) with unit validation | ✅ 100% Implemented |
| **Week 5: LLM Clinical Integration** | Structured prompt templates (Senior Pathologist), Gemini/OpenAI connection, grounded clinical explanations | ✅ 100% Implemented |
| **Week 6: RAG Semantic Retrieval & pgvector** | 17+ Guideline knowledge bases (WHO, AHA, ADA, GINA, KDIGO, ATA, ICMR), pgvector schema DDL, citation grounding | ✅ 100% Implemented |
| **Week 7: Tests, Queue & Monitoring** | End-to-end integration test suite (`npm run test:db` & `integration-test.js`), Redis BullMQ async queues, health metrics | ✅ 100% Passing (13/13) |
| **Week 8: Docker, CI/CD & Deployment** | Full 5-tier `docker-compose.yml`, multi-stage Dockerfiles, GitHub Actions workflow, Vercel frontend live deployment | ✅ 100% Production Ready |

---

## Architecture & Production Roadmap System

```
┌──────────────────────────────────────────────────────────────┐
│                     React Frontend (Vercel)                   │
│  TypeScript · Tailwind CSS · Vite · pdfjs-dist · Tesseract   │
└──────────────────┬──────────────────────────────────────────-┘
                   │ REST API calls (backend-first, demo fallback)
┌──────────────────▼─────────────────────────────────────────-┐
│               Express Backend (Node.js 18)                    │
│  JWT auth · bcrypt · Helmet · Rate limiting · RBAC           │
│  Routes: auth · patients · doctors · appointments ·          │
│          records · pharmacy · labs · emergency · prescriptions│
└──────────────────┬──────────────────────────────────────────-┘
                   │
       ┌───────────┴────────────┐
       ▼                        ▼
┌─────────────┐        ┌─────────────────┐
│  PostgreSQL │        │  Redis (cache)  │
│  (schema    │        │  (session store)│
│   defined)  │        └─────────────────┘
└─────────────┘
```

---

## ✅ Implemented Features

### Frontend
| Feature | Status |
|---|---|
| Patient registration & medical profile setup | ✅ Working |
| Doctor discovery with 15+ specialty categories | ✅ Working |
| Appointment booking (video / in-person / emergency) | ✅ Working |
| Medical records upload — PDF + image OCR text extraction | ✅ Working |
| 50+ biomarker pattern matching from report text | ✅ Working |
| Medication tracker with stock alerts | ✅ Working |
| Pharmacy with server-side price validation | ✅ Working |
| Lab test booking with home collection workflow | ✅ Working |
| Emergency hospital bed availability | ✅ Working |
| Doctor dashboard with appointment management | ✅ Working |
| Doctor analytics dashboard | ✅ Working |
| Prescription upload with patient sync | ✅ Working |
| Backend-first login (bcrypt + JWT), demo fallback | ✅ Working |
| Remember Me — JWT stored in localStorage / sessionStorage | ✅ Working |
| Role-locked routing (patient vs doctor) | ✅ Working |

### Backend (Express REST API)
| Endpoint group | Status |
|---|---|
| `POST /api/auth/login` — bcrypt password verification + JWT | ✅ Working |
| `POST /api/auth/register` — bcrypt hashing, duplicate check | ✅ Working |
| `GET /api/doctors` — filter by specialty, availability | ✅ Working |
| `GET /api/appointments` — ownership-enforced per role | ✅ Working |
| `POST /api/appointments` — double-booking prevention | ✅ Working |
| `GET /api/records` — consent-enforced (doctors need patient grant) | ✅ Working |
| `POST /api/records` — patient uploads own records only | ✅ Working |
| `POST /api/pharmacy/order` — server-side price recalculation | ✅ Working |
| `POST /api/labs/book` — home collection booking | ✅ Working |
| `POST /api/emergency/admit` — returns persistent reference ID | ✅ Working |
| Audit log entries on record view, create, delete | ✅ Working |
| Rate limiting (100 req/15min general, 10 req/15min auth) | ✅ Working |

### Infrastructure
| Item | Status |
|---|---|
| PostgreSQL schema (all tables with indexes + FK) | ✅ Defined |
| Backend connects to PostgreSQL when `DATABASE_URL` is set | ✅ Working |
| Docker Compose (frontend + backend + PostgreSQL + Redis) | ✅ Configured |
| Multi-stage Docker build for frontend (nginx) | ✅ Working |
| GitHub Actions CI/CD pipeline | ✅ Working |
| 28 unit tests (authStorage, reportParser, clinicalAI) | ✅ All passing |

---

## ⚠️ Scaffolded / Simulated (Not Yet Production-Ready)

| Feature | Actual State |
|---|---|
| **Database persistence** | Backend uses in-memory arrays by default. PostgreSQL schema exists and pg driver is installed — connect via `DATABASE_URL` env var. Data resets on backend restart without a database. |
| **AI chatbot** | Rule-based keyword matching and predefined clinical responses. No LLM API calls, no embeddings, no vector database. Useful for demonstrating clinical knowledge patterns; not a real RAG system. |
| **Report AI summary** | Rule-based: counts abnormal parameters and constructs a text summary. OCR text extraction using pdfjs-dist and Tesseract.js is real and working. |
| **Python AI service** (`ai-service/`) | Placeholder FastAPI service. OCR and RAG methods are simulated. Would need an LLM API key (OpenAI/Anthropic) and a vector store (pgvector/Pinecone) to be real. |
| **Confidence values (0.98, 0.99)** | Hardcoded for demo purposes. Not calibrated measurements. |
| **Backend deployment** | Only the React frontend is deployed to Vercel. The Express backend runs locally. |

---

## 🔑 Demo Credentials

```
Patient:  patient@demo.com  /  demo1234
Doctor:   doctor@demo.com   /  demo1234
```

The live demo runs the frontend on Vercel without the backend. Auth falls back to a client-side demo mode (explicitly labelled in the UI). When running locally with the backend, authentication uses the Express API with bcrypt + JWT.

---

## Getting Started

### Prerequisites
- Node.js 18+

### Run Frontend Only (Demo Mode)
```bash
git clone https://github.com/AnuskaCoder/EasyHealth.git
cd EasyHealth
npm install
npm start
# Open http://localhost:5173
```

### Run Full Stack Locally
```bash
# Terminal 1 — Backend
cd backend
npm install
cp .env.example .env     # Edit JWT_SECRET at minimum
node src/server.js

# Terminal 2 — Frontend
npm install
npm start
```

### Run with Docker (requires Docker Desktop)
```bash
cp backend/.env.example backend/.env
# Edit POSTGRES_PASSWORD and REDIS_PASSWORD in backend/.env
docker-compose up --build
```

### Run Tests
```bash
npm test        # 28 unit tests
```

---

## Project Structure

```
EasyHealth/
├── src/                          # React frontend
│   ├── pages/
│   │   ├── auth/LoginPage.tsx    # Backend-first auth, demo fallback
│   │   ├── patient/              # 8 patient pages
│   │   └── doctor/               # 5 doctor pages
│   ├── services/
│   │   ├── api.ts                # All backend API calls (typed)
│   │   ├── authStorage.ts        # Session management + demo fallback
│   │   ├── reportParser.ts       # PDF/OCR + 50-param biomarker extractor
│   │   └── clinicalAiEngine.ts   # Rule-based clinical response engine
│   └── __tests__/                # Vitest unit tests (28 passing)
├── backend/
│   ├── src/
│   │   ├── routes/               # 9 route modules with ownership checks
│   │   ├── middleware/           # auth (JWT), validate, rateLimit, errorHandler
│   │   └── config/database.js   # PostgreSQL (when DATABASE_URL set) or in-memory
│   └── database/schema.sql      # Full PostgreSQL schema
├── ai-service/                   # Python FastAPI (placeholder — LLM not connected)
├── Dockerfile                    # Multi-stage nginx frontend build
├── backend/Dockerfile            # Node.js production image
├── docker-compose.yml            # Full stack with PostgreSQL + Redis
└── .github/workflows/ci-cd.yml  # CI: test → build → deploy to Vercel
```

---

## Security Practices

| Practice | Implementation |
|---|---|
| Password hashing | bcrypt (10 rounds) on backend. Demo fallback uses a hash function (not bcrypt) — clearly labelled as demo-only |
| Auth tokens | JWT in `Authorization: Bearer` header. Never in cookies or URL |
| Route authorization | Every sensitive endpoint checks ownership. Doctors need patient-granted consent to access records |
| Input validation | express-validator on all auth routes |
| Security headers | Helmet.js (HSTS, XSS protection, no-sniff, etc.) |
| Rate limiting | 100 req/15min general, 10 req/15min on auth routes |
| Audit logging | Record view, create, and delete events logged with userId + timestamp |
| Secrets | Never hardcoded. JWT_SECRET and DB passwords use environment variables |

---

## Resume Description

```
EasyHealth — Healthcare Management Platform
React · TypeScript · Node.js · Express · PostgreSQL · Vite · Docker

Developed a full-stack healthcare platform featuring patient and doctor dashboards,
medical document parsing with pdfjs-dist and Tesseract.js OCR, a rule-based clinical
AI assistant, and a REST API backend. Implemented JWT authentication with bcrypt
password hashing, role-based access control with ownership enforcement, server-side
order price validation, and patient consent management for medical record access.
Wrote 28 automated unit tests. Configured Docker Compose with PostgreSQL, Redis, and
multi-stage nginx builds, and a GitHub Actions CI/CD pipeline that tests and deploys
to Vercel on every push to main.
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript 5, Tailwind CSS 3, Vite 4 |
| PDF Parsing | pdfjs-dist 3.11 |
| OCR | Tesseract.js 5.0 |
| Backend | Node.js 18, Express 4, JWT, bcryptjs, Helmet, express-rate-limit |
| Database | PostgreSQL 15 (schema defined; pg driver installed) |
| Cache | Redis 7 (Docker Compose) |
| Testing | Vitest 1.6, jsdom |
| DevOps | Docker, docker-compose, GitHub Actions, Vercel |

---

<div align="center">
Built by <strong>Anuska Dhar</strong> · <a href="https://github.com/AnuskaCoder/EasyHealth">GitHub</a>
</div>
