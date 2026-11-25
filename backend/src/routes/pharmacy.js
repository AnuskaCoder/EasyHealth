const express = require("express");

const router = express.Router();

const medicinesDb = [
  { id: "med1", name: "Dolo 650", generic: "Paracetamol 650mg", brand: "Micro Labs", category: "Pain Relief", price: 32, discountPct: 20, finalPrice: 25.6, stock: true, rxRequired: false, packSize: "15 tablets" },
  { id: "med2", name: "Pantop 40", generic: "Pantoprazole 40mg", brand: "Aristo", category: "Gastro", price: 145, discountPct: 35, finalPrice: 94.3, stock: true, rxRequired: true, packSize: "15 tablets" },
  { id: "med3", name: "Cetrizine 10mg", generic: "Cetirizine HCl 10mg", brand: "Sun Pharma", category: "Allergy", price: 28, discountPct: 15, finalPrice: 23.8, stock: true, rxRequired: false, packSize: "10 tablets" },
  { id: "med4", name: "Azithral 500", generic: "Azithromycin 500mg", brand: "Alembic", category: "Antibiotic", price: 185, discountPct: 25, finalPrice: 138.8, stock: true, rxRequired: true, packSize: "5 tablets" },
  { id: "med5", name: "Shelcal 500", generic: "Calcium Carbonate 500mg", brand: "Elder", category: "Supplements", price: 215, discountPct: 10, finalPrice: 193.5, stock: true, rxRequired: false, packSize: "30 tablets" },
  { id: "med6", name: "Glycomet 500", generic: "Metformin 500mg", brand: "USV", category: "Diabetes", price: 65, discountPct: 30, finalPrice: 45.5, stock: true, rxRequired: true, packSize: "20 tablets" },
  { id: "med7", name: "Telma 40", generic: "Telmisartan 40mg", brand: "Glenmark", category: "Cardiac", price: 198, discountPct: 20, finalPrice: 158.4, stock: true, rxRequired: true, packSize: "10 tablets" },
];

let ordersDb = [];

/**
 * GET /api/pharmacy/medicines
 */
router.get("/medicines", (req, res) => {
  const { category, search } = req.query;
  let list = [...medicinesDb];

  if (category && category !== "All") {
    list = list.filter((m) => m.category.toLowerCase() === category.toLowerCase());
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter((m) => m.name.toLowerCase().includes(s) || m.generic.toLowerCase().includes(s));
  }

  res.json({ count: list.length, medicines: list });
});

/**
 * POST /api/pharmacy/orders
 */
router.post("/orders", (req, res) => {
  const { items, subtotal, discount, total, address, couponApplied } = req.body;

  const newOrder = {
    id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
    date: new Date().toISOString().split("T")[0],
    items: items || [],
    subtotal: subtotal || 0,
    discount: discount || 0,
    total: total || 0,
    status: "Processing",
    address: address || "Default Address",
    couponApplied: couponApplied || null,
    estimatedDelivery: "In 90 minutes",
  };

  ordersDb.unshift(newOrder);
  res.status(201).json({ message: "Order placed successfully", order: newOrder });
});

module.exports = router;
