-- =============================================================================
-- EasyHealth PostgreSQL Database Schema
-- Production Relational Architecture with Encryption & RBAC Support
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. USERS & AUTHENTICATION TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT '',
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. PATIENT PROFILES TABLE (With AES-256 Encrypted PHI Fields)
CREATE TABLE IF NOT EXISTS patient_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(20) NOT NULL,
    dob DATE,
    phone VARCHAR(50),
    blood_group VARCHAR(10) NOT NULL,
    height NUMERIC(5,2),
    weight NUMERIC(5,2),
    allergies TEXT[],
    chronic_conditions TEXT[],
    emergency_contact VARCHAR(255),
    address TEXT,
    encrypted_phi TEXT, -- AES-256 ciphertext for sensitive health identifiers
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. DOCTORS TABLE
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    qualifications TEXT[] NOT NULL,
    experience_years INT NOT NULL,
    hospital VARCHAR(255) NOT NULL,
    rating NUMERIC(3,2) DEFAULT 4.9,
    review_count INT DEFAULT 0,
    consult_fee NUMERIC(10,2) NOT NULL,
    emergency_fee NUMERIC(10,2) NOT NULL,
    available_today BOOLEAN DEFAULT TRUE,
    next_slot VARCHAR(50),
    languages TEXT[],
    about TEXT,
    image_url VARCHAR(500),
    verified BOOLEAN DEFAULT TRUE,
    online BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(50) PRIMARY KEY,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patient_profiles(id) ON DELETE CASCADE,
    doctor_name VARCHAR(255) NOT NULL,
    doctor_specialty VARCHAR(100) NOT NULL,
    doctor_image VARCHAR(500),
    patient_name VARCHAR(255) NOT NULL,
    patient_age INT,
    date DATE NOT NULL,
    time VARCHAR(50) NOT NULL,
    mode VARCHAR(50) NOT NULL CHECK (mode IN ('in-person', 'video', 'emergency')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    fee NUMERIC(10,2) NOT NULL,
    hospital VARCHAR(255),
    symptoms TEXT,
    clinical_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS doctor_image VARCHAR(500);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_age INT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS hospital VARCHAR(255);

-- 5. MEDICAL REPORTS & OCR DATA
CREATE TABLE IF NOT EXISTS medical_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patient_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    report_date DATE NOT NULL,
    uploaded_by VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    ai_summary TEXT,
    biomarkers_json JSONB,
    tags TEXT[] NOT NULL DEFAULT '{}',
    file_name VARCHAR(255),
    ocr_confidence NUMERIC(5,2),
    is_analyzed BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
ALTER TABLE medical_reports ALTER COLUMN file_url DROP NOT NULL;

-- 6. DOCTOR PRESCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS doctor_prescriptions (
    id VARCHAR(50) PRIMARY KEY,
    appointment_id VARCHAR(50),
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES patient_profiles(id) ON DELETE CASCADE,
    doctor_name VARCHAR(255) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    diagnosis TEXT NOT NULL,
    vitals_json JSONB,
    medications_json JSONB NOT NULL,
    notes TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. MEDICINES PHARMACY CATALOG
CREATE TABLE IF NOT EXISTS medicines (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255) NOT NULL,
    brand VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    discount_pct INT DEFAULT 0,
    final_price NUMERIC(10,2) NOT NULL,
    stock_available BOOLEAN DEFAULT TRUE,
    rx_required BOOLEAN DEFAULT FALSE,
    pack_size VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. PHARMACY ORDERS TABLE
CREATE TABLE IF NOT EXISTS pharmacy_orders (
    id VARCHAR(50) PRIMARY KEY,
    patient_id UUID REFERENCES patient_profiles(id) ON DELETE CASCADE,
    items_json JSONB NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    discount NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Processing', 'Packed', 'Out for Delivery', 'Delivered')),
    delivery_address TEXT NOT NULL,
    coupon_applied VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. LAB CHECKUPS & HOME COLLECTION TABLE
CREATE TABLE IF NOT EXISTS home_sample_collections (
    id VARCHAR(50) PRIMARY KEY,
    package_id VARCHAR(50),
    patient_id UUID REFERENCES patient_profiles(id) ON DELETE CASCADE,
    package_name VARCHAR(255) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    sample_type VARCHAR(100) NOT NULL,
    collection_date DATE NOT NULL,
    time_slot VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    fee NUMERIC(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Confirmed', 'Phlebotomist Assigned', 'Sample Collected', 'Processing in Lab', 'Report Ready')),
    phlebotomist_name VARCHAR(255),
    phlebotomist_phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE home_sample_collections ADD COLUMN IF NOT EXISTS package_id VARCHAR(50);

-- 10. CONSENT PERMISSIONS TABLE (HIPAA-Compliant Gating)
CREATE TABLE IF NOT EXISTS consent_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patient_profiles(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('granted', 'requested', 'revoked')),
    requested_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    granted_date TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    reason TEXT,
    revoked_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE consent_permissions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE consent_permissions ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE consent_permissions ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_consent_doctor_patient
    ON consent_permissions(doctor_id, patient_id);

CREATE TABLE IF NOT EXISTS medications (
    id VARCHAR(80) PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL DEFAULT '',
    frequency VARCHAR(255) NOT NULL DEFAULT '',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    prescribed_by VARCHAR(255) NOT NULL DEFAULT '',
    times TEXT[] NOT NULL DEFAULT '{}',
    stock INT NOT NULL DEFAULT 0,
    instructions TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_medications_patient ON medications(patient_id, is_active);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(80) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);

-- INDEXES FOR HIGH-PERFORMANCE QUERYING
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_active_slot
    ON appointments(doctor_id, date, time) WHERE status <> 'cancelled';
CREATE INDEX IF NOT EXISTS idx_medical_reports_patient ON medical_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON doctor_prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category);

-- 11. RAG CLINICAL KNOWLEDGE CHUNKS (pgvector Semantic Search)
CREATE TABLE IF NOT EXISTS rag_document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_key VARCHAR(255) UNIQUE,
    authority VARCHAR(100) NOT NULL,
    guideline_title VARCHAR(255) NOT NULL,
    chunk_text TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    url VARCHAR(500),
    metadata JSONB,
    embedding vector(768),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE rag_document_chunks
    ADD COLUMN IF NOT EXISTS source_key VARCHAR(255) UNIQUE;
ALTER TABLE rag_document_chunks
    ADD COLUMN IF NOT EXISTS embedding vector(768);

CREATE INDEX IF NOT EXISTS idx_rag_category ON rag_document_chunks(category);
CREATE INDEX IF NOT EXISTS idx_rag_embedding_cosine
    ON rag_document_chunks USING hnsw (embedding vector_cosine_ops)
    WHERE embedding IS NOT NULL;

-- URGENT BLOOD REQUESTS (contact details are shared only after explicit consent)
CREATE TABLE IF NOT EXISTS blood_requests (
    id VARCHAR(80) PRIMARY KEY,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blood_group VARCHAR(3) NOT NULL,
    units_needed INT NOT NULL CHECK (units_needed BETWEEN 1 AND 10),
    component VARCHAR(40) NOT NULL,
    urgency VARCHAR(20) NOT NULL CHECK (urgency IN ('CRITICAL', 'HIGH', 'SCHEDULED')),
    hospital VARCHAR(255) NOT NULL,
    area VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(40) NOT NULL,
    contact_consent BOOLEAN NOT NULL DEFAULT FALSE,
    reason TEXT NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Fulfilled', 'Closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blood_request_responses (
    request_id VARCHAR(80) NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (request_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_blood_requests_open_created ON blood_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blood_requests_blood_group ON blood_requests(blood_group, status);
