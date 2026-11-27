const express = require("express");
const { authenticate } = require("../middleware/auth");
const { v4: uuidv4 } = require("uuid");
const { db, mem, query } = require("../config/database");
const patientRepository = require("../repositories/patientRepository");
const router = express.Router();

const medicines = [
  { id: "med1", name: "Dolo 650", generic: "Paracetamol 650mg", brand: "Micro Labs", category: "Pain Relief", price: 32, discountPct: 20, finalPrice: 25.6, stock: true, rxRequired: false, rating: 4.8, description: "For fever and mild to moderate pain", packSize: "15 tablets" },
  { id: "med2", name: "Pantop 40", generic: "Pantoprazole 40mg", brand: "Aristo", category: "Gastro", price: 145, discountPct: 35, finalPrice: 94.3, stock: true, rxRequired: true, rating: 4.6, description: "For acid reflux and GERD", packSize: "15 tablets" },
  { id: "med3", name: "Cetirizine 10mg", generic: "Cetirizine HCl", brand: "Sun Pharma", category: "Allergy", price: 28, discountPct: 15, finalPrice: 23.8, stock: true, rxRequired: false, rating: 4.5, description: "Antihistamine for allergies", packSize: "10 tablets" },
  { id: "med4", name: "Azithral 500", generic: "Azithromycin 500mg", brand: "Alembic", category: "Antibiotic", price: 185, discountPct: 25, finalPrice: 138.8, stock: true, rxRequired: true, rating: 4.7, description: "Broad-spectrum antibiotic", packSize: "5 tablets" },
  { id: "med5", name: "Shelcal 500", generic: "Calcium Carbonate 500mg", brand: "Elder", category: "Supplements", price: 215, discountPct: 10, finalPrice: 193.5, stock: true, rxRequired: false, rating: 4.4, description: "Calcium & Vitamin D3 supplement", packSize: "30 tablets" },
  { id: "med6", name: "Glycomet 500", generic: "Metformin 500mg", brand: "USV", category: "Diabetes", price: 65, discountPct: 30, finalPrice: 45.5, stock: true, rxRequired: true, rating: 4.6, description: "For Type 2 Diabetes management", packSize: "20 tablets" },
  { id: "med7", name: "Telma 40", generic: "Telmisartan 40mg", brand: "Glenmark", category: "Cardiac", price: 198, discountPct: 20, finalPrice: 158.4, stock: true, rxRequired: true, rating: 4.5, description: "For hypertension", packSize: "10 tablets" },
  { id: "med8", name: "Vitamin D3 60K", generic: "Cholecalciferol 60000 IU", brand: "Sanofi", category: "Supplements", price: 125, discountPct: 18, finalPrice: 102.5, stock: true, rxRequired: false, rating: 4.7, description: "Weekly Vitamin D supplement", packSize: "4 capsules" },
  { id: "med9", name: "Montek LC", generic: "Montelukast + Levocetirizine", brand: "Sun Pharma", category: "Respiratory", price: 155, discountPct: 22, finalPrice: 120.9, stock: false, rxRequired: true, rating: 4.8, description: "For asthma and allergic rhinitis", packSize: "10 tablets" },
  { id: "med10", name: "Becosules", generic: "B-Complex Multivitamin", brand: "Pfizer", category: "Supplements", price: 115, discountPct: 12, finalPrice: 101.2, stock: true, rxRequired: false, rating: 4.5, description: "Complete B-complex multivitamin", packSize: "30 capsules" },
  { id: "med11", name: "Crocin Advance", generic: "Paracetamol 500mg", brand: "GSK", category: "Pain Relief", price: 42, discountPct: 10, finalPrice: 37.8, stock: true, rxRequired: false, rating: 4.6, description: "Fast-acting pain and fever relief", packSize: "20 tablets" },
  { id: "med12", name: "Combiflam", generic: "Ibuprofen + Paracetamol", brand: "Sanofi", category: "Pain Relief", price: 38, discountPct: 15, finalPrice: 32.3, stock: true, rxRequired: false, rating: 4.4, description: "For pain and inflammation", packSize: "20 tablets" },
];

// GET /api/pharmacy/medicines
router.get("/medicines", (req, res) => {
  const { category, search } = req.query;
  let result = medicines;
  if (category && category !== "All") result = result.filter(m => m.category === category);
  if (search) result = result.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.generic.toLowerCase().includes(search.toLowerCase()));
  res.json({ success: true, data: result, count: result.length });
});

