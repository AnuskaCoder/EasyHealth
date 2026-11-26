const { db } = require("../config/database");

const MEDICINES_CATALOG = [
  { id: "m1", name: "Paracetamol 500mg", brand: "Crocin", category: "Pain Relief", price: 25, mrp: 32, discountPercent: 22, unit: "Strip of 10", stock: 500, prescription: false, description: "Effective for fever and mild to moderate pain." },
  { id: "m2", name: "Ferrous Sulphate 200mg", brand: "Fersolate", category: "Supplements", price: 45, mrp: 55, discountPercent: 18, unit: "Strip of 10", stock: 200, prescription: true, description: "Iron supplement for iron deficiency anemia." },
  { id: "m3", name: "Montelukast 10mg", brand: "Singulair", category: "Respiratory", price: 110, mrp: 140, discountPercent: 21, unit: "Strip of 10", stock: 150, prescription: true, description: "Leukotriene receptor antagonist for asthma and allergic rhinitis." },
  { id: "m4", name: "Vitamin D3 60000 IU", brand: "Calcirol", category: "Supplements", price: 55, mrp: 68, discountPercent: 19, unit: "Pack of 4 sachets", stock: 300, prescription: false, description: "Weekly Vitamin D3 supplementation for deficiency." },
  { id: "m5", name: "Pantoprazole 40mg", brand: "Pantop", category: "Gastroenterology", price: 48, mrp: 60, discountPercent: 20, unit: "Strip of 10", stock: 400, prescription: false, description: "Proton pump inhibitor for acidity and GERD." },
  { id: "m6", name: "Azithromycin 500mg", brand: "Azithral", category: "Antibiotics", price: 89, mrp: 110, discountPercent: 19, unit: "Strip of 3", stock: 180, prescription: true, description: "Broad-spectrum macrolide antibiotic." },
  { id: "m7", name: "Cetirizine 10mg", brand: "Zyrtec", category: "Allergy", price: 22, mrp: 28, discountPercent: 21, unit: "Strip of 10", stock: 350, prescription: false, description: "Antihistamine for allergic rhinitis and urticaria." },
  { id: "m8", name: "Metformin 500mg", brand: "Glycomet", category: "Diabetes", price: 18, mrp: 24, discountPercent: 25, unit: "Strip of 10", stock: 450, prescription: true, description: "First-line oral antidiabetic medication." },
  { id: "m9", name: "Atorvastatin 10mg", brand: "Lipitor", category: "Cardiovascular", price: 65, mrp: 85, discountPercent: 24, unit: "Strip of 10", stock: 220, prescription: true, description: "Statin for lowering LDL cholesterol." },
  { id: "m10", name: "ORS Sachet", brand: "Electral", category: "Gastroenterology", price: 12, mrp: 15, discountPercent: 20, unit: "Pack of 10 sachets", stock: 600, prescription: false, description: "Oral rehydration salts for dehydration from diarrhea." },
  { id: "m11", name: "Levothyroxine 50mcg", brand: "Thyronorm", category: "Thyroid", price: 38, mrp: 48, discountPercent: 21, unit: "Strip of 30", stock: 160, prescription: true, description: "Thyroid hormone replacement for hypothyroidism." },
  { id: "m12", name: "Ibuprofen 400mg", brand: "Brufen", category: "Pain Relief", price: 28, mrp: 36, discountPercent: 22, unit: "Strip of 10", stock: 380, prescription: false, description: "NSAID for pain, fever and inflammation. Avoid in asthma." },
];

/**
 * GET /api/pharmacy/medicines
 */
function getMedicines(req, res, next) {
  try {
    const { category, search } = req.query;
    let results = [...MEDICINES_CATALOG];

    if (category && category !== "All") {
      results = results.filter(m => m.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.brand.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
      );
    }

    return res.json({ success: true, count: results.length, medicines: results });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/pharmacy/orders
 */
function placeOrder(req, res, next) {
  try {
    const { items, address, couponApplied } = req.body;
    if (!items || !items.length) {
      return res.status(422).json({ success: false, error: "Order must contain at least one item", code: 422 });
    }

    const orderId = `ORD-${Date.now()}`;
    let subtotal = 0;
    const enrichedItems = items.map(item => {
      const med = MEDICINES_CATALOG.find(m => m.id === item.id);
      const price = med ? med.price : (item.price || 0);
      subtotal += price * (item.quantity || 1);
      return { ...item, unitPrice: price, totalPrice: price * (item.quantity || 1) };
    });

    const discount = couponApplied === "HEALTH20" ? subtotal * 0.2 : 0;
    const total = subtotal - discount;
    const estimatedDelivery = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const order = {
      id: orderId,
      patientId: req.user.id,
      items: enrichedItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      status: "Processing",
      address: address || "Default address",
      couponApplied: couponApplied || null,
      estimatedDelivery,
      createdAt: new Date().toISOString(),
    };

    db.orders.unshift(order);
    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderId,
      estimatedDelivery,
      total: order.total,
      order,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/pharmacy/orders
 */
function getOrders(req, res, next) {
  try {
    const orders = db.orders
      .filter(o => o.patientId === req.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/pharmacy/orders/:id
 */
function getOrderById(req, res, next) {
  try {
    const order = db.orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found", code: 404 });
    }
    return res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMedicines, placeOrder, getOrders, getOrderById };
