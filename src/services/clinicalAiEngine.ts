import { PatientProfile, MedicalReport, Medication, BiomarkerResult, RAGSource } from "../types";

export interface ClinicalResponse {
  answer: string;
  sources: RAGSource[];
  suggestedActions: { label: string; action: string; page?: string }[];
  isEmergency?: boolean;
  category: string;
}

interface PatientContext {
  profile: PatientProfile;
  reports: MedicalReport[];
  medications: Medication[];
}

// ─── Knowledge base citations ─────────────────────────────────────────────────
const KB: Record<string, RAGSource> = {
  who_iron:    { title: "WHO Iron Supplementation Guidelines", authority: "World Health Organization", quote: "Daily elemental iron (30–60 mg) for adult females with mild-moderate anemia. Vitamin C increases non-heme iron absorption by 200–300%. Avoid tea/coffee within 60 min of iron doses." },
  aha_bp:      { title: "AHA/ACC 2024 Cardiovascular Guidelines", authority: "American Heart Association", quote: "Normal BP <120/80 mmHg. Stage 1 hypertension 130–139/80–89. DASH diet and 150 min/week aerobic exercise are first-line non-pharmacological interventions." },
  ada_diabetes:{ title: "ADA Standards of Medical Care 2024", authority: "American Diabetes Association", quote: "Fasting glucose ≥126 mg/dL or HbA1c ≥6.5% = diabetes. For hypoglycemia (<70 mg/dL): 15g fast-acting carbs, recheck in 15 min." },
  gina_asthma: { title: "GINA Global Asthma Strategy 2024", authority: "Global Initiative for Asthma", quote: "Montelukast taken nightly reduces nocturnal bronchospasm. NSAIDs may trigger AERD in 10–20% of asthmatics." },
  who_fever:   { title: "WHO Acute Febrile Illness Management", authority: "World Health Organization", quote: "Paracetamol (10–15 mg/kg per dose, max 4g/day) is first-choice antipyretic. NSAIDs contraindicated in suspected dengue." },
  ihs_headache:{ title: "IHS Headache Classification ICHD-3", authority: "International Headache Society", quote: "Red flags (SNOOP): Sudden thunderclap, Neurological deficit, Older age, Pattern change — require urgent neuroimaging." },
  acg_gastro:  { title: "ACG GERD Management Guidelines", authority: "American College of Gastroenterology", quote: "PPIs most effective 30–45 min before the first meal. Avoid lying down within 3 hours of eating." },
  kdigo_renal: { title: "KDIGO CKD Guidelines", authority: "Kidney Disease Improving Global Outcomes", quote: "eGFR >90 = normal. Proteinuria is earliest kidney injury marker. 2–3L daily fluid intake supports tubular clearance." },
  ata_thyroid: { title: "ATA Hypothyroidism Guidelines", authority: "American Thyroid Association", quote: "TSH >4.5 mIU/L with low free T4 = hypothyroidism. Levothyroxine taken fasting 30–60 min before breakfast." },
  who_mh:      { title: "WHO Mental Health Action Plan", authority: "World Health Organization", quote: "CBT, aerobic exercise, and sleep hygiene are first-line for mild-moderate anxiety/depression. Seek help if symptoms persist >2 weeks." },
  acr_msk:     { title: "ACR Musculoskeletal Pain Guidelines", authority: "American College of Rheumatology", quote: "Acute low back pain: early mobilization beats bed rest. Paracetamol or short-course NSAIDs are first-line." },
  aad_derm:    { title: "AAD Dermatology Guidelines", authority: "American Academy of Dermatology", quote: "Fragrance-free emollients immediately post-bathing restore skin barrier. Topical corticosteroids only under dermatological guidance." },
  aasm_sleep:  { title: "AASM Insomnia Guidelines", authority: "American Academy of Sleep Medicine", quote: "CBT-I is first-line for chronic insomnia — superior to medication. Consistent wake time anchors circadian rhythm." },
  wao_allergy: { title: "WAO Anaphylaxis Guidelines", authority: "World Allergy Organization", quote: "Penicillin-class antibiotics are absolutely contraindicated in confirmed penicillin allergy. Safe alternatives: Azithromycin, Doxycycline, Ciprofloxacin." },
  aha_emergency:{ title: "AHA Emergency Cardiovascular Care", authority: "American Heart Association", quote: "Chest pain + left arm/jaw radiation + diaphoresis = suspected ACS. 12-lead ECG within 10 min. FAST stroke criteria: immediate transport for thrombolysis within 4.5-hour window." },
  icmr_diet:   { title: "ICMR-NIN Dietary Guidelines for Indians 2024", authority: "National Institute of Nutrition", quote: "Balanced diet: whole grains, legumes, green leafy vegetables, nuts. Added sugar <5% calories. Sodium <5g/day." },
};

// ─── Patient data helpers ─────────────────────────────────────────────────────
function getAllBiomarkers(reports: MedicalReport[]): BiomarkerResult[] {
  return reports.flatMap(r => r.biomarkers || []);
}

function findBiomarker(reports: MedicalReport[], ...keywords: string[]): BiomarkerResult | null {
  const all = getAllBiomarkers(reports);
  for (const kw of keywords) {
    const hit = all.find(b => b.parameter.toLowerCase().includes(kw.toLowerCase()));
    if (hit) return hit;
  }
  return null;
}