// GET /api/pharmacy/categories
router.get("/categories", (req, res) => {
  const cats = ["All", ...new Set(medicines.map(m => m.category))];
  res.json({ success: true, data: cats });
});

// POST /api/pharmacy/order — recalculate prices server-side, never trust client totals
router.post("/order", authenticate, async (req, res, next) => {
  const { items, address, couponCode } = req.body;
  if (!Array.isArray(items) || items.length === 0 || !address) {
    return res.status(422).json({ success: false, error: "items and address are required" });
  }

  // Recalculate all prices on the server
  let subtotal = 0;
  const validatedItems = [];
  for (const item of items) {
    const med = medicines.find(m => m.id === item.id || m.id === item.medicine?.id);
    if (!med) return res.status(422).json({ success: false, error: `Medicine not found: ${item.id}` });
    if (!med.stock) return res.status(409).json({ success: false, error: `${med.name} is out of stock` });
    const qty = Number(item.quantity || 1);
    if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
      return res.status(422).json({ success: false, error: "Each quantity must be an integer between 1 and 100" });
    }
    const lineTotal = med.finalPrice * qty;
    subtotal += lineTotal;
    validatedItems.push({ medicine: med, quantity: qty, lineTotal });
  }

  // Server-side coupon validation
  let discount = 0;
  const validCoupons = { "HEALTH10": 0.10, "SAVE15": 0.15, "FIRST20": 0.20 };
  if (couponCode && validCoupons[couponCode.toUpperCase()]) {
    discount = subtotal * validCoupons[couponCode.toUpperCase()];
  }
  const total = Math.max(0, subtotal - discount);

  const order = {
    id: `ORD-${uuidv4()}`,
    patientId: req.user.id,
    items: validatedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total: Math.round(total * 100) / 100,
    address,
    couponApplied: couponCode || null,
    status: "Processing",
    estimatedDelivery: "Today by 6:00 PM",
    createdAt: new Date().toISOString(),
  };
  if (db.isPostgres()) {
    try {
      const patient = await patientRepository.findByUserId(req.user.id);
      if (!patient) return res.status(404).json({ success: false, error: "Patient profile not found" });
      await query(
        `INSERT INTO pharmacy_orders
          (id, patient_id, items_json, subtotal, discount, total, status, delivery_address, coupon_applied)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          order.id, patient.id, JSON.stringify(validatedItems), order.subtotal,
          order.discount, order.total, order.status, order.address, order.couponApplied,
        ]
      );
    } catch (err) {
      return next(err);
    }
  } else {
    mem.orders.push(order);
  }
  return res.status(201).json({ success: true, data: order, message: `Order #${order.id} placed. Estimated delivery: Today by 6:00 PM` });
});

// GET /api/pharmacy/orders
router.get("/orders", authenticate, async (req, res, next) => {
  try {
    let orders;
    if (db.isPostgres()) {
      const result = await query(
        `SELECT o.*, p.user_id AS patient_user_id
         FROM pharmacy_orders o
         JOIN patient_profiles p ON p.id = o.patient_id
         WHERE p.user_id = $1
         ORDER BY o.created_at DESC`,
        [req.user.id]
      );
      orders = result.rows.map(formatOrder);
    } else {
      orders = mem.orders.filter(order => order.patientId === req.user.id);
    }
    return res.json({ success: true, data: orders, count: orders.length });
  } catch (err) {
    return next(err);
  }
});

// GET /api/pharmacy/orders/:id — ownership enforced
router.get("/orders/:id", authenticate, async (req, res, next) => {
  try {
    let order;
    if (db.isPostgres()) {
      const result = await query(
        `SELECT o.*, p.user_id AS patient_user_id
         FROM pharmacy_orders o
         JOIN patient_profiles p ON p.id = o.patient_id
         WHERE o.id = $1`,
        [req.params.id]
      );
      order = formatOrder(result.rows[0]);
    } else {
      order = mem.orders.find(item => item.id === req.params.id);
    }
    if (!order) return res.status(404).json({ success: false, error: "Order not found" });
    if (order.patientId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "You do not have permission to view this order" });
    }
    return res.json({ success: true, data: order });
  } catch (err) {
    return next(err);
  }
});

function formatOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.patient_user_id,
    items: row.items_json,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    total: Number(row.total),
    address: row.delivery_address,
    couponApplied: row.coupon_applied,
    status: row.status,
    createdAt: row.created_at,
  };
}

module.exports = router;
