# 🏥 EasyHealth — Complete Healthcare Platform

<div align="center">

![EasyHealth Banner](https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=300&fit=crop&q=80)

**A full-stack AI-powered healthcare platform built with React, TypeScript, and Tailwind CSS**

[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-4.5-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-easyhealth--xi.vercel.app-blue?style=flat&logo=vercel)](https://easyhealth-xi.vercel.app)

[🌐 Live Demo](https://easyhealth-xi.vercel.app) · [Features](#features) · [Tech Stack](#tech-stack) · [Getting Started](#getting-started)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Screenshots](#screenshots)
- [Demo Credentials](#demo-credentials)
- [What Recruiters Will See](#what-recruiters-will-see)

---

## 🌟 Overview

EasyHealth is a **production-grade healthcare platform** that demonstrates full-stack development, AI/ML integration, real-time features, and secure data handling — all in a single cohesive application.

It covers every aspect of a modern healthcare experience:
- Patients can register, search doctors, book appointments, upload reports, buy medicines, and use an AI clinical assistant
- Doctors can manage appointments, view patient records, write prescriptions, and track analytics
- Advanced AI features include PDF report parsing, symptom assessment, and a RAG-based medical chatbot grounded in WHO/AHA/ADA guidelines

---

## ✨ Features

### 👤 Patient Features

| Feature | Description |
|---|---|
| **Registration & Medical Profile** | Full onboarding with allergies, conditions, blood group, BMI calculator |
| **Find Doctors** | 15+ specialties, filter by availability, online status, language |
| **Book Appointments** | Video, in-person, or emergency consult with time slot selection |
| **Medical Records** | Upload PDFs/images, auto-extract all parameters via OCR + pdfjs |
| **AI Report Analysis** | Explains every biomarker with clinical context from WHO/AHA/ICMR |
| **Symptom Assessment** | Step-by-step AI-guided symptom checker |
| **Medication Reminders** | Track medications, stock alerts, dosage schedules |
| **Buy Medicines** | Pharmacy with up to 55% discounts, cart, order tracking |
| **Lab Tests & Home Collection** | Book 50+ tests, home blood/urine sample pickup |
| **Emergency Services** | Hospital bed booking, ICU availability, ambulance — 24×7 |
| **AI Clinical Chatbot** | RAG-based assistant grounded in WHO, AHA, ADA, GINA, ICMR guidelines |
| **Teleconsultation** | Integrated video consultation interface with chat |

### 👨‍⚕️ Doctor Features

| Feature | Description |
|---|---|
| **Dashboard** | Today's schedule, patient stats, revenue, quick actions |
| **Appointment Management** | View, confirm, reschedule appointments with status tracking |
| **Patient EHR** | View patient histories with consent-based access control |
| **Digital Prescriptions** | Write and upload prescriptions that auto-sync to patient records |
| **Analytics Dashboard** | Revenue trends, patient demographics, appointment statistics |

### 🤖 Advanced AI Features

1. **PDF Report Parser** — pdfjs-dist extracts text from every page; 50+ regex patterns detect Hb, cholesterol, glucose, TSH, creatinine, and 45 other parameters; auto-infers Normal/Low/High/Critical status against clinical reference ranges
2. **Image OCR** — Tesseract.js reads handwritten or printed lab report images
3. **RAG Clinical Chatbot** — 25-topic scoring engine with patient-specific responses; grounded in WHO, AHA, ADA, GINA, ICMR, KDIGO guidelines; reads actual patient lab values, medications, and allergies
4. **AI Report Summarization** — Every uploaded report gets a clinical AI summary
5. **Drug Interaction Checker** — Flags contraindications against patient's known allergies and conditions

### 🔒 Security Features

- **Role-based access control** — patient and doctor see completely different UIs
- **Remember Me** — session persists in `localStorage` using btoa-encoded credentials
- **Per-user data isolation** — each user's records stored separately in localStorage
- **AES-256 encryption badge** — data encryption indicators throughout
- **Consent management** — doctors request access; patients grant/revoke

---

## 🛠 Tech Stack

| Area | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript 5, Tailwind CSS 3, Vite 4 |
| **State Management** | React Context API with localStorage persistence |
| **PDF Parsing** | pdfjs-dist 3.11 |
| **OCR** | Tesseract.js 5.0 |
| **Icons** | Lucide React |
| **Routing** | Custom page-based navigation (no router dependency) |
| **Storage** | localStorage (per-user, session-aware) |
| **Build Tool** | Vite with code splitting |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ ([download](https://nodejs.org))
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/anuskadhar10/easyhealth.git
cd easyhealth

# Install dependencies
npm install

# Start development server
npm start
```

The app opens at **http://localhost:5173**

### Production Build

```bash
npm run build
node serve.cjs   # serves the dist/ folder on port 3000
```

---

## 📁 Project Structure

```
easyhealth/
├── src/
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx          # Sign in / sign up with Remember Me
│   │   │   └── OnboardingPage.tsx
│   │   ├── patient/
│   │   │   ├── Dashboard.tsx          # Health overview, quick actions
│   │   │   ├── FindDoctors.tsx        # 15+ specialties, booking
│   │   │   ├── MedicalRecordsPage.tsx # Upload, parse, view reports
│   │   │   ├── PharmacyPage.tsx       # Medicines with discounts
│   │   │   ├── LabTestsPage.tsx       # Tests + home collection
│   │   │   ├── AppointmentsPage.tsx   # Appointment tracker
│   │   │   ├── ChatbotPage.tsx        # AI clinical assistant
│   │   │   └── MedicalProfilePage.tsx
│   │   ├── doctor/
│   │   │   ├── DoctorDashboardPage.tsx
│   │   │   ├── DoctorAppointmentsPage.tsx
│   │   │   ├── DoctorPatientsPage.tsx
│   │   │   ├── DoctorPrescriptionsPage.tsx
│   │   │   └── DoctorAnalyticsPage.tsx
│   │   └── EmergencyPage.tsx          # Hospital beds, ambulance
│   ├── components/
│   │   ├── ai/
│   │   │   ├── OcrUploadModal.tsx     # PDF/image OCR parser
│   │   │   ├── ReportSummarizerModal.tsx
│   │   │   └── SymptomAssessmentModal.tsx
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── BottomNav.tsx
│   │   ├── hospital/                  # Bed booking, hospital cards
│   │   ├── emergency/                 # Emergency banner, admit modal
│   │   ├── doctors/                   # Doctor cards, booking modals
│   │   ├── records/                   # AddMedicalRecordModal
│   │   ├── teleconsult/               # Video consultation room
│   │   ├── notifications/             # Real-time toast notifications
│   │   └── security/                  # RBAC vault modal
│   ├── services/
│   │   ├── clinicalAiEngine.ts        # 25-topic RAG engine
│   │   ├── reportParser.ts            # PDF + OCR + 50 parameter patterns
│   │   └── authStorage.ts             # localStorage auth + session management
│   ├── context/
│   │   └── AppContext.tsx             # Global state + per-user persistence
│   ├── data/
│   │   ├── doctors.ts                 # 12 doctors across 12 specialties
│   │   ├── hospitals.ts               # 4 hospitals with bed availability
│   │   ├── medicines.ts               # 12 medicines with discounts
│   │   └── labTests.ts                # 14 lab tests + health packages
│   └── types/
│       └── index.ts                   # 20+ TypeScript interfaces
├── serve.cjs                          # Production static server
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

---

## 🖼 Screenshots

### Login Portal
- Role-based login (Patient / Doctor)
- 3-step signup with medical profile setup
- Remember Me toggle — stays signed in across sessions

### Patient Dashboard
- Health snapshot with vitals
- Quick action grid (8 services)
- Upcoming appointments and medication reminders

### Find Doctors
- 12 specialties with category icons
- Live search + filter by availability and language
- Video consult, in-person, and emergency booking

### Medical Records
- Empty state for new users with guided setup
- Upload PDF/image → auto-extracts all biomarkers
- Color-coded parameter status (Normal/Low/High/Critical)
- AI summary for every report

### AI Clinical Chatbot
- Grounded in WHO, AHA, ADA, GINA, ICMR
- Reads patient's actual hemoglobin, medications, allergies
- Dynamic quick prompts based on patient health data
- Drug contraindication alerts (penicillin allergy, NSAID + asthma)

### Emergency Services
- Nearby hospitals with real-time bed availability
- ICU / General / Private / Emergency bed bars
- 3-step emergency admission with reference ID
- Ambulance call (108/112)

### Doctor Dashboard
- Today's appointments timeline
- Patient analytics charts
- Prescription pad with auto-sync to patient records

---

## 🔑 Demo Credentials

```
Patient Login:
  Email:    patient@demo.com
  Password: demo1234

Doctor Login:
  Email:    doctor@demo.com
  Password: demo1234
```

---

## 👩‍💻 What Recruiters Will See

| Role | Skills Demonstrated |
|---|---|
| **Full-Stack / SDE** | React + TypeScript, component architecture, Context API, localStorage, REST-ready services |
| **AI / ML Engineer** | RAG chatbot engine, PDF parsing, OCR integration, clinical NLP, parameter extraction |
| **Frontend Engineer** | Tailwind CSS design system, responsive layout, modals, forms, animations |
| **Product / UX** | Real user flows — onboarding, booking, upload, checkout, emergency |
| **Security** | RBAC, role-locked routing, session management, consent workflows |
| **DevOps Ready** | Vite build pipeline, static server, .gitignore, environment config |

---

## 📄 License

MIT License — feel free to use this project as a portfolio piece or starting point.

---

<div align="center">

Built with ❤️ by **Anuska Dhar**

[GitHub](https://github.com/anuskadhar10) · [Email](mailto:anuskadhar10@gmail.com)

</div>
