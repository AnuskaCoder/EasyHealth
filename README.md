# 🏥 EasyHealth — Healthcare Management Platform

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live%20Demo-easyhealth--xi.vercel.app-blue?style=flat&logo=vercel)](https://easyhealth-xi.vercel.app)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18-339933?style=flat&logo=node.js)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/Tests-33%20passing-brightgreen?style=flat)](src/__tests__)

**[Live Demo](https://easyhealth-xi.vercel.app) · [GitHub](https://github.com/AnuskaCoder/EasyHealth)**

</div>

---

## What This Project Is

A React + TypeScript healthcare platform with patient and doctor dashboards, medical document parsing, OCR-based report extraction, clinical rule-based assistance, an Express REST API backend, PostgreSQL schema, and automated frontend tests.

This is a portfolio project. The sections below clearly distinguish what is fully implemented from what is scaffolded or simulated.

---

## Current Implementation Status

| Area | Current status |
|---|---|
| OCR and report extraction | Implemented: extracts text from PDFs and images and parses report biomarkers. |
| Clinical AI assistant | Uses rule-based responses; it is not a fully integrated LLM assistant. |
| Clinical AI assistant | The primary assistant remains rule-based. A separate opt-in Gemini service now performs embedding-based retrieval against PostgreSQL/pgvector; it requires a Gemini key, database setup, and guideline indexing. |
| RAG and vector search | Implemented in the separate Python AI service with a small demo corpus. It is not a reviewed clinical knowledge base and is not a substitute for clinical advice. |
| Database persistence | PostgreSQL is the backend default and startup fails if it cannot connect. In-memory storage is available only with `DATABASE_MODE=memory` for demos. |
| Deployment | The live Vercel deployment hosts the frontend only. A Render Blueprint is prepared, but the API and AI services have not been deployed. |

## Prepared Architecture (Not the Current Live Deployment)

The diagram shows the implemented service boundaries, not the current live deployment. Only the frontend is currently hosted on Vercel; the Render Blueprint is configuration, not a deployed backend.

```
┌──────────────────────────────────────────────────────────────┐
│                     React Frontend (Vercel)                   │
│  TypeScript · Tailwind CSS · Vite · pdfjs-dist · Tesseract   │
└──────────────────┬──────────────────────────────────────────-┘
                   │ REST API calls
┌──────────────────▼─────────────────────────────────────────-┐
│               Express Backend (Node.js 18)                    │
│  JWT auth · bcrypt · Helmet · Rate limiting · RBAC           │
│  Routes: auth · patients · doctors · appointments ·          │
│          records · pharmacy · labs · emergency · prescriptions│
└──────────────────┬──────────────────────────────────────────-┘
                   │ PostgreSQL
                   ▼
             ┌──────────────┐
             │ PostgreSQL + │◄──────── Python AI Service
             │   pgvector   │          │ Gemini API (opt-in)
             └──────────────┘
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
| Backend-first login (bcrypt + JWT), frontend demo fallback | ✅ Working |
| Remember Me — JWT stored in localStorage / sessionStorage | ✅ Working |
| Role-locked routing (patient vs doctor) | ✅ Working |

### Backend (Express REST API)
| Endpoint group | Status |
|---|---|
| `POST /api/auth/login` — bcrypt password verification + JWT | ✅ Working |
| `POST /api/auth/register` — bcrypt hashing, duplicate check | ✅ Working |
| `GET /api/doctors` — filter by specialty, availability | ✅ Working |
| `GET /api/appointments` — ownership-enforced per role | ✅ Working |
| `POST /api/appointments` — double-booking prevention and PostgreSQL persistence | ✅ Working |
| `GET /api/records` — consent-enforced (doctors need patient grant) | ✅ Working |
| `POST /api/records` — patient uploads own records only | ✅ Working |
| `POST /api/pharmacy/order` — server-side price recalculation | ✅ Working |
| `POST /api/labs/book` — home collection booking | ✅ Working |
| `POST /api/emergency/admit` — returns a demo reference ID (not persisted as an admission) | ⚠️ Demo |
| Audit log entries on record view, create, delete | ✅ Working |
| Rate limiting (100 req/15min general, 10 req/15min auth) | ✅ Working |

### Infrastructure
| Item | Status |
|---|---|
| PostgreSQL persistence | ✅ Backend defaults to PostgreSQL; run migrations before use |
| pgvector + Gemini RAG | ✅ Implemented; requires key, schema, and explicit corpus indexing |
| Docker Compose (frontend + backend + AI + PostgreSQL + Redis service) | ✅ Configured; local secrets must be set |
| Multi-stage Docker build for frontend (nginx) | ✅ Working |
| GitHub Actions CI/CD pipeline | ✅ Working |
| 33 unit tests (authStorage, reportParser, clinicalAI) | ✅ All passing |

---

## ⚠️ Limits and Setup Requirements

| Feature | Actual State |
|---|---|
| **Database persistence** | PostgreSQL is the default and is required at startup. Apply the schema with `npm run migrate`; `DATABASE_MODE=memory` is an explicit, non-persistent demo mode. |
| **AI chatbot** | The main clinical assistant uses rule-based responses. Gemini RAG is a separate, opt-in feature; online requests send only the user's question, not profile or report data. |
| **RAG knowledge** | The bundled corpus is small and for demonstration only. With database and Gemini credentials set, the AI service indexes it on startup when references are missing; run `python scripts/index_guidelines.py` to refresh it manually. Review and expand it before any clinical use. |
| **Report AI summary** | Rule-based: counts abnormal parameters and constructs a text summary. OCR text extraction using pdfjs-dist and Tesseract.js is real and working. |
| **Python AI service** (`ai-service/`) | Separate FastAPI service. Gemini requests require `GEMINI_API_KEY`; PostgreSQL/pgvector retrieval is unavailable until the corpus has been indexed. |
| **Confidence values (0.98, 0.99)** | Hardcoded for demo purposes. Not calibrated measurements. |
| **Backend deployment** | The live Vercel deployment hosts only the React frontend. Render configuration exists, but no backend deployment has been completed. |

---

## 🔑 Demo Credentials

```
Patient:  patient@demo.com  /  demo1234
Doctor:   doctor@demo.com   /  demo1234
```

The live demo runs the frontend on Vercel without the backend. Auth falls back to a client-side demo mode (explicitly labelled in the UI). For a local backend, migrate a PostgreSQL database first; non-production migrations seed database demo accounts, while production migrations skip them. `DATABASE_MODE=memory` is an explicit non-persistent alternative.

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
cp .env.example .env
# Set DATABASE_URL, JWT_SECRET (32+ characters), and ENCRYPTION_KEY in backend/.env.
npm run migrate          # Requires a running PostgreSQL with pgvector available.
node src/server.js

# Terminal 2 — Frontend
npm install
npm start
```

### Run with Docker (requires Docker Desktop)
```bash
cp .env.example .env
# Replace all placeholder secrets in .env with random values before starting.
docker compose up --build
```
Generate secrets with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Use a distinct value for each secret; never reuse these demo secrets in production.

### Deploy API & AI services on Render

The Vercel deployment hosts only the frontend. To enable authenticated API orders, shared blood requests, and optional online AI, create a Render Blueprint from this repository's `render.yaml`:

1. In Render, choose **New → Blueprint**, connect `AnuskaCoder/EasyHealth`, and select the `main` branch.
2. The Blueprint uses Render's free plans to avoid charges. Free web services can sleep between requests, and free PostgreSQL expires after 30 days; this is demo-only and must not store real patient data.
3. Render generates `JWT_SECRET` and `ENCRYPTION_KEY`. The backend image applies the schema before starting; confirm the database has the pgvector extension enabled.
4. Add `GEMINI_API_KEY` as a secret environment variable on the Render AI service. On startup, the service indexes the bundled corpus if references are missing. The corpus is a demo set and should be reviewed before use.
5. Copy the service URLs into Vercel Production environment variables: `VITE_API_URL` as `<API URL>/api` and `VITE_AI_SERVICE_URL` as the AI service URL. Redeploy the Vercel frontend.

Render resources require a Render account and may incur PostgreSQL charges. Do not use the demo data or service as a substitute for clinical or blood-bank verification.

### Run Tests
```bash
npm test        # 33 unit tests
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
│   └── __tests__/                # Vitest unit tests (33 passing)
├── backend/
│   ├── src/
│   │   ├── routes/               # 9 route modules with ownership checks
│   │   ├── middleware/           # auth (JWT), validate, rateLimit, errorHandler
│   │   └── config/database.js   # PostgreSQL default; explicit memory demo mode
│   └── database/schema.sql      # Full PostgreSQL schema
├── ai-service/                   # Python FastAPI with Gemini + pgvector RAG
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

Developed a healthcare platform featuring patient and doctor dashboards, medical
document parsing with pdfjs-dist and Tesseract.js OCR, a rule-based clinical AI
assistant, an opt-in Gemini + PostgreSQL/pgvector RAG service with a small demo
corpus, and an Express REST API. Implemented PostgreSQL persistence as the backend
default, with explicit in-memory demo mode, and JWT authentication with bcrypt
password hashing, role-based access control, and report biomarker extraction.
Configured Docker Compose and a GitHub Actions workflow for frontend deployment
to Vercel. The live Vercel app hosts the frontend, not the complete backend.
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript 5, Tailwind CSS 3, Vite 4 |
| PDF Parsing | pdfjs-dist 3.11 |
| OCR | Tesseract.js 5.0 |
| Backend | Node.js 18, Express 4, JWT, bcryptjs, Helmet, express-rate-limit |
| Database | PostgreSQL 15 + pgvector (backend default; explicit in-memory demo mode) |
| Cache | Redis 7 (provisioned in Docker Compose; not integrated with the backend) |
| Testing | Vitest 1.6, jsdom |
| DevOps | Docker, docker-compose, GitHub Actions, Vercel |

---

<div align="center">
Built by <strong>Anuska Dhar</strong> · <a href="https://github.com/AnuskaCoder/EasyHealth">GitHub</a>
</div>
