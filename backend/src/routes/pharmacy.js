const express = require("express");
const { authenticate } = require("../middleware/auth");
const { mem } = require("../config/database");
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
router.post("/order", authenticate, (req, res) => {
  const { items, address, couponCode } = req.body;
  if (!items?.length || !address) {
    return res.status(422).json({ success: false, error: "items and address are required" });
  }

  // Recalculate all prices on the server
  let subtotal = 0;
  const validatedItems = items.map(item => {
    const med = medicines.find(m => m.id === item.id || m.id === item.medicine?.id);
    if (!med) throw new Error(`Medicine not found: ${item.id}`);
    if (!med.stock) throw new Error(`${med.name} is out of stock`);
    const qty = Math.max(1, Math.floor(item.quantity || 1));
    const lineTotal = med.finalPrice * qty;
    subtotal += lineTotal;
    return { medicine: med, quantity: qty, lineTotal };
  });

  // Server-side coupon validation
  let discount = 0;
  const validCoupons = { "HEALTH10": 0.10, "SAVE15": 0.15, "FIRST20": 0.20 };
  if (couponCode && validCoupons[couponCode.toUpperCase()]) {
    discount = subtotal * validCoupons[couponCode.toUpperCase()];
  }
  const total = Math.max(0, subtotal - discount);

  const order = {
    id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
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
  mem.orders.push(order);
  res.status(201).json({ success: true, data: order, message: `Order #${order.id} placed. Estimated delivery: Today by 6:00 PM` });
});

// GET /api/pharmacy/orders
router.get("/orders", authenticate, (req, res) => {
  const orders = mem.orders.filter(o => o.patientId === req.user.id);
  res.json({ success: true, data: orders, count: orders.length });
});

// GET /api/pharmacy/orders/:id — ownership enforced
router.get("/orders/:id", authenticate, (req, res) => {
  const order = mem.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ success: false, error: "Order not found" });
  if (order.patientId !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ success: false, error: "You do not have permission to view this order" });
  }
  res.json({ success: true, data: order });
});

module.exports = router;