function getLatestReport(reports: MedicalReport[], ...typeKeywords: string[]): MedicalReport | null {
  const sorted = [...reports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  for (const kw of typeKeywords) {
    const hit = sorted.find(r =>
      r.type.toLowerCase().includes(kw.toLowerCase()) ||
      r.name.toLowerCase().includes(kw.toLowerCase()) ||
      r.tags.some(t => t.toLowerCase().includes(kw.toLowerCase()))
    );
    if (hit) return hit;
  }
  return null;
}

function getMedication(meds: Medication[], ...keywords: string[]): Medication | null {
  for (const kw of keywords) {
    const hit = meds.find(m => m.name.toLowerCase().includes(kw.toLowerCase()));
    if (hit) return hit;
  }
  return null;
}

function getLowStockMeds(meds: Medication[]): Medication[] {
  return meds.filter(m => m.stock <= 10);
}

function bmiLabel(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

function statusEmoji(status: string): string {
  switch (status) {
    case "Normal": return "✅";
    case "Low": return "⬇️";
    case "High": return "⬆️";
    case "Critical": return "🚨";
    default: return "📊";
  }
}

// ─── Main engine ──────────────────────────────────────────────────────────────
export function processClinicalQuery(rawQuery: string, ctx: PatientContext): ClinicalResponse {
  const q = rawQuery.trim();
  const lower = q.toLowerCase();
  const { profile, reports, medications } = ctx;
  const name = profile?.name ? profile.name.split(" ")[0] : "there";
  const bm = getAllBiomarkers(reports);

  // ── 1. EMERGENCY TRIAGE (always first) ──────────────────────────────────────
  const isCardiacEmergency = /chest pain|chest pressure|heart attack|chest tight/.test(lower) &&
    /radiat|left arm|jaw|neck|sweat|breathless|severe|crush/.test(lower);
  const isStroke = /stroke|facial droop|face droop|arm weak|slurred|can.t speak|sudden numb/.test(lower);
  const isThunderclap = /thunderclap|worst headache of my life|explosive head/.test(lower);
  const isUnconscious = /unconscious|not breathing|no pulse|passed out|overdose/.test(lower);

  if (isCardiacEmergency || isStroke || isThunderclap || isUnconscious) {
    const specific = isCardiacEmergency
      ? "The symptoms you described — chest pain radiating with sweating or breathlessness — match **Acute Coronary Syndrome (Heart Attack)**. Every minute without treatment causes permanent heart muscle damage."
      : isStroke
      ? "Sudden face drooping, arm weakness, or slurred speech are the **FAST warning signs of a stroke**. Clot-dissolving medication must be given within **4.5 hours** of onset."
      : isThunderclap
      ? "A headache that reaches peak intensity within 60 seconds ('thunderclap') must be evaluated for **subarachnoid hemorrhage** with an urgent CT scan."
      : "Loss of consciousness or absent pulse requires **immediate CPR and emergency services**.";

    return {
      category: "Emergency",
      isEmergency: true,
      answer: `### 🚨 CALL 108 / 112 RIGHT NOW

${specific}

**While waiting for help:**
- Do not drive yourself
- Sit or lie down, loosen tight clothing
- Tell someone nearby what is happening`,
      sources: [KB.aha_emergency],
      suggestedActions: [{ label: "Find Nearest Emergency Hospital", action: "emergency", page: "emergency" }],
    };
  }

  // ── 2. DRUG ALLERGY CHECK ───────────────────────────────────────────────────
  const hasPenicillinAllergy = profile?.allergies?.some(a => /penicillin/i.test(a));
  const asksPenicillin = /amoxicillin|penicillin|augmentin|ampicillin|moxclav|clavulanic|amox/i.test(lower);

  if (hasPenicillinAllergy && asksPenicillin) {
    return {
      category: "Drug Allergy — Contraindication",
      isEmergency: true,
      answer: `### 🚨 DRUG ALLERGY — DO NOT TAKE THIS MEDICATION

${name}, your profile records a **Penicillin allergy**.

The antibiotic you asked about belongs to the **beta-lactam penicillin class** and is **contraindicated** for you. Taking it risks:
- **Anaphylaxis** — airway closure, severe BP drop, life-threatening
- Severe hives, facial/throat swelling (angioedema)
- Serum sickness reaction

**What to do:**
- Tell your doctor about this allergy before taking any antibiotic
- Safe alternatives (doctor decides based on infection): Azithromycin, Doxycycline, Clarithromycin, or Ciprofloxacin
- If you accidentally took one and feel throat tightening or difficulty breathing — **call 108 immediately**`,
      sources: [KB.wao_allergy],
      suggestedActions: [
        { label: "View My Profile & Allergies", action: "profile", page: "profile" },
        { label: "Book a Doctor Consultation", action: "doctors", page: "find-doctors" },
      ],
    };
  }

  // NSAID + Asthma check
  const hasAsthma = profile?.chronicConditions?.some(c => /asthma/i.test(c));
  const asksNsaid = /ibuprofen|aspirin|combiflam|diclofenac|naproxen|brufen/i.test(lower);

  if (hasAsthma && asksNsaid) {
    return {
      category: "Drug-Condition Interaction",
      answer: `### ⚠️ Caution: NSAIDs & Your Asthma

${name}, your records show **${profile.chronicConditions?.find(c => /asthma/i.test(c))}**.

Up to **20% of people with asthma** experience **AERD** (Aspirin-Exacerbated Respiratory Disease) — NSAIDs like Ibuprofen, Aspirin, Combiflam, and Diclofenac can trigger bronchospasm by shifting leukotriene pathways. Your Montelukast specifically works against this same pathway.

**Safer alternative for pain or fever:**
- **Paracetamol 500mg or 650mg** every 6–8 hours — well tolerated in asthma

If you have already taken an NSAID and notice wheezing or chest tightness, use your rescue inhaler and seek care promptly.`,
      sources: [KB.gina_asthma],
      suggestedActions: [
        { label: "Order Paracetamol from Pharmacy", action: "pharmacy", page: "pharmacy" },
        { label: "Consult Pulmonologist", action: "doctors", page: "find-doctors" },
      ],
    };
  }

  // ── 2b. DIABETES / BLOOD SUGAR (general question, not report explain) ────────
  if (/diabetes|blood sugar is|sugar level|hba1c|metformin|insulin|hyperglycemia|hypoglycemia|glucose level/.test(lower) && !(/explain|my report|my test result|my blood test/).test(lower)) {
    const glucoseBm = findBiomarker(reports, "glucose", "sugar", "hba1c");
    const glucoseNote = glucoseBm
      ? `\nYour recorded **${glucoseBm.parameter}: ${glucoseBm.value} ${glucoseBm.unit}** (${glucoseBm.status}).`
      : "";
    return {
      category: "Diabetes & Blood Sugar",
      answer: `### 🔬 Blood Sugar & Diabetes Guidance
${glucoseNote}

**Key thresholds to know:**
- **Fasting glucose:** Normal 70–99 mg/dL · Pre-diabetes 100–125 · Diabetes ≥126
- **HbA1c:** Normal <5.7% · Pre-diabetes 5.7–6.4% · Diabetes ≥6.5%
- **Postprandial (2hr after food):** Target <140 mg/dL

**If blood sugar is high:**
- Reduce refined carbs and sugary drinks
- Eat low-glycemic foods: whole grains, legumes, non-starchy vegetables
- Exercise 30 min/day — improves insulin sensitivity significantly
- Never skip meals if on insulin or sulphonylureas

**If on Metformin:** Always take it **with or just after food** — reduces nausea and GI side effects.

**Hypoglycemia emergency (sugar <70 mg/dL — shaking, cold sweat, confusion):**
Immediately eat **15g fast-acting carbs** (half cup juice, 3 tsp sugar, glucose tablets), wait 15 min, recheck. Repeat if still <70. This is the "Rule of 15."`,
      sources: [KB.ada_diabetes],
      suggestedActions: [
        { label: "Book HbA1c Home Test", action: "labs", page: "labs" },
        { label: "Consult Endocrinologist", action: "doctors", page: "find-doctors" },
      ],
    };
  }

  // ── 2c. CARDIAC / CHOLESTEROL / BP (general question) ─────────────────────
  if (/cholesterol is|cholesterol level|high cholesterol|reduce cholesterol|blood pressure is|bp is|hypertension|heart health|cardiac/.test(lower) && !/explain|my report/.test(lower)) {
    const cholBm = findBiomarker(reports, "cholesterol");
    const bpNote = "";
    return {
      category: "Cardiovascular Health",
      answer: `### ❤️ Heart Health & Cholesterol Guidance
${cholBm ? `\nYour recorded **Total Cholesterol: ${cholBm.value} ${cholBm.unit}** (${cholBm.status}).` : ""}

**Target values (AHA 2024):**
- Total Cholesterol: <200 mg/dL ✅
- LDL ("bad"): <100 mg/dL
- HDL ("good"): >50 mg/dL (women) / >40 mg/dL (men)
- Triglycerides: <150 mg/dL
- Blood Pressure: <120/80 mmHg

**To lower high cholesterol naturally:**
1. **Diet:** DASH pattern — oats, barley, fruits, vegetables, nuts; limit saturated fat (<7% calories) and sodium (<2g/day)
2. **Exercise:** 150 min/week moderate aerobic activity (brisk walking, cycling, swimming)
3. **Avoid:** Trans fats, processed meats, full-fat dairy, excessive alcohol
4. **Omega-3:** Fish (salmon, sardines) or flaxseeds reduce triglycerides

**When to see a cardiologist:**
- BP consistently above 140/90 despite lifestyle changes
- LDL above 160 mg/dL
- Family history of early heart disease`,
      sources: [KB.aha_bp],
      suggestedActions: [
        { label: "Book Lipid Profile Home Test", action: "labs", page: "labs" },
        { label: "Consult Cardiologist", action: "doctors", page: "find-doctors" },
      ],
    };
  }

  // ── 3. EXPLAIN A SPECIFIC REPORT ────────────────────────────────────────────
  const asksReport = /explain|what does|what is|interpret|understand|my report|my test|my result|my scan|my x.?ray|my blood|what does.*mean/.test(lower);
  const mentionsCBC = /cbc|blood count|haemoglobin|hemoglobin|wbc|platelet|rbc/.test(lower);
  const mentionsLipid = /lipid|cholesterol|ldl|hdl|triglyceride/.test(lower);
  const mentionsThyroid = /thyroid|tsh|t3|t4/.test(lower);
  const mentionsUrine = /urine|urinalysis/.test(lower);
  const mentionsXray = /x.?ray|chest.*scan|radiol/.test(lower);
  const mentionsSugar = /sugar|glucose|hba1c|diabetic|diabetes/.test(lower);

  if ((asksReport && (mentionsCBC || mentionsLipid || mentionsThyroid || mentionsUrine || mentionsSugar)) ||
      (mentionsCBC && !lower.includes("what is") && reports.length > 0) ||
      (mentionsLipid && asksReport) ||
      (mentionsThyroid && asksReport) ||
      (mentionsSugar && asksReport)) {
    // Build a fully dynamic answer from the user's actual report data
    let relevantBiomarkers: BiomarkerResult[] = [];
    let reportRef: MedicalReport | null = null;
    let reportLabel = "your report";

    if (mentionsCBC || (asksReport && !mentionsLipid && !mentionsThyroid && !mentionsSugar)) {
      reportRef = getLatestReport(reports, "blood", "cbc", "haematology");
      relevantBiomarkers = bm.filter(b =>
        /hemoglobin|hb|wbc|rbc|platelet|mcv|mch|mchc|rdw|hematocrit|lymphocyte|neutrophil|eosinophil/i.test(b.parameter)
      );
      reportLabel = "blood count";
    } else if (mentionsLipid) {
      reportRef = getLatestReport(reports, "lipid", "cholesterol");
      relevantBiomarkers = bm.filter(b => /cholesterol|ldl|hdl|triglyceride|vldl/i.test(b.parameter));
      reportLabel = "lipid profile";
    } else if (mentionsThyroid) {
      reportRef = getLatestReport(reports, "thyroid", "tsh");
      relevantBiomarkers = bm.filter(b => /tsh|t3|t4|thyroid/i.test(b.parameter));
      reportLabel = "thyroid panel";
    } else if (mentionsSugar) {
      reportRef = getLatestReport(reports, "glucose", "sugar", "hba1c", "diabetes");
      relevantBiomarkers = bm.filter(b => /glucose|hba1c|sugar|insulin/i.test(b.parameter));
      reportLabel = "blood sugar";
    } else if (mentionsUrine) {
      reportRef = getLatestReport(reports, "urine");
      relevantBiomarkers = bm.filter(b => /urine|pus|rbc.*urine|protein|albumin|glucose.*urine/i.test(b.parameter));
      reportLabel = "urine examination";
    }

    if (relevantBiomarkers.length > 0) {
      const abnormal = relevantBiomarkers.filter(b => b.status !== "Normal");
      const normal = relevantBiomarkers.filter(b => b.status === "Normal");

      const lines: string[] = [];
      lines.push(`### 🔬 Your ${reportLabel.charAt(0).toUpperCase() + reportLabel.slice(1)} Results`);
      if (reportRef) lines.push(`**From:** ${reportRef.uploadedBy} · ${reportRef.date}`);
      lines.push("");

      relevantBiomarkers.forEach(b => {
        lines.push(`${statusEmoji(b.status)} **${b.parameter}:** ${b.value} ${b.unit} *(Ref: ${b.referenceRange})*`);
        if (b.explanation) lines.push(`   → ${b.explanation}`);
      });

      lines.push("");
      if (abnormal.length === 0) {
        lines.push("✅ **All parameters are within normal range.** Great result — maintain your current diet and lifestyle.");
      } else {
        lines.push(`⚠️ **${abnormal.length} value${abnormal.length > 1 ? "s" : ""} outside normal range:**`);
        abnormal.forEach(b => {
          lines.push(`- **${b.parameter}** is **${b.status.toLowerCase()}** at ${b.value} ${b.unit}`);
        });
        lines.push("");
        lines.push("Discuss these with your doctor at your next visit. This report is for information only — do not change medications without medical advice.");
      }

      return {
        category: "Report Explanation",
        answer: lines.join("\n"),
        sources: mentionsCBC ? [KB.who_iron] : mentionsLipid ? [KB.aha_bp] : mentionsThyroid ? [KB.ata_thyroid] : [],
        suggestedActions: [
          { label: "View Full Reports", action: "records", page: "records" },
          { label: "Book Follow-up Appointment", action: "doctors", page: "find-doctors" },
          { label: "Ask about treatment options", action: "prompt" },
        ],
      };
    } else if (reports.length === 0) {
      return {
        category: "Report Explanation",
        answer: `### 📋 No Reports Found

${name}, I don't see any uploaded medical reports in your profile yet.

To explain your results, please:
1. Go to **Medical Records** and upload your report (PDF or photo)
2. Or use **Add with Values** to manually enter your test results
3. I'll then give you a detailed explanation of every parameter`,
        sources: [],
        suggestedActions: [
          { label: "Upload a Report", action: "records", page: "records" },
          { label: "Add Test Values Manually", action: "records", page: "records" },
        ],
      };
    }
  }

  // ── 4. MEDICATION QUESTIONS ──────────────────────────────────────────────────
  const asksMedication = /medicine|medication|tablet|capsule|drug|dose|dosage|side effect|interaction|can i take|is it safe|should i take/i.test(lower);
  const mentionsSpecificMed = medications.find(m => lower.includes(m.name.toLowerCase().split(" ")[0].toLowerCase()));

  if (asksMedication || mentionsSpecificMed) {
    if (medications.length === 0) {
      return {
        category: "Medication",
        answer: `### 💊 No Medications on Record

${name}, I don't see any active medications in your profile yet.

If you have a prescription, your doctor can upload it directly, or you can add medications manually in your profile.`,
        sources: [],
        suggestedActions: [{ label: "View My Profile", action: "profile", page: "profile" }],
      };
    }

    const lowStock = getLowStockMeds(medications);
    const lines: string[] = [];
    lines.push(`### 💊 Your Medication Review`);
    lines.push(`You currently have **${medications.length} active medication${medications.length > 1 ? "s" : ""}** on record:`);
    lines.push("");

    medications.forEach(med => {
      lines.push(`**${med.name}** (${med.dosage})`);
      lines.push(`- Frequency: ${med.frequency}`);
      lines.push(`- Prescribed by: ${med.prescribedBy}`);
      lines.push(`- Take: ${med.times.join(", ")}`);
      if (med.instructions) lines.push(`- Note: ${med.instructions}`);
      lines.push(`- Stock: ${med.stock <= 10 ? `⚠️ **${med.stock} left — refill soon**` : `✅ ${med.stock} remaining`}`);
      lines.push("");
    });

    if (asksNsaid && hasAsthma) {
      lines.push("⚠️ **Important:** Avoid Ibuprofen/Aspirin with your asthma. Use Paracetamol for pain relief.");
    }

    if (lowStock.length > 0) {
      lines.push(`⚠️ **Low stock alert:** ${lowStock.map(m => m.name).join(", ")} — order a refill before you run out.`);
    }

    return {
      category: "Medication Review",
      answer: lines.join("\n"),
      sources: [],
      suggestedActions: [
        ...(lowStock.length > 0 ? [{ label: "Refill from Pharmacy", action: "pharmacy", page: "pharmacy" }] : []),
        { label: "Check Drug Interactions", action: "doctors", page: "find-doctors" },
      ],
    };
  }

  // ── 5. HEALTH SUMMARY ────────────────────────────────────────────────────────
  if (/my health|health summary|overall health|health status|health score|how am i doing|how is my health/.test(lower)) {
    const hb = findBiomarker(reports, "hemoglobin", "hb");
    const chol = findBiomarker(reports, "total cholesterol", "cholesterol");
    const glucose = findBiomarker(reports, "fasting blood glucose", "fasting glucose", "glucose");
    const tsh = findBiomarker(reports, "tsh", "thyroid");
    const bmiVal = profile.height && profile.weight
      ? (profile.weight / ((profile.height / 100) ** 2))
      : null;
    const lowStock = getLowStockMeds(medications);

    const lines: string[] = [];
    lines.push(`### 📋 Your Health Summary`);
    lines.push(`**${name}** · ${profile.age} yrs · ${profile.gender} · Blood Group: ${profile.bloodGroup}`);
    if (bmiVal) lines.push(`**BMI:** ${bmiVal.toFixed(1)} (${bmiLabel(bmiVal)}) — ${profile.weight}kg, ${profile.height}cm`);
    lines.push("");

    if (profile.chronicConditions?.length && !profile.chronicConditions.includes("None")) {
      lines.push(`**Conditions:** ${profile.chronicConditions.join(", ")}`);
    }
    if (profile.allergies?.length && !profile.allergies.includes("None")) {
      lines.push(`**Allergies:** ${profile.allergies.join(", ")}`);
    }
    lines.push("");

    const labLines: string[] = [];
    if (hb) labLines.push(`${statusEmoji(hb.status)} Hemoglobin: **${hb.value} ${hb.unit}** (${hb.status})`);
    if (chol) labLines.push(`${statusEmoji(chol.status)} Total Cholesterol: **${chol.value} ${chol.unit}** (${chol.status})`);
    if (glucose) labLines.push(`${statusEmoji(glucose.status)} Blood Glucose: **${glucose.value} ${glucose.unit}** (${glucose.status})`);
    if (tsh) labLines.push(`${statusEmoji(tsh.status)} TSH: **${tsh.value} ${tsh.unit}** (${tsh.status})`);

    if (labLines.length > 0) {
      lines.push("**Latest Lab Values:**");
      labLines.forEach(l => lines.push(l));
    } else {
      lines.push("*No lab reports uploaded yet.*");
    }

    lines.push("");
    if (medications.length > 0) {
      lines.push(`**Active Medications:** ${medications.map(m => m.name).join(", ")}`);
    }
    if (lowStock.length > 0) {
      lines.push(`⚠️ **Low stock:** ${lowStock.map(m => `${m.name} (${m.stock} left)`).join(", ")}`);
    }

    lines.push("");
    const abnormalBm = bm.filter(b => b.status !== "Normal");
    if (abnormalBm.length === 0 && bm.length > 0) {
      lines.push("✅ **All your recorded lab values are within normal range.**");
    } else if (abnormalBm.length > 0) {
      lines.push(`⚠️ **${abnormalBm.length} lab value${abnormalBm.length > 1 ? "s" : ""} need attention:** ${abnormalBm.map(b => `${b.parameter} (${b.status.toLowerCase()})`).join(", ")}`);
    }

    return {
      category: "Health Summary",
      answer: lines.join("\n"),
      sources: [],
      suggestedActions: [
        { label: "View My Reports", action: "records", page: "records" },
        { label: "Book a Checkup", action: "labs", page: "labs" },
        { label: "Update My Profile", action: "profile", page: "profile" },
      ],
    };
  }

  // ── 6. SYMPTOM-SPECIFIC GUIDANCE ────────────────────────────────────────────

  // Fever
  if (/fever|temperature|cold|flu|chills|shiver|dengue|malaria|typhoid/.test(lower)) {
    const temp = lower.match(/(\d{2,3}(?:\.\d)?)\s*(?:°?f|°?c|degrees?)/)?.[1];
    const tempNote = temp ? `You mentioned a temperature of **${temp}°** — ` : "";

    return {
      category: "Fever & Infection",
      answer: `### 🌡️ Fever Management

${tempNote}here is what to do:

**Safe medication:**
- **Paracetamol** (500mg–650mg) every 6–8 hours as needed${hasAsthma ? " — preferred for you due to your asthma" : ""}
- Maximum adult dose: **4,000 mg per 24 hours**
${hasAsthma ? "- ⚠️ **Avoid Ibuprofen/Combiflam** — risk of bronchospasm with your asthma\n" : ""}
**Dengue warning signs — go to ER if you notice:**
- Sudden fever drop but patient feels worse
- Bleeding gums, nosebleed, blood in urine or stool
- Severe stomach pain, persistent vomiting
- Red pinprick spots on skin (petechiae)

**Home care:**
- Drink **3–3.5 litres of fluids** daily (water, coconut water, ORS, clear soup)
- Rest, avoid strenuous activity
- Tepid sponging (lukewarm water on forehead) to reduce temperature

**See a doctor if:**
- Fever persists **more than 3 days** despite Paracetamol
- Temperature rises above **103°F (39.4°C)**
- You feel very unwell, confused, or cannot hold down fluids`,
      sources: [KB.who_fever],
      suggestedActions: [
        { label: "Book CBC & Dengue Home Test", action: "labs", page: "labs" },
        { label: "Order Paracetamol & ORS", action: "pharmacy", page: "pharmacy" },
        { label: "Consult a Doctor", action: "doctors", page: "find-doctors" },
      ],
    };
  }

  // Headache
  if (/headache|migraine|head pain|head ache|throbbing head|head hurt/.test(lower)) {
    const hb = findBiomarker(reports, "hemoglobin");
    const anemiaNote = hb && hb.status === "Low"
      ? `\n⚠️ **Relevant to you:** Your hemoglobin is **${hb.value} ${hb.unit}** (Low). Iron deficiency anemia is a common cause of frontal headaches and postural dizziness. Continuing your iron therapy should help resolve this component.`
      : "";

    return {
      category: "Headache & Neurology",
      answer: `### 🧠 Headache Assessment

**Types of headache:**
- **Tension** (most common): Dull band-like pressure around forehead and back of head — triggered by screen time, stress, dehydration, or poor posture
- **Migraine**: Unilateral throbbing pain, 4–72 hours, often with nausea, light/sound sensitivity
- **Sinus**: Pressure behind forehead and cheeks, worsens when bending forward
${anemiaNote}

**Evidence-based relief:**
1. **Paracetamol 500–650mg** with water${hasAsthma ? " (preferred for you due to asthma)" : ""}
2. Rest in a dark, quiet room — cold compress on forehead for migraine
3. Drink **2.5–3L water** today — dehydration is the most common trigger
4. Avoid taking pain medication more than 3 times/week (causes rebound headaches)

**🚨 Seek emergency care immediately if:**
- Headache peaks in intensity within 60 seconds ("thunderclap")
- Accompanied by stiff neck, high fever, vision loss, confusion, or sudden weakness`,
      sources: [KB.ihs_headache],
      suggestedActions: [
        { label: "Order Paracetamol from Pharmacy", action: "pharmacy", page: "pharmacy" },
        { label: "Consult Neurologist", action: "doctors", page: "find-doctors" },
      ],
    };
  }

  // Stomach / digestion
  if (/stomach|acidity|acid reflux|heartburn|gerd|gastritis|nausea|vomit|diarrhea|loose motion|constipation|bloating|gas|abdomen|indigestion/.test(lower)) {
    const ironMed = getMedication(medications, "ferrous", "iron");
    const ironNote = ironMed
      ? `\n⚠️ **For you specifically:** Iron tablets (${ironMed.name}) can cause stomach upset, nausea, and constipation. Take them **after food** (not empty stomach) and with Vitamin C to reduce GI side effects.`
      : "";

    return {
      category: "Gastroenterology",
      answer: `### 🥣 Digestive Health Guidance
${ironNote}

**For acidity / heartburn / GERD:**
- **Pantoprazole 40mg or Omeprazole 20mg** taken **30–45 minutes before breakfast** — most effective timing
- Avoid lying down within **3 hours of eating**
- Elevate head of bed slightly for nocturnal reflux
- Avoid triggers: spicy food, coffee, alcohol, aerated drinks, citrus, chocolate

**For nausea / vomiting:**
- Sip small amounts of cold water or soda water
- Ginger tea with honey is effective for mild nausea
- If vomiting persists >6 hours or blood is visible — seek emergency care

**For diarrhea / loose stools:**
- **ORS (Oral Rehydration Salts)** is the most important treatment — prevents dehydration
- BRAT diet: Banana, boiled Rice, Applesauce, dry Toast
- Avoid dairy, fatty, or fried foods until normal
- If diarrhea persists >48 hours or blood is present — consult a doctor`,
      sources: [KB.acg_gastro],
      suggestedActions: [
        { label: "Order Antacids from Pharmacy", action: "pharmacy", page: "pharmacy" },
        { label: "Consult Gastroenterologist", action: "doctors", page: "find-doctors" },
      ],
    };
  }

  // Sleep
  if (/sleep|insomnia|can.t sleep|not sleeping|restless night|wake up at night|trouble sleeping/.test(lower)) {
    const cetMed = getMedication(medications, "cetirizine");
    return {
      category: "Sleep Health",
      answer: `### 😴 Sleep Health Guidance

Adults need **7–9 hours** of quality sleep. Chronic poor sleep raises risk of hypertension, diabetes, and immune suppression.

**Proven sleep hygiene steps:**
1. **Fixed wake time** — same time every day including weekends anchors your circadian rhythm
2. **No caffeine after 2 PM** — caffeine half-life is 5–7 hours
3. **Dark, cool room** — 18–20°C is optimal for sleep onset
4. **Screen-free 60 min before bed** — blue light suppresses melatonin
5. **Wind-down routine** — reading, light stretching, or warm shower

**Natural aids:**
- Ashwagandha (600mg extract) reduces cortisol and improves sleep quality in clinical trials
- Warm milk with a pinch of nutmeg has mild sedative properties
${cetMed ? `\n⚠️ **Note for you:** Your ${cetMed.name} can cause drowsiness. If sleep trouble persists despite this, discuss with your doctor.` : ""}

**CBT-I (Cognitive Behavioral Therapy for Insomnia)** is the gold standard — more effective than sleeping pills long-term.`,
      sources: [KB.aasm_sleep],
      suggestedActions: [{ label: "Consult a Doctor", action: "doctors", page: "find-doctors" }],
    };
  }

  // Joint / muscle pain
  if (/joint|knee|back pain|muscle pain|sprain|arthritis|gout|uric acid|swollen|stiff/.test(lower)) {
    const bmiVal = profile.height && profile.weight
      ? (profile.weight / ((profile.height / 100) ** 2)).toFixed(1)
      : null;

    return {
      category: "Musculoskeletal Health",
      answer: `### 🦴 Joint & Muscle Pain Guidance

**For acute back pain or muscle strain:**
- Early **gentle movement** is superior to bed rest — studies show faster recovery
- Heat pack for muscle spasms; ice for first 48 hours of acute injuries
- **Pain relief:** ${hasAsthma ? "Paracetamol is preferred for you (avoid Ibuprofen with asthma)" : "Paracetamol or short-course Ibuprofen with food"}

**For joint pain / arthritis:**
- Low-impact exercise (swimming, cycling, yoga) maintains joint mobility without wear
- ${bmiVal ? `Your BMI is **${bmiVal}** — every 1 kg lost reduces knee joint load by ~4 kg` : "Maintaining a healthy weight significantly reduces joint stress"}

**For gout (high uric acid):**
- Target serum urate <6.0 mg/dL
- **Avoid:** red meat, organ meats, shellfish, beer, high-fructose drinks
- **Increase:** low-fat dairy, cherries, water (3L/day)

**See a doctor urgently if:**
- Joint is red, warm, swollen, and you have a fever (possible septic arthritis — emergency)
- Sudden inability to bear weight after an injury`,
      sources: [KB.acr_msk],
      suggestedActions: [
        { label: "Book Uric Acid Test", action: "labs", page: "labs" },
        { label: "Consult Orthopedic Surgeon", action: "doctors", page: "find-doctors" },
      ],
    };
  }

  // Stress / anxiety / mental health
  if (/stress|anxious|anxiety|depressed|depression|panic|mental health|mood|sad|overwhelmed|worry|mental/.test(lower)) {
    return {
      category: "Mental & Emotional Health",
      answer: `### 🧘 Mental Health Support

It takes courage to ask about this — and it matters just as much as physical health.

**Signs of anxiety:** Persistent worry, racing heart, shallow breathing, restlessness, trouble sleeping
**Signs of depression:** Low mood, loss of interest, fatigue, sleep changes, difficulty concentrating

**What actually helps:**
1. **Exercise** — 30 min aerobic activity 3×/week has antidepressant-equivalent effects (raises serotonin and BDNF)
2. **Sleep hygiene** — consistent wake time, no screens 1 hour before bed
3. **Mindfulness** — 10–15 min daily deep breathing or body scan
4. **Social connection** — isolation worsens symptoms; talking to someone helps
5. **CBT** — the most evidence-backed therapy for anxiety and depression

**When to seek professional help:**
- Symptoms persist **more than 2 weeks** and affect daily life
- You are having thoughts of self-harm

**Crisis helplines (India):**
- iCall: **9152987821**
- Vandrevala Foundation: **1860-2662-345** (24/7, free)

You are not alone — and effective help is available.`,
      sources: [KB.who_mh],
      suggestedActions: [{ label: "Consult Psychiatrist", action: "doctors", page: "find-doctors" }],
    };
  }

  // Skin problems
  if (/skin|rash|itch|eczema|psoriasis|acne|hives|urticaria|dryness|pimple/.test(lower)) {
    return {
      category: "Dermatology",
      answer: `### 🧴 Skin Health Guidance

**For dry skin / eczema:**
- Apply a **fragrance-free, thick moisturiser** (like Vaseline or CeraVe) immediately after bathing while skin is still slightly damp — this locks in moisture
- Use lukewarm water (not hot) for bathing
- Wear cotton clothing; avoid wool directly on skin

**For itching:**
- An **oral antihistamine** (Cetirizine or Loratadine) reduces histamine-driven itch
- Cool compress on the affected area provides temporary relief
- Avoid scratching — it worsens inflammation and risks infection

**For acne:**
- Wash face twice daily with a gentle, non-comedogenic cleanser
- Topical Benzoyl Peroxide (2.5%) or Salicylic Acid can help mild acne
- Avoid squeezing pimples — causes scarring and spreads bacteria

**For hives / urticaria:**
${profile?.allergies?.length ? `- Your recorded allergies (${profile.allergies.join(", ")}) may be a trigger — avoid known allergens` : "- Identify and avoid potential triggers (food, medication, stress, heat)"}
- Antihistamines (Cetirizine, Fexofenadine) reduce symptoms

**See a dermatologist if:**
- Rash is spreading rapidly, painful, or blistering
- You have fever alongside a skin rash (may indicate infection)`,
      sources: [KB.aad_derm],
      suggestedActions: [
        { label: "Order Antihistamine", action: "pharmacy", page: "pharmacy" },
        { label: "Consult Dermatologist", action: "doctors", page: "find-doctors" },
      ],
    };
  }

  // Diet / nutrition
  if (/diet|food|eat|nutrition|weight|calories|what should i eat|healthy food|meal|vegetarian|vitamin/.test(lower)) {
    const hb = findBiomarker(reports, "hemoglobin");
    const needsIron = hb && hb.status === "Low";
    const lines: string[] = [];

    lines.push("### 🥗 Personalised Nutrition Guide");
    lines.push("");

    if (needsIron) {
      lines.push(`**Iron-Rich Foods for Your Anemia** (Hb: ${hb!.value} ${hb!.unit}):`);
      lines.push("- Leafy greens: spinach, methi (fenugreek), amaranth");
      lines.push("- Legumes: masoor dal, chana, kidney beans");
      lines.push("- Seeds: pumpkin seeds, sesame (til)");
      lines.push("- Fruit: pomegranate, dates (khajoor), dried figs");
      lines.push("- **Always pair with Vitamin C** (lemon, amla, orange) to boost absorption by 300%");
      lines.push("- ⚠️ Avoid tea or coffee within 60 min of meals for maximum iron absorption");
      lines.push("");
    }

    if (hasAsthma) {
      lines.push("**Respiratory-Friendly Foods for Your Asthma:**");
      lines.push("- Anti-inflammatory: turmeric, ginger, omega-3 (fish, flaxseeds, walnuts)");
      lines.push("- Vitamin D (sunlight + fortified foods) supports lung immunity");
      lines.push("- Avoid sulphite-containing foods (dried fruits, processed meats) — can trigger bronchospasm");
      lines.push("");
    }

    lines.push("**General Balanced Diet (ICMR-NIN Guidelines):**");
    lines.push(`- **Protein:** ~${Math.round((profile.weight || 60) * 0.8)}g/day — dal, eggs, low-fat paneer, curd`);
    lines.push("- **Carbs:** Whole grains (brown rice, oats, bajra) over refined flour (maida)");
    lines.push("- **Fats:** Cold-pressed oils; limit ghee to 2–3 tsp/day");
    lines.push("- **Water:** 8–10 glasses daily");
    lines.push("- **Avoid:** Added sugar, ultra-processed foods, excess salt (target <5g/day)");

    return {
      category: "Nutrition & Diet",
      answer: lines.join("\n"),
      sources: [KB.icmr_diet, ...(needsIron ? [KB.who_iron] : [])],
      suggestedActions: [
        { label: "Order Supplements", action: "pharmacy", page: "pharmacy" },
        { label: "Book Full Body Checkup", action: "labs", page: "labs" },
      ],
    };
  }

  // Book doctor / appointment
  if (/book|appointment|consult|see a doctor|which doctor|specialist|doctor for/.test(lower)) {
    const conditions = profile.chronicConditions?.filter(c => c !== "None") || [];
    return {
      category: "Doctor & Appointment",
      answer: `### 🩺 Finding the Right Specialist

${name}, I can help you find the right doctor.

**Based on your profile** (${conditions.length ? conditions.join(", ") : "general health"}):
${conditions.some(c => /asthma/i.test(c)) ? "- 🫁 **Pulmonologist** — for asthma review and lung function" : ""}
${conditions.some(c => /diabetes/i.test(c)) ? "- 🔬 **Endocrinologist** — for diabetes and thyroid management" : ""}
${conditions.some(c => /hypertension|bp/i.test(c)) ? "- ❤️ **Cardiologist** — for blood pressure and heart health" : ""}

**Other available specialists:**
- ❤️ **Cardiologist** — heart health, palpitations, blood pressure
- 🧠 **Neurologist** — headaches, dizziness, nerve problems
- 🫁 **Pulmonologist** — asthma, breathing, cough
- 👶 **Pediatrician** — children's health
- 🌸 **Gynecologist** — women's health, hormones
- 🔬 **Endocrinologist** — diabetes, thyroid
- 🦴 **Orthopedic Surgeon** — joint pain, back pain
- 🧴 **Dermatologist** — skin conditions`,
      sources: [],
      suggestedActions: [
        { label: "Browse All Doctors", action: "doctors", page: "find-doctors" },
        { label: "Book a Lab Test", action: "labs", page: "labs" },
      ],
    };
  }

  // ── 7. DYNAMIC FALLBACK — contextual, not generic ────────────────────────────
  // Build a response that uses whatever patient data is available
  const hb = findBiomarker(reports, "hemoglobin");
  const hasData = bm.length > 0 || medications.length > 0;
  const conditionContext = profile.chronicConditions?.filter(c => c !== "None").join(" and ") || "";

  return {
    category: "General Guidance",
    answer: `### 🩺 I'm here to help, ${name}

${hasData ? `Based on your health data:\n${hb ? `- Your hemoglobin is **${hb.value} ${hb.unit}** (${hb.status})\n` : ""}${medications.length > 0 ? `- You have ${medications.length} active medication${medications.length > 1 ? "s" : ""}` : ""}${conditionContext ? `\n- Known conditions: ${conditionContext}` : ""}\n` : ""}
I can help you with:

- **"Explain my blood test results"** — I'll walk through every value
- **"I have a fever of 102°F"** — specific treatment guidance
- **"Is ibuprofen safe for me?"** — checks against your conditions and allergies
- **"What foods should I eat?"** — diet plan based on your reports
- **"Check my medications"** — review all prescriptions with stock status
- **"I have a headache"** / **"my stomach hurts"** — symptom-specific advice
- **"Give me my health summary"** — full overview of your health data
- **"Book a doctor"** — help choosing the right specialist

The more specific your question, the more personalised my answer will be.`,
    sources: [],
    suggestedActions: [
      { label: "My Health Summary", action: "prompt" },
      { label: "Explain My Reports", action: "records", page: "records" },
      { label: "Find a Doctor", action: "doctors", page: "find-doctors" },
      { label: "Check Medications", action: "prompt" },
    ],
  };
}
