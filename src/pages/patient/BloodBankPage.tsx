import React, { useEffect, useState } from "react";
import {
  Heart,
  AlertTriangle,
  MapPin,
  Clock,
  Phone,
  Share2,
  CheckCircle,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  Droplet,
  Users,
  Activity,
  ArrowRight,
  Sparkles,
  Building2,
  Send,
  Info,
  ChevronRight,
  Flame,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { bloodBankApi, getToken } from "../../services/api";

interface UrgentBloodRequest {
  id: string;
  patientName: string;
  bloodGroup: string;
  unitsNeeded: number;
  component: "Whole Blood" | "PRBC (Red Cells)" | "Platelets (SDP)" | "Plasma (FFP)";
  urgency: "CRITICAL" | "HIGH" | "SCHEDULED";
  hospital: string;
  area: string;
  city: string;
  distanceKm: number;
  reason: string;
  contactName: string;
  contactPhone: string;
  postedTime: string;
  donorsResponded: number;
  isMine?: boolean;
}

interface BloodBankStock {
  id: string;
  name: string;
  location: string;
  stock: Record<string, number>;
}

const INITIAL_REQUESTS: UrgentBloodRequest[] = [
  {
    id: "REQ-9901",
    patientName: "Sample Patient (Demo)",
    bloodGroup: "O-",
    unitsNeeded: 3,
    component: "PRBC (Red Cells)",
    urgency: "CRITICAL",
    hospital: "Example Hospital (Demo)",
    area: "Example area",
    city: "",
    distanceKm: 0,
    reason: "Sample urgent request — not a real case",
    contactName: "No demo contact",
    contactPhone: "",
    postedTime: "12 mins ago",
    donorsResponded: 1,
  },
  {
    id: "REQ-9902",
    patientName: "Sample Patient (Demo)",
    bloodGroup: "B+",
    unitsNeeded: 2,
    component: "Platelets (SDP)",
    urgency: "CRITICAL",
    hospital: "Example Hospital (Demo)",
    area: "Example area",
    city: "",
    distanceKm: 0,
    reason: "Sample urgent request — not a real case",
    contactName: "No demo contact",
    contactPhone: "",
    postedTime: "28 mins ago",
    donorsResponded: 2,
  },
  {
    id: "REQ-9903",
    patientName: "Sample Patient (Demo)",
    bloodGroup: "AB-",
    unitsNeeded: 2,
    component: "Whole Blood",
    urgency: "HIGH",
    hospital: "Example Hospital (Demo)",
    area: "Example area",
    city: "",
    distanceKm: 0,
    reason: "Sample scheduled request — not a real case",
    contactName: "No demo contact",
    contactPhone: "",
    postedTime: "1 hour ago",
    donorsResponded: 0,
  },
  {
    id: "REQ-9904",
    patientName: "Sample Patient (Demo)",
    bloodGroup: "A+",
    unitsNeeded: 2,
    component: "Whole Blood",
    urgency: "HIGH",
    hospital: "Example Hospital (Demo)",
    area: "Example area",
    city: "",
    distanceKm: 0,
    reason: "Sample urgent request — not a real case",
    contactName: "No demo contact",
    contactPhone: "",
    postedTime: "2 hours ago",
    donorsResponded: 3,
  },
];

const BLOOD_BANKS: BloodBankStock[] = [
  {
    id: "bb-1",
    name: "Sample Blood Bank A (Demo)",
    location: "Example location — no live integration",
    stock: {
      "O+": 18,
      "A+": 14,
      "B+": 22,
      "AB+": 9,
      "O-": 4,
      "A-": 3,
      "B-": 5,
      "AB-": 2,
    },
  },
  {
    id: "bb-2",
    name: "Sample Blood Bank B (Demo)",
    location: "Example location — no live integration",
    stock: {
      "O+": 26,
      "A+": 19,
      "B+": 31,
      "AB+": 12,
      "O-": 6,
      "A-": 4,
      "B-": 7,
      "AB-": 3,
    },
  },
  {
    id: "bb-3",
    name: "Sample Blood Bank C (Demo)",
    location: "Example location — no live integration",
    stock: {
      "O+": 12,
      "A+": 8,
      "B+": 15,
      "AB+": 6,
      "O-": 2,
      "A-": 2,
      "B-": 3,
      "AB-": 1,
    },
  },
];

const BLOOD_GROUPS = ["All", "O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"];

export const BloodBankPage: React.FC = () => {
  const { patientProfile, addNotification } = useApp();

  const [activeTab, setActiveTab] = useState<"urgent" | "request" | "banks" | "donate">("urgent");
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [requestsList, setRequestsList] = useState<UrgentBloodRequest[]>(() => {
    try {
      const saved = sessionStorage.getItem("eh_blood_requests_demo");
      return saved ? JSON.parse(saved) as UrgentBloodRequest[] : INITIAL_REQUESTS;
    } catch { return INITIAL_REQUESTS; }
  });
  const [nearbyArea, setNearbyArea] = useState("");
  const [sharedFeedConnected, setSharedFeedConnected] = useState(false);
  const [feedLoading, setFeedLoading] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [shareContactConsent, setShareContactConsent] = useState(false);
  const [donateModalRequest, setDonateModalRequest] = useState<UrgentBloodRequest | null>(null);
  const [donationConfirmed, setDonationConfirmed] = useState(false);
  const [donationError, setDonationError] = useState("");

  // New Request Form State
  const [reqPatientName, setReqPatientName] = useState("");
  const [reqBloodGroup, setReqBloodGroup] = useState(patientProfile?.bloodGroup || "O+");
  const [reqComponent, setReqComponent] = useState<"Whole Blood" | "PRBC (Red Cells)" | "Platelets (SDP)" | "Plasma (FFP)">("Whole Blood");
  const [reqUnits, setReqUnits] = useState(2);
  const [reqHospital, setReqHospital] = useState("");
  const [reqArea, setReqArea] = useState("");
  const [reqUrgency, setReqUrgency] = useState<"CRITICAL" | "HIGH" | "SCHEDULED">("CRITICAL");
  const [reqReason, setReqReason] = useState("");
  const [reqPhone, setReqPhone] = useState(patientProfile?.phone || "+91 98765 43210");
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // Volunteer Donor Form
  const [donorName, setDonorName] = useState(patientProfile?.name || "");
  const [donorGroup, setDonorGroup] = useState(patientProfile?.bloodGroup || "O+");
  const [donorRegistered, setDonorRegistered] = useState(() =>
    Boolean(patientProfile?.id && sessionStorage.getItem(`eh_donor_active_${patientProfile.id}`) === "true")
  );

  useEffect(() => {
    if (!sharedFeedConnected) {
      sessionStorage.setItem("eh_blood_requests_demo", JSON.stringify(requestsList));
    }
  }, [requestsList, sharedFeedConnected]);

  useEffect(() => {
    if (!getToken()) return;
    let active = true;
    const refreshRequests = async () => {
      setFeedLoading(true);
      const result = await bloodBankApi.getRequests();
      if (!active) return;
      if (!result.error && result.data) {
        setSharedFeedConnected(true);
        setRequestsList((result.data.data || []).map((request: any) => ({
          ...request,
          distanceKm: Number(request.distanceKm) || 0,
          city: request.city || "",
          donorsResponded: Number(request.donorsResponded) || 0,
        })));
      }
      setFeedLoading(false);
    };
    void refreshRequests();
    const intervalId = window.setInterval(() => { void refreshRequests(); }, 30_000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const filteredRequests = requestsList.filter((r) => {
    const matchesGroup = selectedGroup === "All" || r.bloodGroup === selectedGroup;
    const location = `${r.area} ${r.city} ${r.hospital}`.toLowerCase();
    return matchesGroup && (!nearbyArea.trim() || location.includes(nearbyArea.trim().toLowerCase()));
  });

  const handlePostRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError("");
    if ((!getToken() && !reqPatientName.trim()) || !reqHospital.trim() || !reqPhone.trim() || !reqArea.trim()) {
      setRequestError("Complete the required hospital, location, and phone fields.");
      return;
    }
    if (!Number.isInteger(reqUnits) || reqUnits < 1 || reqUnits > 10) {
      setRequestError("Enter between 1 and 10 units.");
      return;
    }
    if (getToken() && !shareContactConsent) {
      setRequestError("Consent is required before sharing the contact number with signed-in users.");
      return;
    }

    if (getToken()) {
      const result = await bloodBankApi.createRequest({
        bloodGroup: reqBloodGroup,
        unitsNeeded: reqUnits,
        component: reqComponent,
        urgency: reqUrgency,
        hospital: reqHospital.trim(),
        area: reqArea.trim(),
        reason: "",
        contactPhone: reqPhone.trim(),
        contactConsent: shareContactConsent,
      });
      const savedRequest = result.data?.data;
      if (result.error || !savedRequest) {
        setRequestError(result.error || "Could not add the request to the shared feed. Please retry.");
        return;
      }
      setRequestsList(prev => [{
        ...savedRequest,
        distanceKm: 0,
        donorsResponded: 0,
      }, ...prev]);
      setSharedFeedConnected(true);
      setRequestSubmitted(true);
      addNotification({
        title: `Blood Request Added (${reqBloodGroup})`,
        message: "Your request is visible to signed-in EasyHealth users. It is not verified by a hospital and does not alert emergency services.",
        type: "emergency",
        actionPage: "blood-bank",
      });
      return;
    }

    const newReq: UrgentBloodRequest = {
      id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: reqPatientName,
      bloodGroup: reqBloodGroup,
      unitsNeeded: reqUnits,
      component: reqComponent,
      urgency: reqUrgency,
      hospital: reqHospital,
      area: reqArea,
      city: "",
      distanceKm: 0,
      reason: reqReason || "Urgent medical / surgical intervention",
      contactName: patientProfile?.name || reqPatientName,
      contactPhone: reqPhone,
      postedTime: "Just now",
      donorsResponded: 0,
    };

    setRequestsList((prev) => [newReq, ...prev]);
    setRequestSubmitted(true);
    addNotification({
      title: `Blood Request Saved (${newReq.bloodGroup})`,
      message: `Your request is saved in this browser session only. This demo does not alert donors or hospitals; contact ${newReq.hospital} directly.`,
      type: "emergency",
      actionPage: "blood-bank",
    });
  };

  const handleConfirmDonation = () => {
    if (!donateModalRequest) return;
    setDonationError("");
    if (getToken() && !sharedFeedConnected) {
      setDonationError("The shared request service is unavailable. Your response has not been saved.");
      return;
    }
    if (getToken()) {
      void bloodBankApi.respondToRequest(donateModalRequest.id).then(result => {
        if (result.error || !result.data) {
          setDonationError(result.error || "Your response could not be saved. Please retry.");
          return;
        }
        setRequestsList(prev => prev.map(r => r.id === donateModalRequest.id
          ? { ...r, donorsResponded: result.data!.data.donorsResponded }
          : r));
        setDonationConfirmed(true);
      });
      return;
    }
    setRequestsList((prev) =>
      prev.map((r) =>
        r.id === donateModalRequest.id ? { ...r, donorsResponded: r.donorsResponded + 1 } : r
      )
    );
    setDonationConfirmed(true);
    addNotification({
      title: "Donation Interest Saved",
      message: `Your interest is saved in this session only. No coordinator was notified; call ${donateModalRequest.hospital} to confirm the need.`,
      type: "appointment",
      actionPage: "blood-bank",
    });
  };

  const handleRegisterDonor = (e: React.FormEvent) => {
    e.preventDefault();
    setDonorRegistered(true);
    if (patientProfile?.id) sessionStorage.setItem(`eh_donor_active_${patientProfile.id}`, "true");
    addNotification({
      title: "Donor Interest Saved",
      message: `Your donor interest is saved for this browser session. This demo cannot send alerts; contact a licensed blood bank to complete registration.`,
      type: "appointment",
      actionPage: "blood-bank",
    });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* ─── Hero Emergency Header ────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-rose-700 via-red-600 to-amber-700 rounded-3xl p-5 sm:p-7 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-white/20 text-rose-100 text-xs font-bold px-3 py-1 rounded-full mb-3 backdrop-blur-md">
            <Flame size={14} className="text-amber-300" /> Urgent Blood Requests · Demo Listings
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
            Urgent Blood Requests &amp; Donor Interest
          </h1>
          <p className="text-xs sm:text-sm text-rose-100 mt-2 leading-relaxed">
            View sample requests, save donor interest, and contact licensed blood banks to check current availability.
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setActiveTab("request")}
              className="bg-white text-rose-700 hover:bg-rose-50 text-xs font-black px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <Plus size={15} /> Request Blood Urgently
            </button>
            <button
              onClick={() => setActiveTab("donate")}
              className="bg-rose-900/60 hover:bg-rose-900/80 border border-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all backdrop-blur-md"
            >
              Become a Volunteer Donor
            </button>
          </div>
        </div>

        {/* Decorative Blood Drop Icon in Background */}
            <Droplet className="absolute -right-6 -bottom-8 text-white/10 w-48 h-48 pointer-events-none" />
      </div>

      {/* ─── Navigation Tabs ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto scrollbar-none text-xs font-bold">
        <button
          onClick={() => setActiveTab("urgent")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "urgent"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <AlertTriangle size={14} />
          <span>Urgent Requests ({requestsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("request")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "request"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Plus size={14} />
          <span>Post Blood Request</span>
        </button>

        <button
          onClick={() => setActiveTab("banks")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "banks"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Building2 size={14} />
          <span>Blood Bank Availability</span>
        </button>

        <button
          onClick={() => setActiveTab("donate")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "donate"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Heart size={14} />
          <span>Register as Donor</span>
        </button>
      </div>

      {/* ─── TAB 1: URGENT BLOOD REQUESTS FEED ─────────────────────────────────── */}
      {activeTab === "urgent" && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-950">
            <strong>Important:</strong> {sharedFeedConnected ? "Requests are shared with signed-in EasyHealth users but are not hospital-verified; bank stock figures remain sample data." : "Listings and stock figures are sample demo data, not live or medically verified."} This page does not alert hospitals or reserve blood. Blood is not sold here; contact a licensed blood bank or the treating hospital to confirm component availability, compatibility, eligibility, and any lawful processing charges. For a medical emergency, call 112 / 108.
          </div>

          {/* Blood Group Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-gray-500 whitespace-nowrap flex items-center gap-1">
              <Filter size={13} /> Blood Group:
            </span>
            {BLOOD_GROUPS.map((grp) => (
              <button
                key={grp}
                onClick={() => setSelectedGroup(grp)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedGroup === grp
                    ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                {grp}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="sr-only">Filter by area, city, or hospital</span>
            <input
              value={nearbyArea}
              onChange={e => setNearbyArea(e.target.value)}
              placeholder="Filter requests by area, city, or hospital"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </label>

          {/* Emergency Alert Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-amber-900">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <strong>Contact the hospital directly:</strong> Donor responses are shown to signed-in users, but this app does not notify hospitals or verify requests. A licensed blood bank must confirm the match and availability.
            </div>
          </div>

          {/* Requests Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRequests.length === 0 && (
              <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
                No sample requests match those filters. If this is urgent, call the treating hospital or a licensed blood bank.
              </div>
            )}
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                {/* Urgency colored top bar */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    req.urgency === "CRITICAL"
                      ? "bg-red-600"
                      : req.urgency === "HIGH"
                      ? "bg-amber-500"
                      : "bg-blue-500"
                  }`}
                />

                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex flex-col items-center justify-center flex-shrink-0 font-black">
                        <span className="text-base leading-none">{req.bloodGroup}</span>
                        <span className="text-[9px] uppercase text-rose-500 font-bold mt-0.5">Needed</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-gray-900">{req.patientName}</h3>
                          {req.isMine && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-800">Your request</span>}
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              req.urgency === "CRITICAL"
                                ? "bg-red-100 text-red-800 animate-pulse"
                                : req.urgency === "HIGH"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {req.urgency}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Building2 size={12} className="text-gray-400" />
                          <span>{req.hospital}</span>
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                      {req.postedTime}
                    </span>
                  </div>

                  {/* Clinical Reason */}
                  <div className="bg-gray-50 rounded-xl p-2.5 text-xs text-gray-700 space-y-1">
                    <p className="text-[11px] font-medium text-gray-600">
                      <strong>Reason:</strong> {req.reason}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-200/60">
                      <span>Component: <strong>{req.component}</strong></span>
                      <span className="font-bold text-rose-700">{req.unitsNeeded} Units Required</span>
                    </div>
                  </div>

                  {/* Location & Distance */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1 text-[11px]">
                      <MapPin size={12} className="text-rose-500" />
                      {[req.area, req.city].filter(Boolean).join(", ")}{req.distanceKm > 0 ? ` (${req.distanceKm} km away)` : ""}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700">
                      👥 {req.donorsResponded} donor{req.donorsResponded !== 1 ? "s" : ""} responding
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <button
                    disabled={feedLoading || Boolean(req.isMine)}
                    onClick={() => {
                      setDonateModalRequest(req);
                      setDonationConfirmed(false);
                      setDonationError("");
                    }}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Heart size={14} /> {req.isMine ? "Your request" : "I Can Donate"}
                  </button>

                  {req.contactPhone ? (
                    <a
                      href={`tel:${req.contactPhone}`}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-3 py-2.5 rounded-xl transition-all flex items-center gap-1"
                      title="Call the request contact"
                    >
                      <Phone size={13} />
                      <span className="hidden sm:inline">Call</span>
                    </a>
                  ) : <span className="text-[10px] text-gray-400">No sample contact</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 2: POST BLOOD REQUEST (FAST FORM) ───────────────────────────── */}
      {activeTab === "request" && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Plus className="text-rose-600" size={20} /> Post An Urgent Blood Request
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {getToken() ? "Signed-in requests are visible to signed-in EasyHealth users, but are not verified or sent to hospitals. Contact the treating hospital directly for urgent help." : "This demo saves the request in this browser session only. It does not notify donors, hospitals, or blood banks. Do not enter sensitive patient details; call the treating hospital directly for urgent help."}
            </p>
          </div>

          {requestSubmitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-base font-bold text-gray-900">Request Saved in This Session</h3>
              <p className="text-xs text-gray-600 max-w-md mx-auto">
                {sharedFeedConnected ? "Your request is listed for signed-in EasyHealth users, but no hospital or emergency service has been notified." : "No one has been notified by this demo."} Contact the hospital and a licensed blood bank directly to verify current availability and coordinate care.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setRequestSubmitted(false);
                    setActiveTab("urgent");
                  }}
                  className="bg-rose-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs"
                >
                  View Active Requests Feed
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePostRequest} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Patient / Representative Name {!getToken() ? "*" : "(optional; demo only)"}</label>
                  <input
                    type="text"
                    required={!getToken()}
                    placeholder="e.g. Ramesh Kumar"
                    value={reqPatientName}
                    onChange={(e) => setReqPatientName(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Required Blood Group *</label>
                  <select
                    value={reqBloodGroup}
                    onChange={(e) => setReqBloodGroup(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-rose-700 focus:ring-2 focus:ring-rose-500"
                  >
                    {BLOOD_GROUPS.filter((g) => g !== "All").map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {getToken() && (
                <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-950">
                  <input
                    type="checkbox"
                    checked={shareContactConsent}
                    onChange={e => setShareContactConsent(e.target.checked)}
                    className="mt-0.5 accent-rose-600"
                  />
                  <span>I am authorized to post this request and consent to showing this phone number to signed-in EasyHealth users so they can contact us. Do not include unnecessary medical details.</span>
                </label>
              )}

              {requestError && <p role="alert" className="text-xs font-semibold text-red-600">{requestError}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Component Needed *</label>
                  <select
                    value={reqComponent}
                    onChange={(e: any) => setReqComponent(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Whole Blood">Whole Blood</option>
                    <option value="PRBC (Red Cells)">PRBC (Packed Red Blood Cells)</option>
                    <option value="Platelets (SDP)">Single Donor Platelets (SDP)</option>
                    <option value="Plasma (FFP)">Fresh Frozen Plasma (FFP)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Units Needed *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={reqUnits}
                    onChange={(e) => setReqUnits(parseInt(e.target.value, 10))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Hospital Name &amp; Ward *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apollo Hospital, ICU Ward 3"
                    value={reqHospital}
                    onChange={(e) => setReqHospital(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Urgency Level *</label>
                  <select
                    value={reqUrgency}
                    onChange={(e: any) => setReqUrgency(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="CRITICAL">🚨 CRITICAL (Within next 2 hours)</option>
                    <option value="HIGH">⚡ HIGH (Required today)</option>
                    <option value="SCHEDULED">🟡 SCHEDULED (For upcoming surgery)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Reason / Diagnosis</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Emergency surgery / Low platelets due to Dengue / Accidental trauma"
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Contact Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={reqPhone}
                    onChange={(e) => setReqPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Location / Area</label>
                  <input
                    type="text"
                    placeholder="e.g. Bannerghatta Road, Bangalore"
                    value={reqArea}
                    onChange={(e) => setReqArea(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-3.5 rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2 mt-2"
              >
                <Send size={15} /> {getToken() ? "Post Request to Shared Feed" : "Save Demo Request"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ─── TAB 3: BLOOD BANK STOCKS & RESERVE ───────────────────────────────── */}
      {activeTab === "banks" && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-blue-900">
            <ShieldCheck size={20} className="text-blue-600 flex-shrink-0" />
            <div>
              <strong>Sample availability only—not live stock.</strong> Blood is not sold through EasyHealth. Licensed blood banks and clinicians determine eligibility, compatibility, stock, and any permitted processing charges. Find a licensed provider independently and call to confirm before traveling; do not rely on these demo quantities.
            </div>
          </div>

          <div className="space-y-4">
            {BLOOD_BANKS.map((bank) => (
              <div
                key={bank.id}
                className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-gray-900">{bank.name}</h3>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={12} className="text-gray-400" />
                      {bank.location}
                    </p>
                  </div>

                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-900">Demo inventory only</span>
                </div>

                {/* Stock Table Grid */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-gray-600">Illustrative quantities (not current stock):</p>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-center text-xs">
                    {Object.entries(bank.stock).map(([grp, qty]) => (
                      <div
                        key={grp}
                        className={`p-2 rounded-xl border flex flex-col justify-between ${
                          qty > 5
                            ? "bg-emerald-50/50 border-emerald-200 text-emerald-900"
                            : qty > 0
                            ? "bg-amber-50/50 border-amber-200 text-amber-900"
                            : "bg-gray-50 border-gray-200 text-gray-400"
                        }`}
                      >
                        <span className="font-black text-sm">{grp}</span>
                        <span className="text-[11px] font-bold mt-0.5">{qty} Units</span>
                        <span className="mt-1.5 block rounded-lg bg-gray-100 py-1 text-[9px] font-semibold text-gray-500">Demo only</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 text-gray-500">
                  <span className="flex items-center gap-1 text-gray-500">
                    <Phone size={12} /> No live provider contact or reservation link
                  </span>
                  <span className="text-amber-700 font-bold">Call a licensed bank directly</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 4: BECOME A DONOR ────────────────────────────────────────────── */}
      {activeTab === "donate" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Heart className="text-rose-600" size={18} /> Register as Emergency On-Call Donor
            </h2>
            <p className="text-xs text-gray-500">Your interest is stored in this browser session only. This demo cannot send SMS or nearby donor alerts. A licensed blood bank must assess donor eligibility.</p>

            {donorRegistered ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-2">
                <CheckCircle size={32} className="text-emerald-600 mx-auto" />
                <h3 className="font-bold text-sm text-emerald-900">Interest Saved for This Session</h3>
                <p className="text-xs text-emerald-800">
                  Thank you, <strong>{donorName}</strong> ({donorGroup}). No donor alerts are sent by this demo; contact a licensed blood bank to complete registration.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegisterDonor} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Blood Group</label>
                    <select
                      value={donorGroup}
                      onChange={(e) => setDonorGroup(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-rose-700"
                    >
                      {BLOOD_GROUPS.filter((g) => g !== "All").map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" required defaultChecked className="rounded text-rose-600" />
                    <span className="text-[11px] text-gray-600">
                      I consent to saving this donor interest in this browser session. This is not medical clearance or a confirmed registration with a blood bank.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-xs mt-2"
                >
                  Join Life Saver Network
                </button>
              </form>
            )}
          </div>

          {/* Blood Compatibility Guide */}
          <div className="bg-gray-50 rounded-3xl border border-gray-200 p-5 space-y-3 text-xs">
            <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
              <Info size={14} className="text-blue-600" /> Blood Compatibility Guide
            </h3>
            <div className="space-y-2 text-[11px] text-gray-600">
              <div className="p-2 bg-white rounded-xl border border-gray-200">
                <p className="font-bold text-rose-700">O Negative (O-)</p>
                <p>Sometimes used for emergency red-cell transfusion. A blood bank must confirm compatibility and cross-match.</p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-gray-200">
                <p className="font-bold text-blue-700">AB Positive (AB+)</p>
                <p>May receive red cells across ABO/Rh groups, subject to clinician and blood-bank testing.</p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-gray-200">
                <p className="font-bold text-emerald-700">Platelets &amp; Plasma</p>
                <p>Eligibility and donation intervals vary by component and donor; follow licensed blood-bank guidance.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── DONATE CONFIRMATION MODAL ────────────────────────────────────────── */}
      {donateModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  {donateModalRequest.bloodGroup}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Confirm Donation Response</h3>
                  <p className="text-[11px] text-gray-500">{donateModalRequest.hospital}</p>
                </div>
              </div>
              <button
                onClick={() => setDonateModalRequest(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {donationConfirmed ? (
              <div className="text-center py-4 space-y-3">
                <CheckCircle size={40} className="text-emerald-600 mx-auto" />
                <h4 className="font-bold text-base text-gray-900">Thank You, Hero!</h4>
                <p className="text-xs text-gray-600">
                  {sharedFeedConnected ? "Your response is visible in the signed-in feed, but no alert was sent. Call the hospital contact to confirm the request and ask the blood bank to assess donor eligibility." : "Your interest is noted in this session only; no alert was sent. Call the hospital contact to confirm the request and ask the blood bank to assess donor eligibility."}
                </p>
                {donateModalRequest.contactPhone ? (
                  <>
                    <div className="bg-gray-100 p-3 rounded-xl font-mono text-xs font-bold text-gray-800">Contact: {donateModalRequest.contactPhone}</div>
                    <a href={`tel:${donateModalRequest.contactPhone}`} className="block w-full rounded-xl bg-rose-600 py-2.5 text-center text-xs font-bold text-white">Call the request contact</a>
                  </>
                ) : <p className="rounded-xl bg-gray-100 p-3 text-xs text-gray-600">This sample entry has no contact details. Do not rely on it for an actual donation.</p>}
                <button
                  onClick={() => setDonateModalRequest(null)}
                  className="w-full bg-rose-600 text-white font-bold py-2.5 rounded-xl text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-gray-600">
                  You are responding to an urgent request for <strong>{donateModalRequest.patientName}</strong> requiring{" "}
                  <strong>{donateModalRequest.unitsNeeded} units of {donateModalRequest.bloodGroup} {donateModalRequest.component}</strong>.
                </p>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 space-y-1">
                  <p className="font-bold">Quick Donor Screening Checklist:</p>
                  <p>• Age 18–65, weight ≥ 50kg</p>
                  <p>• No alcohol in the past 24 hours</p>
                  <p>• At least 90 days since your last whole blood donation</p>
                </div>

                {donationError && <p role="alert" className="text-xs font-semibold text-red-600">{donationError}</p>}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleConfirmDonation}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-xs shadow-xs"
                  >
                    I Meet Criteria &amp; Will Donate
                  </button>
                  <button
                    onClick={() => setDonateModalRequest(null)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-3 rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
