import React, { useState, useMemo } from "react";
import {
  Search,
  Pill,
  ShoppingCart,
  Tag,
  ShieldCheck,
  Check,
  Plus,
  Minus,
  Trash2,
  X,
  Sparkles,
  ArrowRight,
  TrendingDown,
  FileCheck,
  PackageCheck,
  MapPin,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { medicines, medicineCategories } from "../../data/medicines";
import { Medicine } from "../../types";

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

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState(
    patientProfile.address || "Flat 402, Green Glen Layout, Bellandur, Bangalore"
  );
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);

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
  const totalSavings = mrpTotal - subtotal + couponDiscount;
  const finalPayable = Math.max(0, subtotal - couponDiscount);

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === "HEALTH30") {
      const disc = Math.round(subtotal * 0.3);
      setCouponDiscount(disc);
      setCouponApplied("HEALTH30 (30% Extra Off)");
    } else if (couponCode.toUpperCase() === "FIRST50") {
      setCouponDiscount(50);
      setCouponApplied("FIRST50 (Flat ₹50 Off)");
    } else {
      alert("Invalid coupon code. Try HEALTH30 for 30% off.");
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    placeOrder({
      items: cart,
      subtotal,
      discount: totalSavings,
      total: Math.round(finalPayable),
      address: deliveryAddress,
      couponApplied: couponApplied || undefined,
    });
    setOrderSuccessId(`ORD-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Discount Promo Banner */}
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
            Use promo code <span className="bg-white/30 px-2 py-0.5 rounded font-mono font-bold text-white">HEALTH30</span> at checkout!
          </p>
        </div>

        {/* View Cart Button */}
        <button
          onClick={() => setShowCartDrawer(true)}
          className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-5 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95"
        >
          <ShoppingCart size={16} />
          <span>Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
          {cart.length > 0 && (
            <span className="bg-emerald-700 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              ₹{Math.round(subtotal)}
            </span>
          )}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search medicine brand name, generic salt (e.g. Paracetamol, Pantoprazole, Metformin)..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {medicineCategories.map((cat) => (
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
      </div>

      {/* Generic Savings Tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-blue-900">
        <TrendingDown size={20} className="text-blue-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-bold">Smart Generic Savings Program Enabled</p>
          <p className="text-[11px] text-blue-700">
            Generic medicines contain the exact same chemical composition and active pharmaceutical ingredients (API) as high-cost brand names at 40-70% lower prices.
          </p>
        </div>
      </div>

      {/* Medicines Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredMedicines.map((med) => {
          const inCart = cart.find((i) => i.medicine.id === med.id);
          return (
            <div
              key={med.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="p-4">
                {/* Header badges */}
                <div className="flex items-start justify-between gap-1 mb-2">
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                    {med.discountPct}% OFF
                  </span>
                  {med.rxRequired && (
                    <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <FileCheck size={11} /> Rx Required
                    </span>
                  )}
                </div>

                {/* Medicine Details */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-lg flex-shrink-0">
                    💊
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">
                      {med.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 truncate">{med.packSize}</p>
                  </div>
                </div>

                <p className="text-[11px] text-emerald-700 font-semibold mb-1">
                  Salt: {med.generic}
                </p>
                <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                  {med.description}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">Mfg: {med.brand}</p>
              </div>

              {/* Pricing & Add to Cart button */}
              <div className="p-4 pt-2 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-black text-gray-900">
                      ₹{med.finalPrice}
                    </span>
                    <span className="text-xs text-gray-400 line-through">₹{med.price}</span>
                  </div>
                  <p className="text-[10px] text-emerald-700 font-bold">
                    Save ₹{(med.price - med.finalPrice).toFixed(1)}
                  </p>
                </div>

                {inCart ? (
                  <div className="flex items-center gap-1.5 bg-emerald-600 text-white rounded-xl px-2 py-1">
                    <button
                      onClick={() => updateCartQuantity(med.id, -1)}
                      className="p-1 hover:bg-emerald-700 rounded"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-bold px-1">{inCart.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(med.id, 1)}
                      className="p-1 hover:bg-emerald-700 rounded"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(med)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Drawer Modal */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-emerald-600" />
                <h3 className="font-bold text-sm text-gray-900">
                  Pharmacy Cart ({cart.reduce((s, i) => s + i.quantity, 0)} items)
                </h3>
              </div>
              <button
                onClick={() => setShowCartDrawer(false)}
                className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400 space-y-2">
                  <Pill size={36} className="mx-auto text-gray-300" />
                  <p className="text-xs">Your medicine cart is empty.</p>
                </div>
              ) : (
                cart.map((item) => (
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
                ))
              )}

              {/* Coupon Box */}
              {cart.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 space-y-2">
                  <label className="block text-xs font-bold text-emerald-900 flex items-center gap-1">
                    <Tag size={13} /> Apply Promo Code / Offer
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Use code HEALTH30"
                      className="flex-1 border border-emerald-300 rounded-xl px-3 py-1.5 text-xs uppercase font-mono"
                    />
                    <button
                      onClick={applyCoupon}
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
                </div>
              )}

              {/* Delivery Address */}
              {cart.length > 0 && (
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
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                >
                  <span>Pay ₹{Math.round(finalPayable)} &amp; Place Order</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Success Confirmation Banner */}
      {orderSuccessId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <PackageCheck size={32} />
            </div>
            <h3 className="font-bold text-lg text-gray-900">Order Confirmed!</h3>
            <p className="text-xs text-gray-500">
              Your medicines are being packed at Apollo Central Pharmacy and will arrive in 90 minutes.
            </p>
            <div className="bg-gray-100 rounded-2xl p-3 text-xs font-mono font-bold text-gray-800">
              Order ID: #{orderSuccessId}
            </div>
            <button
              onClick={() => {
                setOrderSuccessId(null);
                setShowCartDrawer(false);
              }}
              className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
