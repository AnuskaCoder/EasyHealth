/**
 * Doctor Repository
 * Abstracted data access for Doctors table (PostgreSQL + In-memory fallback)
 */
const { v4: uuidv4 } = require("uuid");
const { db, mem, query } = require("../config/database");

function formatDoctorFromPg(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    specialty: row.specialty,
    qualifications: row.qualifications || [],
    experience: row.experience_years,
    hospital: row.hospital,
    rating: parseFloat(row.rating || 4.9),
    reviewCount: parseInt(row.review_count || 0, 10),
    consultFee: parseFloat(row.consult_fee || 1000),
    emergencyFee: parseFloat(row.emergency_fee || 2000),
    availableToday: row.available_today,
    nextSlot: row.next_slot,
    languages: row.languages || [],
    about: row.about,
    image: row.image_url,
    imageUrl: row.image_url,
    verified: row.verified,
    online: row.online,
  };
}

const doctorRepository = {
  async getAll({ specialty, availableToday } = {}) {
    if (db.isPostgres()) {
      let sql = `SELECT * FROM doctors WHERE 1=1`;
      const params = [];
      let idx = 1;

      if (specialty) {
        sql += ` AND LOWER(specialty) = LOWER($${idx++})`;
        params.push(specialty);
      }
      if (availableToday !== undefined) {
        sql += ` AND available_today = $${idx++}`;
        params.push(availableToday);
      }
      sql += ` ORDER BY rating DESC, review_count DESC`;
      const res = await query(sql, params);
      return res.rows.map(formatDoctorFromPg);
    }

    let list = [...mem.doctors];
    if (specialty) list = list.filter(d => d.specialty.toLowerCase() === specialty.toLowerCase());
    if (availableToday !== undefined) list = list.filter(d => d.availableToday === availableToday);
    return list;
  },

  async findById(id) {
    if (db.isPostgres()) {
      const res = await query(`SELECT * FROM doctors WHERE id::text = $1 OR user_id::text = $1`, [id]);
      return formatDoctorFromPg(res.rows[0]);
    }
    return mem.doctors.find(d => d.id === id || d.userId === id) || null;
  },

  async findByUserId(userId) {
    if (db.isPostgres()) {
      const res = await query(`SELECT * FROM doctors WHERE user_id = $1`, [userId]);
      return formatDoctorFromPg(res.rows[0]);
    }
    return mem.doctors.find(d => d.userId === userId) || null;
  },

  async create(data) {
    const id = data.id || uuidv4();
    const now = new Date().toISOString();

    if (db.isPostgres()) {
      const res = await query(
        `INSERT INTO doctors (
           id, user_id, name, specialty, qualifications, experience_years,
           hospital, consult_fee, emergency_fee, available_today, next_slot,
           languages, about, image_url, verified, online, created_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6,
           $7, $8, $9, $10, $11,
           $12, $13, $14, $15, $16, $17
         ) RETURNING *`,
        [
          id,
          data.userId || null,
          data.name,
          data.specialty || "General Medicine",
          data.qualifications || ["MBBS"],
          data.experience || data.experienceYears || 5,
          data.hospital || "Apollo Hospitals",
          data.consultFee || 800,
          data.emergencyFee || 1500,
          data.availableToday !== false,
          data.nextSlot || "10:00 AM",
          data.languages || ["English"],
          data.about || "Medical specialist",
          data.image || data.imageUrl || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&q=80",
          data.verified !== false,
          data.online !== false,
          now
        ]
      );
      return formatDoctorFromPg(res.rows[0]);
    }

    const doc = {
      id,
      userId: data.userId || null,
      name: data.name,
      specialty: data.specialty || "General Medicine",
      qualifications: data.qualifications || ["MBBS"],
      experience: data.experience || 5,
      hospital: data.hospital || "Apollo Hospitals",
      consultFee: data.consultFee || 800,
      emergencyFee: data.emergencyFee || 1500,
      availableToday: data.availableToday !== false,
      nextSlot: data.nextSlot || "10:00 AM",
      languages: data.languages || ["English"],
      about: data.about || "Medical specialist",
      image: data.image || data.imageUrl || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&q=80",
      rating: 4.9,
      reviewCount: 10,
      verified: true,
      online: true,
    };
    mem.doctors.push(doc);
    return doc;
  }
};

module.exports = doctorRepository;
