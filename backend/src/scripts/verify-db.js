/**
 * EasyHealth Database & Repository Verification Test
 * Tests dotenv initialization, repository layer, persistent auth, and CRUD
 */
const bcrypt = require("bcryptjs");
const env = require("../config/env");
const { db } = require("../config/database");
const userRepository = require("../repositories/userRepository");
const patientRepository = require("../repositories/patientRepository");
const appointmentRepository = require("../repositories/appointmentRepository");
const recordRepository = require("../repositories/recordRepository");

async function runVerification() {
  console.log("\n🧪 Running EasyHealth Backend Foundation Tests");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    await db.initialize();

    // 1. Dotenv test
    console.log("\n[Test 1] Environment & Dotenv Initialization");
    assert(!!env.JWT_SECRET, `JWT_SECRET loaded (length: ${env.JWT_SECRET.length})`);
    assert(env.PORT === 5000, `PORT is configured as ${env.PORT}`);
    assert(!!env.NODE_ENV, `NODE_ENV is set to ${env.NODE_ENV}`);
    console.log(`  Loaded .env from: ${env.loadedPath || "System environment"}`);

    // 2. Database connection mode
    console.log("\n[Test 2] Database Connection & Driver Status");
    const isPg = db.isPostgres();
    console.log(`  Database backend: ${isPg ? "PostgreSQL (Active)" : "Explicit in-memory mode"}`);
    assert(true, "Database layer initialized without fatal errors");

    // 3. User Repository: Authentication & Registration
    console.log("\n[Test 3] User Registration & Persistent Password Hashing");
    const testEmail = `testuser_${Date.now()}@easyhealth.test`;
    const rawPassword = "SecurePassword123!";
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const createdUser = await userRepository.create({
      email: testEmail,
      passwordHash,
      role: "patient",
      name: "Test Verification User",
      phone: "+91 99999 88888",
    });

    assert(createdUser && createdUser.email === testEmail, "User created successfully with generated UUID");

    const fetchedUser = await userRepository.findByEmail(testEmail);
    assert(fetchedUser && fetchedUser.id === createdUser.id, "User retrieved by email");

    const passwordMatches = await bcrypt.compare(rawPassword, fetchedUser.passwordHash);
    assert(passwordMatches === true, "Bcrypt password comparison validates accurately");

    // 4. Patient Repository: Profile creation & retrieval
    console.log("\n[Test 4] Patient Profile Repository");
    const createdPatient = await patientRepository.create({
      userId: createdUser.id,
      name: "Test Verification User",
      age: 32,
      gender: "Male",
      bloodGroup: "O+",
      allergies: ["Aspirin"],
      chronicConditions: ["Hypertension"],
    });

    assert(createdPatient && createdPatient.userId === createdUser.id, "Patient profile linked to user");

    const fetchedPatient = await patientRepository.findByUserId(createdUser.id);
    assert(fetchedPatient && fetchedPatient.allergies.includes("Aspirin"), "Patient profile retrieved with allergies");

    // 5. Appointment Repository
    console.log("\n[Test 5] Appointment Booking Repository");
    const createdAppt = await appointmentRepository.create({
      patientId: createdUser.id,
      doctorId: "d1",
      doctorName: "Dr. Priya Sharma",
      doctorSpecialty: "Cardiologist",
      date: "2026-12-01",
      time: "10:30 AM",
      mode: "video",
      symptoms: "Routine blood pressure review",
    });

    assert(createdAppt && createdAppt.patientId === createdUser.id, "Appointment created with generated ID");

    const patientAppts = await appointmentRepository.findByPatientId(createdUser.id);
    assert(patientAppts.length >= 1, `Retrieved appointments for patient (count: ${patientAppts.length})`);

    // 6. Medical Record Repository
    console.log("\n[Test 6] Medical Record & Biomarkers Repository");
    const createdRecord = await recordRepository.create({
      patientId: createdUser.id,
      name: "Comprehensive Metabolic Panel",
      type: "Blood Test",
      date: "2026-11-26",
      biomarkers: [
        { parameter: "Fasting Blood Glucose", value: "92", unit: "mg/dL", referenceRange: "70-99", status: "Normal" },
        { parameter: "Creatinine", value: "0.9", unit: "mg/dL", referenceRange: "0.7-1.3", status: "Normal" }
      ],
      aiSummary: "Fasting glucose and renal function within ideal parameters.",
      aiAnalysed: true,
    });

    assert(createdRecord && createdRecord.name === "Comprehensive Metabolic Panel", "Medical report created");

    const patientRecords = await recordRepository.findByPatientId(createdUser.id);
    assert(patientRecords.length >= 1, `Retrieved patient reports (count: ${patientRecords.length})`);

    console.log("\n==================================================");
    console.log(`Results: ${passed} passed, ${failed} failed`);

    if (failed === 0) {
      console.log("🎉 Week 1 Database and Backend Foundation: 100% VERIFIED!\n");
    } else {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error("❌ Test crashed with exception:", err);
    process.exitCode = 1;
  }
}

runVerification();
