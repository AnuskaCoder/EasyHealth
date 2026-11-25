-- =============================================================================
-- EasyHealth PostgreSQL Database Schema
-- Production Relational Architecture with Encryption & RBAC Support
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & AUTHENTICATION TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
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
    patient_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(50) NOT NULL,
    mode VARCHAR(50) NOT NULL CHECK (mode IN ('in-person', 'video', 'emergency')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    fee NUMERIC(10,2) NOT NULL,
    symptoms TEXT,
    clinical_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
    ocr_confidence NUMERIC(5,2),
    is_analyzed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

-- 10. CONSENT PERMISSIONS TABLE (HIPAA-Compliant Gating)
CREATE TABLE IF NOT EXISTS consent_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patient_profiles(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('granted', 'requested', 'revoked')),
    requested_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    granted_date TIMESTAMP WITH TIME ZONE
);

-- INDEXES FOR HIGH-PERFORMANCE QUERYING
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_reports_patient ON medical_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON doctor_prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category);
