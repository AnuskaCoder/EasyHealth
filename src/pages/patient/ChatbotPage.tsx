import React, { useState, useRef, useEffect } from "react";
import {
  Send, Bot, Sparkles, BookOpen, ShieldCheck,
  ChevronRight, Activity, X, AlertTriangle,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { ChatMessage } from "../../types";
import { processClinicalQuery } from "../../services/clinicalAiEngine";

// ─── Inline bold/italic renderer ─────────────────────────────────────────────
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={i}>{p.slice(2, -2)}</strong>
          : <React.Fragment key={i}>{p}</React.Fragment>
      )}
    </>
  );
}

// ─── Full markdown renderer ───────────────────────────────────────────────────
function renderMarkdown(content: string) {
  return content.split("\n").map((line, i) => {
    // H3 heading
    if (line.startsWith("### ")) {
      return (
        <p key={i} className="font-black text-sm text-gray-900 pb-1 pt-0.5 border-b border-gray-100 mb-2">
          {renderInline(line.replace(/^###\s+/, ""))}
        </p>
      );
    }
    // Bold heading line
    if (/^\*\*[^*]+\*\*:?\s*$/.test(line.trim())) {
      return (
        <p key={i} className="font-bold text-gray-800 mt-2 mb-0.5">
          {renderInline(line)}
        </p>
      );
    }
    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      return (
        <div key={i} className="flex gap-1.5 ml-1 mb-0.5">
          <span className="font-bold text-blue-600 flex-shrink-0 min-w-[1.2rem]">
            {line.match(/^(\d+)\./)?.[1]}.
          </span>
          <span>{renderInline(line.replace(/^\d+\.\s+/, ""))}</span>
        </div>
      );
    }
    // Bullet list
    if (/^[•\-\*]\s/.test(line) || line.startsWith("- ")) {
      return (
        <div key={i} className="flex gap-1.5 ml-1 mb-0.5">
          <span className="text-blue-500 flex-shrink-0 mt-0.5">•</span>
          <span>{renderInline(line.replace(/^[•\-\*]\s+/, "").replace(/^-\s+/, ""))}</span>
        </div>
      );
    }
    // Warning/success lines
    if (/^⚠️|^✅|^❌|^🚨|^🔴/.test(line)) {
      return (
        <div key={i} className={`text-xs leading-relaxed mb-1 p-2 rounded-lg ${
          /^🚨|^⚠️/.test(line) ? "bg-amber-50 text-amber-900 border border-amber-200" : "bg-green-50 text-green-900 border border-green-200"
        }`}>
          {renderInline(line)}
        </div>
      );
    }
    // Blank line
    if (line.trim() === "") return <div key={i} className="h-1.5" />;
    // Normal paragraph
    return <p key={i} className="mb-0.5 leading-relaxed">{renderInline(line)}</p>;
  });
}

// ─── Dynamic quick prompts based on patient data ──────────────────────────────
function buildQuickPrompts(profile: any, medications: any[], reports: any[] = []): string[] {
  const prompts: string[] = ["Give me my health summary"];

  if (reports.length > 0) prompts.push("Explain my latest blood test results");

  if (profile?.chronicConditions?.some((c: string) => /asthma/i.test(c))) {
    prompts.push("How am I managing my asthma?");
  }
  if (profile?.chronicConditions?.some((c: string) => /diabetes/i.test(c))) {
    prompts.push("How is my blood sugar control?");
  }
  if (profile?.allergies?.some((a: string) => /penicillin/i.test(a))) {
    prompts.push("Is amoxicillin safe for me?");
  }
  const lowStock = medications.find((m: any) => m.stock <= 10);
  if (lowStock) prompts.push(`I'm running low on ${lowStock.name}`);

  prompts.push(
    "I have a fever of 102°F — what should I do?",
    "What foods should I eat for my health?",
    "I have a headache — what helps?",
    "Check if my medications are safe together",
    "I have stomach pain and acidity"
  );
  return [...new Set(prompts)].slice(0, 6);
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const ChatbotPage: React.FC = () => {
  const { patientProfile, reports, medications, appointments, setCurrentPage } = useApp();

  const firstName = patientProfile?.name ? patientProfile.name.split(" ")[0] : "there";

  // Build welcome message from actual patient data
  const buildWelcome = (): ChatMessage => {
    const hb = reports
      .flatMap(r => r.biomarkers || [])
      .find(b => /hemoglobin/i.test(b.parameter));
    const nextAppt = appointments.find(a => a.status === "upcoming");
    const lowMed = medications.find(m => m.stock <= 10);

    const lines: string[] = [];
    if (hb) lines.push(`• **Hemoglobin:** ${hb.value} ${hb.unit} (${hb.status})`);
    if (nextAppt) lines.push(`• **Next appointment:** ${nextAppt.doctorName} — ${nextAppt.date} at ${nextAppt.time}`);
    if (lowMed) lines.push(`• ⚠️ **Low stock:** ${lowMed.name} — only ${lowMed.stock} tablets left`);
    if (profile?.chronicConditions?.length) lines.push(`• **Conditions:** ${profile.chronicConditions.join(", ")}`);
    if (profile?.allergies?.length) lines.push(`• **Allergies:** ${profile.allergies.join(", ")}`);

    return {
      id: "welcome",
      role: "bot",
      content: `### Hello ${firstName}! 👋 I'm your EasyHealth AI

I'm grounded in guidelines from **WHO, AHA, ADA, GINA, and ICMR** and connected to your health records.

**Your current health snapshot:**
${lines.length ? lines.join("\n") : "• No records loaded yet — ask me anything!"}

Type any question below — symptoms, lab results, medications, diet, or when to see a doctor. I'll give you a **personalised answer based on your data**, not generic advice.`,
      timestamp: new Date(),
      sources: [{
        title: "EasyHealth Clinical AI",
        authority: "Patient EHR Integration",
        quote: `Profile: ${patientProfile?.name || "Guest"}, ${patientProfile?.age || "—"} yrs, Blood Group ${patientProfile?.bloodGroup || "—"}.`,
      }],
      suggestedActions: buildQuickPrompts(patientProfile, medications, reports).slice(0, 4).map(p => ({
        label: p, action: "prompt", page: undefined,
      })),
    };
  };

  const profile = patientProfile;
  const [messages, setMessages] = useState<ChatMessage[]>([buildWelcome()]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    // Add user bubble
    setMessages(prev => [...prev, {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    }]);
    setInputText("");
    setLoading(true);

    // Run clinical engine with 600–1200ms delay (feels natural)
    const delay = 600 + Math.random() * 600;
    setTimeout(() => {
      try {
        const result = processClinicalQuery(trimmed, {
          profile: patientProfile,
          reports,
          medications,
        });

        setMessages(prev => [...prev, {
          id: `b-${Date.now()}`,
          role: "bot",
          content: result.answer,
          timestamp: new Date(),
          sources: result.sources,
          suggestedActions: result.suggestedActions,
        }]);
      } catch (err) {
        setMessages(prev => [...prev, {
          id: `b-err-${Date.now()}`,
          role: "bot",
          content: `### Something went wrong\n\nI encountered an error processing your query. Please try rephrasing your question.`,
          timestamp: new Date(),
          sources: [],
          suggestedActions: [{ label: "Try again", action: "prompt" }],
        }]);
      }
      setLoading(false);
    }, delay);
  };

  const handleAction = (action: string, page?: string, label?: string) => {
    if (page) { setCurrentPage(page); return; }
    // Named navigation actions
    const navMap: Record<string, string> = {
      records: "records", pharmacy: "pharmacy", labs: "labs",
      "lab-tests": "labs", doctors: "find-doctors", appointments: "appointments",
      profile: "profile", emergency: "emergency",
    };
    if (navMap[action]) { setCurrentPage(navMap[action]); return; }
    // Send the button label as a conversational message
    if (label && label !== action) {
      sendMessage(label);
      return;
    }
    // Map action codes to natural language queries
    const queryMap: Record<string, string> = {
      health_summary: "Give me my health summary",
      prompt: label || "Tell me more about my health",
      interaction_check: "Are my current medications safe to take together?",
      diet_sugar: "What should I eat to control my blood sugar?",
      symptom: "I want to do a symptom assessment",
    };
    sendMessage(queryMap[action] || label || "Tell me more");
  };

  const quickPrompts = buildQuickPrompts(patientProfile, medications, reports);

  return (
    <div className="flex flex-col h-[calc(100vh-125px)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-3.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-sm">EasyHealth Clinical AI</h1>
              <span className="bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck size={10} /> WHO · AHA · ICMR
              </span>
            </div>
            <p className="text-xs text-blue-200">Personalised with your health records · medications · allergies</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-xl text-xs border border-white/20">
          <Activity size={12} className="text-emerald-300" />
          <span className="font-semibold">{firstName}</span>
        </div>
      </div>

      {/* Proactive banner */}
      {medications.some(m => m.stock <= 10) && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-amber-800">
            <Sparkles size={14} className="text-amber-500 flex-shrink-0" />
            <span>
              <strong>Low stock:</strong>{" "}
              {medications.filter(m => m.stock <= 10).map(m => `${m.name} (${m.stock} left)`).join(", ")}
            </span>
          </div>
          <button
            onClick={() => setCurrentPage("pharmacy")}
            className="text-blue-600 text-xs font-bold whitespace-nowrap ml-2 hover:underline"
          >
            Refill →
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/40">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>

            {/* Bot avatar */}
            {msg.role === "bot" && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                <Bot size={16} />
              </div>
            )}

            <div className="max-w-[88%] space-y-2">
              {/* Chat bubble */}
              <div className={`rounded-2xl px-4 py-3 shadow-sm text-xs ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-sm"
                  : "bg-white border border-gray-200 rounded-tl-sm text-gray-800"
              }`}>
                {msg.role === "user"
                  ? <p className="leading-relaxed">{msg.content}</p>
                  : <div>{renderMarkdown(msg.content)}</div>
                }

                {/* RAG Sources */}
                {msg.role === "bot" && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-gray-100 space-y-1.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <BookOpen size={10} className="text-blue-500" /> Cited Sources
                    </p>
                    {msg.sources.map((src, i) => (
                      <div key={i} className="bg-blue-50 border border-blue-100 rounded-xl p-2 text-[11px]">
                        <div className="flex justify-between items-start gap-2 mb-0.5">
                          <span className="font-semibold text-blue-900 leading-tight">{src.title}</span>
                          <span className="text-blue-500 text-[10px] flex-shrink-0">{src.authority}</span>
                        </div>
                        <p className="italic text-gray-600 leading-tight">"{src.quote}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {msg.role === "bot" && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {msg.suggestedActions.map((act, i) => (
                    <button
                      key={i}
                      onClick={() => handleAction(act.action, act.page, act.label)}
                      className="bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                    >
                      {act.label} <ChevronRight size={11} />
                    </button>
                  ))}
                </div>
              )}

              {/* Timestamp */}
              <p className="text-[10px] text-gray-400 px-1">
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>

            {/* User avatar */}
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-1 font-bold text-xs">
                {firstName.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-2.5 items-start">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 shadow-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">Analysing your health records...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts + Input bar */}
      <div className="p-3 bg-white border-t border-gray-100 space-y-2 flex-shrink-0">
        {/* Quick prompt pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {quickPrompts.map(prompt => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              disabled={loading}
              className="whitespace-nowrap bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-600 px-3 py-1.5 rounded-full border border-gray-200 transition-colors text-[11px] font-medium disabled:opacity-50 flex-shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={e => { e.preventDefault(); sendMessage(inputText); }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Ask about symptoms, your reports, medications, diet..."
            className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            disabled={loading}
            autoComplete="off"
          />
          {inputText && (
            <button
              type="button"
              onClick={() => setInputText("")}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X size={15} />
            </button>
          )}
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow"
          >
            <Send size={16} />
          </button>
        </form>

        <p className="text-[10px] text-gray-400 text-center">
          For emergencies call <strong>112 / 108</strong>. AI guidance supplements, not replaces, professional medical advice.
        </p>
      </div>
    </div>
  );
};
