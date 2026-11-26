/**
 * Patient Repository
 * Abstracted data access for Patient Profiles (PostgreSQL + In-memory fallback)
 */
const { v4: uuidv4 } = require("uuid");
const { db, mem, query } = require("../config/database");

function formatPatientFromPg(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    age: row.age,
    gender: row.gender,
    dob: row.dob ? row.dob.toISOString().split("T")[0] : null,
    phone: row.phone,
    email: row.email,
    bloodGroup: row.blood_group,
    height: row.height ? parseFloat(row.height) : null,
    weight: row.weight ? parseFloat(row.weight) : null,
    allergies: row.allergies || [],
    chronicConditions: row.chronic_conditions || [],
    emergencyContact: row.emergency_contact,
    address: row.address,
    encryptedPhi: row.encrypted_phi,
    createdAt: row.created_at,
  };
}

const patientRepository = {
  async findByUserId(userId) {
    if (db.isPostgres()) {
      const res = await query(
        `SELECT p.*, u.email
         FROM patient_profiles p
         LEFT JOIN users u ON p.user_id = u.id
         WHERE p.user_id = $1 OR p.id::text = $1`,
        [userId]
      );
      return formatPatientFromPg(res.rows[0]);
    }
    return mem.patients.find(p => p.userId === userId || p.id === userId) || null;
  },

  async findById(id) {
    if (db.isPostgres()) {
      const res = await query(
        `SELECT p.*, u.email
         FROM patient_profiles p
         LEFT JOIN users u ON p.user_id = u.id
         WHERE p.id::text = $1`,
        [id]
      );
      return formatPatientFromPg(res.rows[0]);
    }
    return mem.patients.find(p => p.id === id) || null;
  },

  async create(data) {
    const id = data.id || uuidv4();
    const userId = data.userId || id;
    const now = new Date().toISOString();

    if (db.isPostgres()) {
      const res = await query(
        `INSERT INTO patient_profiles (
           id, user_id, name, age, gender, dob, phone, blood_group,
           height, weight, allergies, chronic_conditions, emergency_contact,
           address, encrypted_phi, created_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8,
           $9, $10, $11, $12, $13,
           $14, $15, $16
         ) RETURNING *`,
        [
          id,
          userId,
          data.name || "Patient",
          data.age || 25,
          data.gender || "Other",
          data.dob || null,
          data.phone || null,
          data.bloodGroup || "O+",
          data.height || null,
          data.weight || null,
          data.allergies || [],
          data.chronicConditions || [],
          data.emergencyContact || null,
          data.address || null,
          data.encryptedPhi || null,
          now
        ]
      );
      return formatPatientFromPg(res.rows[0]);
    }

    const newPatient = {
      id,
      userId,
      name: data.name || "Patient",
      age: data.age || 25,
      gender: data.gender || "Other",
      dob: data.dob || null,
      phone: data.phone || null,
      email: data.email || null,
      bloodGroup: data.bloodGroup || "O+",
      height: data.height || null,
      weight: data.weight || null,
      allergies: data.allergies || [],
      chronicConditions: data.chronicConditions || [],
      emergencyContact: data.emergencyContact || null,
      address: data.address || null,
      pastSurgeries: data.pastSurgeries || [],
      vaccinations: data.vaccinations || [],
      createdAt: now,
    };
    mem.patients.push(newPatient);
    return newPatient;
  },

  async update(userIdOrId, updates) {
    if (db.isPostgres()) {
      const fields = [];
      const values = [];
      let idx = 1;

      const mapping = {
        name: "name",
        age: "age",
        gender: "gender",
        dob: "dob",
        phone: "phone",
        bloodGroup: "blood_group",
        height: "height",
        weight: "weight",
        allergies: "allergies",
        chronicConditions: "chronic_conditions",
        emergencyContact: "emergency_contact",
        address: "address",
        encryptedPhi: "encrypted_phi",
      };

      for (const [key, val] of Object.entries(updates)) {
        if (mapping[key]) {
          fields.push(`${mapping[key]} = $${idx++}`);
          values.push(val);
        }
      }

      if (fields.length === 0) return await this.findByUserId(userIdOrId);

      values.push(userIdOrId);
      const sql = `UPDATE patient_profiles SET ${fields.join(", ")} WHERE user_id = $${idx} OR id::text = $${idx} RETURNING *`;
      const res = await query(sql, values);
      return formatPatientFromPg(res.rows[0]);
    }

    const patientIdx = mem.patients.findIndex(p => p.userId === userIdOrId || p.id === userIdOrId);
    if (patientIdx === -1) return null;
    mem.patients[patientIdx] = {
      ...mem.patients[patientIdx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return mem.patients[patientIdx];
  },

  async getAll() {
    if (db.isPostgres()) {
      const res = await query(`SELECT * FROM patient_profiles ORDER BY created_at DESC`);
      return res.rows.map(formatPatientFromPg);
    }
    return mem.patients;
  }
};

module.exports = patientRepository;
