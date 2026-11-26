/**
 * EasyHealth Database Migration Runner
 * Executes schema.sql and seeds initial demo entities into PostgreSQL
 */
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const env = require("../config/env");

async function runMigration() {
  console.log("\n🐘 EasyHealth Database Migration");
  console.log("=================================");
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Database URL: ${env.DATABASE_URL ? env.DATABASE_URL.replace(/:[^:@]+@/, ":****@") : "NOT SET"}`);

  if (!env.DATABASE_URL) {
    console.warn("⚠️  DATABASE_URL is not configured. Skipping PostgreSQL migration.");
    return;
  }

  const { Pool } = require("pg");
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 7000,
  });

  let client;
  try {
    console.log("Connecting to PostgreSQL...");
    client = await pool.connect();
    console.log(" Connected to PostgreSQL database.");

    // 1. Read schema.sql
    const schemaPaths = [
      path.resolve(__dirname, "../../database/schema.sql"),
      path.resolve(__dirname, "../../../backend/database/schema.sql"),
      path.resolve(process.cwd(), "backend/database/schema.sql"),
      path.resolve(process.cwd(), "database/schema.sql"),
    ];

    let schemaSql = null;
    let schemaFoundPath = null;
    for (const p of schemaPaths) {
      if (fs.existsSync(p)) {
        schemaSql = fs.readFileSync(p, "utf-8");
        schemaFoundPath = p;
        break;
      }
    }

    if (!schemaSql) {
      throw new Error("Could not locate database/schema.sql in any search path.");
    }

    console.log(`Executing schema DDL from: ${schemaFoundPath}`);
    await client.query("BEGIN");
    await client.query(schemaSql);
    await client.query("COMMIT");
    console.log(" Schema DDL executed successfully (tables, types, indexes).");

    // 2. Check and seed demo patient & doctor
    const userCheck = await client.query("SELECT id, email, role FROM users WHERE email IN ('patient@demo.com', 'doctor@demo.com')");
    const existingEmails = userCheck.rows.map(r => r.email.toLowerCase());

    const patientEmail = "patient@demo.com";
    if (!existingEmails.includes(patientEmail)) {
      console.log(`Seeding demo patient (${patientEmail})...`);
      const patientId = "a1111111-1111-4111-a111-111111111111";
      const pwHash = await bcrypt.hash("demo1234", 10);
      const now = new Date().toISOString();

      await client.query(
        `INSERT INTO users (id, email, password_hash, role, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, 'patient', TRUE, $4, $4)`,
        [patientId, patientEmail, pwHash, now]
      );

      await client.query(
        `INSERT INTO patient_profiles (
           id, user_id, name, age, gender, dob, phone, blood_group,
           height, weight, allergies, chronic_conditions, emergency_contact, address, created_at
         ) VALUES (
           $1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
         )`,
        [
          patientId,
          "Ananya Krishnan",
          28,
          "Female",
          "1996-03-15",
          "+91 98765 43210",
          "B+",
          164,
          58,
          ["Penicillin", "Dust Mites"],
          ["Mild Bronchial Asthma"],
          "+91 98765 00000 (Rohan Krishnan)",
          "Flat 402, Green Glen Layout, Bangalore 560103",
          now
        ]
      );
      console.log(" Demo patient seeded.");
    }

    const doctorEmail = "doctor@demo.com";
    if (!existingEmails.includes(doctorEmail)) {
      console.log(`Seeding demo doctor (${doctorEmail})...`);
      const doctorUserId = "b2222222-2222-4222-b222-222222222222";
      const doctorProfileId = "d3333333-3333-4333-b333-333333333333";
      const pwHash = await bcrypt.hash("demo1234", 10);
      const now = new Date().toISOString();

      await client.query(
        `INSERT INTO users (id, email, password_hash, role, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, 'doctor', TRUE, $4, $4)`,
        [doctorUserId, doctorEmail, pwHash, now]
      );

      await client.query(
        `INSERT INTO doctors (
           id, user_id, name, specialty, qualifications, experience_years,
           hospital, rating, review_count, consult_fee, emergency_fee,
           available_today, next_slot, languages, about, image_url, verified, online, created_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6,
           $7, $8, $9, $10, $11,
           $12, $13, $14, $15, $16, $17, $18, $19
         )`,
        [
          doctorProfileId,
          doctorUserId,
          "Dr. Priya Sharma",
          "Cardiologist",
          ["MBBS", "MD", "DM (Cardiology)", "FACC"],
          18,
          "Apollo Hospitals",
          4.9,
          1240,
          1200,
          2500,
          true,
          "11:30 AM",
          ["English", "Hindi", "Tamil"],
          "Senior interventional cardiologist with 18+ years of expertise in preventive cardiology and heart rhythm management.",
          "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&q=80",
          true,
          true,
          now
        ]
      );
      console.log(" Demo doctor seeded.");
    }

    console.log("\n Database migration & seeding completed successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigration().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = runMigration;
