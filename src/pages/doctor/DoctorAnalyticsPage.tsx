import React, { useState } from "react";
import {
  TrendingUp,
  Users,
  DollarSign,
  Star,
  Clock,
  Activity,
  Calendar,
  BarChart3,
  PieChart,
  Video,
  Building2,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export const DoctorAnalyticsPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<"month" | "quarter" | "year">("month");

  const diseaseDistribution = [
    { label: "Essential Hypertension", count: 184, percentage: 32, color: "bg-blue-600" },
    { label: "Coronary Artery Disease", count: 148, percentage: 26, color: "bg-indigo-600" },
    { label: "Arrhythmia & Palpitations", count: 102, percentage: 18, color: "bg-purple-600" },
    { label: "Nutritional Anemia & Fatigue", count: 80, percentage: 14, color: "bg-teal-600" },
    { label: "Congestive Heart Failure", count: 56, percentage: 10, color: "bg-amber-600" },
  ];

  const weeklyTrend = [
    { day: "Mon", count: 18, revenue: "₹21,600" },
    { day: "Tue", count: 24, revenue: "₹28,800" },
    { day: "Wed", count: 22, revenue: "₹26,400" },
    { day: "Thu", count: 26, revenue: "₹31,200" },
    { day: "Fri", count: 28, revenue: "₹33,600" },
    { day: "Sat", count: 20, revenue: "₹24,000" },
    { day: "Sun", count: 8, revenue: "₹9,600" },
  ];

  const consultModes = [
    { label: "Telehealth Video Consults", pct: 46, count: 68, color: "bg-blue-500", icon: Video },
    { label: "Hospital Outpatient In-Person", pct: 38, count: 56, color: "bg-emerald-500", icon: Building2 },
    { label: "Emergency Rapid Triage", pct: 16, count: 24, color: "bg-red-500", icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Activity size={12} /> Clinical Performance Intelligence
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">
            Doctor Practice Analytics &amp; Clinical Insights
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Dr. Priya Sharma • Apollo Cardiology Clinic • Patient Volume, Revenues &amp; Disease Trends
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex bg-white/10 p-1 rounded-2xl self-start sm:self-auto border border-white/10">
          {(["month", "quarter", "year"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                timeframe === t ? "bg-white text-slate-950 shadow" : "text-gray-300 hover:text-white"
              }`}
            >
              This {t}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <Users size={18} />
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center">
              +14% <ArrowUpRight size={10} />
            </span>
          </div>
          <p className="text-2xl font-black text-gray-900">148</p>
          <p className="text-xs text-gray-500 font-medium">Monthly Consultations</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <TrendingUp size={18} />
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center">
              +18% <ArrowUpRight size={10} />
            </span>
          </div>
          <p className="text-2xl font-black text-gray-900">₹1,84,000</p>
          <p className="text-xs text-gray-500 font-medium">Net Clinical Revenue</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-purple-600 mb-1">
            <Clock size={18} />
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Optimal
            </span>
          </div>
          <p className="text-2xl font-black text-gray-900">6.5 min</p>
          <p className="text-xs text-gray-500 font-medium">Avg Consultation Wait</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-500 mb-1">
            <Star size={18} />
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Top 2%
            </span>
          </div>
          <p className="text-2xl font-black text-gray-900">4.9 / 5</p>
          <p className="text-xs text-gray-500 font-medium">1,240 Verified Ratings</p>
        </div>
      </div>

      {/* Disease Distribution & Consultation Mode Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Disease Prevalence */}
        <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 size={15} className="text-blue-600" />
              Primary Diagnoses &amp; Pathology Breakdown
            </h3>
            <span className="text-[10px] text-gray-400 font-medium">570 Patients</span>
          </div>

          <div className="space-y-3">
            {diseaseDistribution.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-gray-800">{item.label}</span>
                  <span className="font-bold text-gray-900">{item.percentage}% ({item.count})</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`${item.color} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Consultation Mode Distribution */}
        <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <PieChart size={15} className="text-emerald-600" />
              Consultation Modality Split
            </h3>
            <span className="text-[10px] text-gray-400 font-medium">100% Care Delivery</span>
          </div>

          <div className="space-y-3">
            {consultModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <div
                  key={mode.label}
                  className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className={`${mode.color} p-2 rounded-xl text-white`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{mode.label}</p>
                      <p className="text-[11px] text-gray-500">{mode.count} sessions conducted</p>
                    </div>
                  </div>
                  <span className="text-base font-black text-gray-900">{mode.pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Weekly Revenue & Volume Chart */}
      <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={15} className="text-purple-600" />
            Weekly Consultation Velocity &amp; Daily Revenue
          </h3>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            Week Total: 146 Patients
          </span>
        </div>

        {/* Bar chart representation */}
        <div className="grid grid-cols-7 gap-2 pt-6 items-end h-48">
          {weeklyTrend.map((d) => {
            const heightPct = Math.round((d.count / 30) * 100);
            return (
              <div key={d.day} className="flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[10px] font-bold text-gray-700">{d.count}</span>
                <div className="w-full max-w-[32px] bg-blue-100 rounded-t-xl overflow-hidden relative flex items-end h-32">
                  <div
                    className="w-full bg-blue-600 rounded-t-xl transition-all duration-500 hover:bg-blue-700"
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-600">{d.day}</span>
                <span className="text-[9px] text-gray-400 font-mono hidden sm:inline">{d.revenue}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
