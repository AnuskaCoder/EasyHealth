/**
 * User Repository
 * Abstracted data access for Users table (PostgreSQL + In-memory fallback)
 */
const { v4: uuidv4 } = require("uuid");
const { db, mem, query } = require("../config/database");

const userRepository = {
  async findByEmail(email) {
    const cleanEmail = email.trim().toLowerCase();
    if (db.isPostgres()) {
      const res = await query(
        `SELECT id, email, password_hash AS "passwordHash", role, name, phone,
                is_active AS "isActive", created_at AS "createdAt"
         FROM users
         WHERE LOWER(email) = $1`,
        [cleanEmail]
      );
      return res.rows[0] || null;
    }
    return mem.users.find(u => u.email.toLowerCase() === cleanEmail) || null;
  },

  async findById(id) {
    if (db.isPostgres()) {
      const res = await query(
        `SELECT id, email, password_hash AS "passwordHash", role, name, phone,
                is_active AS "isActive", created_at AS "createdAt"
         FROM users
         WHERE id = $1`,
        [id]
      );
      return res.rows[0] || null;
    }
    return mem.users.find(u => u.id === id) || null;
  },

  async create({ email, passwordHash, role = "patient", name = "", phone = null }) {
    const id = uuidv4();
    const cleanEmail = email.trim().toLowerCase();
    const now = new Date().toISOString();

    if (db.isPostgres()) {
      const res = await query(
        `INSERT INTO users (id, email, password_hash, role, name, phone, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, $7)
         RETURNING id, email, role, name, phone, is_active AS "isActive", created_at AS "createdAt"`,
        [id, cleanEmail, passwordHash, role, name, phone, now]
      );
      const user = res.rows[0];
      user.name = name;
      user.phone = phone;
      return user;
    }

    const newUser = {
      id,
      email: cleanEmail,
      passwordHash,
      role,
      name,
      phone,
      createdAt: now,
      isActive: true,
    };
    mem.users.push(newUser);
    return newUser;
  },

  async updateLastLogin(id) {
    const now = new Date().toISOString();
    if (db.isPostgres()) {
      await query(`UPDATE users SET updated_at = $1 WHERE id = $2`, [now, id]);
    } else {
      const u = mem.users.find(x => x.id === id);
      if (u) u.lastLogin = now;
    }
  },

  async count() {
    if (db.isPostgres()) {
      const res = await query(`SELECT COUNT(*) as count FROM users`);
      return parseInt(res.rows[0].count, 10);
    }
    return mem.users.length;
  }
};

module.exports = userRepository;
