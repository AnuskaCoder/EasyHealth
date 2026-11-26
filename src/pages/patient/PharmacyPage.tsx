import React, { useState, useMemo } from "react";
import {
  Search,
  ShoppingCart,
  Pill,
  Tag,
  Check,
  ShieldCheck,
  Truck,
  Plus,
  Minus,
  Trash2,
  X,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  PackageCheck,
  Receipt,
  RotateCcw,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { medicines } from "../../data/medicines";
import { getToken, pharmacyApi } from "../../services/api";

export const PharmacyPage: React.FC = () => {
  const {
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    placeOrder,
    orders,
    patientProfile,
  } = useApp();

  const [viewMode, setViewMode] = useState<"browse" | "orders">("browse");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState("");
  const [couponError, setCouponError] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [prescriptionConfirmed, setPrescriptionConfirmed] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(
    patientProfile?.address || "Flat 402, Green Glen Layout, Bellandur, Bangalore 560103"
  );
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>(medicines.map((m) => m.category));
    return ["All", ...Array.from(set)];
  }, []);

  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.generic.toLowerCase().includes(search.toLowerCase()) ||
        m.category.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory === "All" || m.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [search, selectedCategory]);

  const subtotal = cart.reduce((sum, item) => sum + item.medicine.finalPrice * item.quantity, 0);
  const mrpTotal = cart.reduce((sum, item) => sum + item.medicine.price * item.quantity, 0);
  const couponDiscount = couponApplied.startsWith("HEALTH10")
    ? Math.round(subtotal * 0.1)
    : couponApplied.startsWith("SAVE15")
    ? Math.round(subtotal * 0.15)
    : couponApplied.startsWith("FIRST20")
    ? Math.round(subtotal * 0.2)
    : 0;
  const totalSavings = mrpTotal - subtotal + couponDiscount;
  const finalPayable = Math.max(0, subtotal - couponDiscount);
  const totalItemsCount = cart.reduce((s, i) => s + i.quantity, 0);

  const applyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    setCouponError("");
    if (code === "HEALTH10") {
      setCouponApplied("HEALTH10 (10% Extra Off)");
      setCouponCode(code);
    } else if (code === "SAVE15") {
      setCouponApplied("SAVE15 (15% Extra Off)");
      setCouponCode(code);
    } else if (code === "FIRST20") {
      setCouponApplied("FIRST20 (20% Extra Off)");
      setCouponCode(code);
    } else {
      setCouponApplied("");
      setCouponError("Invalid coupon code. Try FIRST20 for 20% off.");
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || checkoutLoading) return;
    setCheckoutError("");
    if (!deliveryAddress.trim()) {
      setCheckoutError("Enter a delivery address to place this order.");
      return;
    }
    if (cart.some(item => !item.medicine.stock)) {
      setCheckoutError("Remove out-of-stock items before placing your order.");
      return;
    }
    const needsPrescription = cart.some(item => item.medicine.rxRequired);
    if (needsPrescription && !prescriptionConfirmed) {
      setCheckoutError("Confirm that you have a valid prescription for the marked items.");
      return;
    }

    setCheckoutLoading(true);
    try {
      if (getToken()) {
        const result = await pharmacyApi.placeOrder({
          items: cart.map(({ medicine, quantity }) => ({ id: medicine.id, quantity })),
          address: deliveryAddress.trim(),
          couponCode: couponApplied.split(" ")[0] || undefined,
        });
        const serverOrder = result.data?.data;
        if (result.error || !serverOrder) {
          setCheckoutError(result.error || "The order could not be placed. Your cart is unchanged; please retry.");
          return;
        }
        const orderId = placeOrder({
          id: serverOrder.id,
          date: serverOrder.createdAt?.slice(0, 10),
          status: serverOrder.status || "Processing",
          items: serverOrder.items.map((item: any) => ({ medicine: item.medicine, quantity: item.quantity })),
          subtotal: serverOrder.subtotal,
          discount: serverOrder.discount,
          total: serverOrder.total,
          address: serverOrder.address,
          couponApplied: serverOrder.couponApplied || undefined,
        });
        setOrderSuccessId(orderId);
        setCouponApplied("");
        setCouponCode("");
        setPrescriptionConfirmed(false);
        setShowCartDrawer(false);
        return;
      }

      const orderId = placeOrder({
        items: [...cart],
        subtotal,
        discount: totalSavings,
        total: Math.round(finalPayable),
        address: deliveryAddress.trim(),
        couponApplied: couponApplied || undefined,
      });
      setOrderSuccessId(orderId);
      setCouponApplied("");
      setCouponCode("");
      setPrescriptionConfirmed(false);
      setShowCartDrawer(false);
    } catch {
      setCheckoutError("The order could not be placed. Your cart is unchanged; please retry.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Top Banner & View Switcher */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 rounded-3xl p-5 sm:p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-white/20 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full mb-2 backdrop-blur-md">
            <Sparkles size={14} className="text-amber-300" /> Guaranteed Lowest Price Pharmacy
          </div>
          <h1 className="text-xl sm:text-2xl font-black">
            Save Up To 50% On Medicines &amp; Generics
          </h1>
          <p className="text-xs text-emerald-100 mt-1 max-w-xl">
            100% genuine WHO-GMP certified pharmaceuticals delivered to your doorstep in 2 hours.
            Use promo code <span className="bg-white/30 px-2 py-0.5 rounded font-mono font-bold text-white">FIRST20</span> at checkout!
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Switcher: Browse vs Orders */}
          <div className="bg-black/20 p-1 rounded-2xl flex items-center text-xs">
            <button
              onClick={() => setViewMode("browse")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                viewMode === "browse" ? "bg-white text-emerald-800 shadow-sm" : "text-white/80 hover:text-white"
              }`}
            >
              Browse Catalog
            </button>
            <button
              onClick={() => setViewMode("orders")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
                viewMode === "orders" ? "bg-white text-emerald-800 shadow-sm" : "text-white/80 hover:text-white"
              }`}
            >
              <PackageCheck size={13} />
              <span>My Orders ({orders.length})</span>
            </button>
          </div>

          {/* View Cart Button */}
          <button
            onClick={() => setShowCartDrawer(true)}
            className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <ShoppingCart size={16} className="text-emerald-600" />
            <span>Cart ({totalItemsCount})</span>
            {cart.length > 0 && (
              <span className="bg-emerald-700 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                ₹{Math.round(subtotal)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─── ORDERS VIEW ──────────────────────────────────────────────────────── */}
      {viewMode === "orders" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <PackageCheck size={18} className="text-emerald-600" />
              Your Pharmacy Orders &amp; Live Tracking
            </h2>
            <button
              onClick={() => setViewMode("browse")}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              ← Back to Shopping
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Receipt size={28} />
              </div>
              <h3 className="font-bold text-sm text-gray-800">No Orders Placed Yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                You haven't ordered any medicines yet. Add medications to your cart and place an order to get doorstep delivery.
              </p>
              <button
                onClick={() => setViewMode("browse")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs"
              >
                Browse Medicines
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-gray-900 text-sm">{order.id}</span>
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                          {order.status}
                        </span>
                      </div>
                      <p className="text-gray-400 text-[11px] mt-0.5">Placed on {order.date}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-gray-400 text-[11px]">Total Paid: </span>
                      <span className="font-black text-base text-gray-900">₹{order.total}</span>
                      {order.discount > 0 && (
                        <p className="text-[10px] text-emerald-600 font-semibold">
                          Saved ₹{Math.round(order.discount)} with offers
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Delivery Status Step Tracker */}
                  <div className="grid grid-cols-4 gap-2 pt-1 text-center text-[10px] font-bold">
                    <div className="space-y-1 text-emerald-600">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-xs">✓</div>
                      <span>Confirmed</span>
                    </div>
                    <div className="space-y-1 text-emerald-600">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-xs">✓</div>
                      <span>Packed</span>
                    </div>
                    <div className="space-y-1 text-blue-600">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 border border-blue-400 flex items-center justify-center mx-auto text-xs">🚚</div>
                      <span>Out for Delivery</span>
                    </div>
                    <div className="space-y-1 text-gray-400">
                      <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto text-xs">4</div>
                      <span>Delivered</span>
                    </div>
                  </div>

                  {/* Items Ordered */}
                  <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-xs">
                    <p className="font-bold text-gray-700 text-[11px]">Items Ordered ({order.items.length}):</p>
                    <div className="divide-y divide-gray-200">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="py-1.5 flex justify-between items-center text-[11px]">
                          <div>
                            <span className="font-semibold text-gray-800">{item.medicine.name}</span>
                            <span className="text-gray-400 ml-1">× {item.quantity}</span>
                          </div>
                          <span className="font-bold text-gray-700">₹{(item.medicine.finalPrice * item.quantity).toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-gray-500 gap-2">
                    <div className="flex items-center gap-1 text-[11px]">
                      <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                      <span>{order.address}</span>
                    </div>
                    <span className="text-emerald-700 font-bold text-[11px]">
                      Expected Delivery: Today within 90 mins
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ─── BROWSE CATALOG VIEW ────────────────────────────────────────────── */
        <div className="space-y-5">
          {/* Search and Category Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search medicines by brand name, salt, or ailment (e.g. Paracetamol, Montelukast)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedCategory === cat
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Assurance Row */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-blue-900">
            <ShieldCheck size={20} className="text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-bold">100% Genuine Pharmacy Assurance:</span> Every medicine is temperature-controlled, batch-verified, and sourced directly from certified licensed manufacturers.
            </div>
            <div className="hidden sm:flex items-center gap-1 font-bold text-emerald-700">
              <Truck size={14} /> Free Express Delivery
            </div>
          </div>

          {/* Medicine Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMedicines.map((med) => {
              const inCart = cart.find((i) => i.medicine.id === med.id);
              return (
                <div
                  key={med.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {med.category}
                        </span>
                        <h3 className="font-bold text-sm text-gray-900 mt-1 leading-snug">
                          {med.name}
                        </h3>
                        <p className="text-[11px] text-gray-500 font-medium">
                          {med.generic}
                        </p>
                      </div>
                      <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {med.discountPct}% OFF
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-600 line-clamp-2">
                      {med.description}
                    </p>

                    <div className="text-[11px] text-gray-400">
                      Pack: <span className="text-gray-600 font-medium">{med.packSize}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-extrabold text-gray-900">
                          ₹{med.finalPrice}
                        </span>
                        <span className="text-xs text-gray-400 line-through">
                          ₹{med.price}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-bold block">
                        Save ₹{(med.price - med.finalPrice).toFixed(1)}
                      </span>
                    </div>

                    {!med.stock ? (
                      <span className="bg-gray-200 text-gray-500 text-xs font-bold px-3 py-2 rounded-xl">Out of stock</span>
                    ) : inCart ? (
                      <div className="flex items-center gap-2 bg-emerald-600 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold">
                        <button
                          onClick={() => updateCartQuantity(med.id, -1)}
                          className="p-1 hover:bg-emerald-700 rounded transition-all"
                        >
                          <Minus size={12} />
                        </button>
                        <span>{inCart.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(med.id, 1)}
                          className="p-1 hover:bg-emerald-700 rounded transition-all"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          addToCart(med);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1 active:scale-95"
                      >
                        <Plus size={14} /> Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── STICKY FLOATING CART BAR ─────────────────────────────────────────── */}
      {cart.length > 0 && !showCartDrawer && (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 animate-in slide-in-from-bottom duration-200">
          <button
            onClick={() => setShowCartDrawer(true)}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between font-bold text-xs hover:brightness-105 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="bg-white/20 p-2 rounded-xl">
                <ShoppingCart size={16} />
              </div>
              <div className="text-left">
                <p>{totalItemsCount} item{totalItemsCount > 1 ? "s" : ""} added to cart</p>
                <p className="text-[10px] text-emerald-100 font-normal">Delivery is FREE</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black">₹{Math.round(finalPayable)}</span>
              <span className="bg-white text-emerald-800 text-[11px] font-extrabold px-3 py-1.5 rounded-xl">
                View Cart →
              </span>
            </div>
          </button>
        </div>
      )}

      {/* ─── CART DRAWER MODAL ────────────────────────────────────────────────── */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-emerald-600" />
                <h3 className="font-bold text-sm text-gray-900">
                  Pharmacy Cart ({totalItemsCount} items)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    onClick={() => {
                      clearCart();
                      setCouponApplied("");
                      setCouponCode("");
                      setPrescriptionConfirmed(false);
                    }}
                    className="text-[11px] text-red-600 font-bold hover:underline"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setShowCartDrawer(false)}
                  className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-gray-400 space-y-2">
                  <Pill size={40} className="mx-auto text-gray-300" />
                  <p className="text-sm font-bold text-gray-600">Your medicine cart is empty</p>
                  <p className="text-xs text-gray-400">Add medicines from the catalog to proceed</p>
                  <button
                    onClick={() => setShowCartDrawer(false)}
                    className="mt-3 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    Browse Medicines
                  </button>
                </div>
              ) : (
                <>
                  {cart.map((item) => (
                    <div
                      key={item.medicine.id}
                      className="p-3 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">{item.medicine.name}</p>
                        <p className="text-[11px] text-gray-500 truncate">{item.medicine.generic}</p>
                        <p className="font-extrabold text-emerald-700 mt-1">
                          ₹{item.medicine.finalPrice} × {item.quantity} = ₹
                          {(item.medicine.finalPrice * item.quantity).toFixed(1)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-xl px-2 py-1">
                        <button
                          onClick={() => updateCartQuantity(item.medicine.id, -1)}
                          className="text-gray-600 hover:text-black p-0.5"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-bold px-1.5">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.medicine.id, 1)}
                          className="text-gray-600 hover:text-black p-0.5"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.medicine.id)}
                        className="text-gray-400 hover:text-red-600 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  {/* Coupon Box */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 space-y-2">
                    <label className="block text-xs font-bold text-emerald-900 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Tag size={13} /> Apply Promo Code / Offer
                      </span>
                      <span
                        onClick={() => applyCoupon("FIRST20")}
                        className="text-[10px] text-emerald-700 underline cursor-pointer font-normal"
                      >
                        Try FIRST20 (20% off)
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value);
                          setCouponError("");
                        }}
                        placeholder="e.g. FIRST20"
                        className="flex-1 border border-emerald-300 rounded-xl px-3 py-1.5 text-xs uppercase font-mono bg-white"
                      />
                      <button
                        onClick={() => applyCoupon()}
                        className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-emerald-700"
                      >
                        Apply
                      </button>
                    </div>
                    {couponApplied && (
                      <p className="text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                        <Check size={12} /> {couponApplied}
                      </p>
                    )}
                    {couponError && (
                      <p className="text-[11px] text-red-600 font-medium">
                        {couponError}
                      </p>
                    )}
                  </div>

                  {/* Delivery Address */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                      <MapPin size={13} className="text-blue-600" /> Delivery Address
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  {cart.some(item => item.medicine.rxRequired) && (
                    <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900">
                      <input
                        type="checkbox"
                        checked={prescriptionConfirmed}
                        onChange={e => setPrescriptionConfirmed(e.target.checked)}
                        className="mt-0.5 accent-amber-600"
                      />
                      <span>I have a valid prescription for the items marked “Prescription required”. A pharmacist must verify it before dispensing.</span>
                    </label>
                  )}
                  {checkoutError && <p role="alert" className="text-xs font-semibold text-red-600">{checkoutError}</p>}
                </>
              )}
            </div>

            {/* Checkout Footer */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>MRP Total</span>
                    <span>₹{mrpTotal.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Total Discount &amp; Offers</span>
                    <span>-₹{totalSavings.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Delivery Fee</span>
                    <span className="text-emerald-700 font-bold">FREE</span>
                  </div>
                  <div className="border-t border-gray-200 pt-1 flex justify-between font-extrabold text-sm text-gray-900">
                    <span>Final Amount Payable</span>
                    <span>₹{Math.round(finalPayable)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <span>{checkoutLoading ? "Placing order…" : `Place Order · ₹${Math.round(finalPayable)}`}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── ORDER SUCCESS CONFIRMATION MODAL ─────────────────────────────────── */}
      {orderSuccessId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <PackageCheck size={32} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">Order Confirmed!</h3>
              <p className="text-xs text-gray-500 mt-1">
                Your order has been recorded. No online payment was collected; delivery and prescription verification must be confirmed with the pharmacy.
              </p>
            </div>
            <div className="bg-gray-100 rounded-2xl p-3 text-xs font-mono font-bold text-gray-800">
              Order ID: #{orderSuccessId}
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => {
                  setOrderSuccessId(null);
                  setViewMode("orders");
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs shadow-xs"
              >
                Track My Order Now →
              </button>
              <button
                onClick={() => setOrderSuccessId(null)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
