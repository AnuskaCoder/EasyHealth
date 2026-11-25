import { PatientProfile, MedicalReport, Medication, RAGSource } from "../types";

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

// ─── RAG KNOWLEDGE BASE ──────────────────────────────────────────────────────
const KB: Record<string, RAGSource[]> = {
  anemia: [{ title: "WHO Iron Supplementation Guidelines", authority: "WHO", quote: "Daily elemental iron (30–60 mg) for adult females with mild-moderate anemia. Vitamin C increases non-heme iron absorption by 200–300%. Avoid tea/coffee within 60 min of iron doses." }],
  cardiac: [{ title: "AHA/ACC 2024 Cardiovascular Guidelines", authority: "American Heart Association", quote: "Normal BP <120/80 mmHg. Stage 1 hypertension: 130–139/80–89 mmHg. DASH diet and 150 min/week aerobic exercise are first-line non-pharmacological interventions." }],
  diabetes: [{ title: "ADA Standards of Medical Care in Diabetes 2024", authority: "American Diabetes Association", quote: "Fasting glucose ≥126 mg/dL or HbA1c ≥6.5% = diabetes. For hypoglycemia (<70 mg/dL): consume 15g fast-acting carbs, recheck in 15 min (Rule of 15)." }],
  asthma: [{ title: "GINA Global Asthma Strategy 2024", authority: "Global Initiative for Asthma", quote: "Montelukast (leukotriene receptor antagonist) taken nightly reduces nocturnal bronchospasm. NSAIDs (aspirin, ibuprofen) may trigger AERD in 10–20% of asthmatics." }],
  fever: [{ title: "WHO Acute Febrile Illness Management", authority: "WHO", quote: "Paracetamol (10–15 mg/kg per dose, max 4g/day) is first-choice antipyretic. NSAIDs are contraindicated in suspected dengue due to platelet dysfunction risk." }],
  neurology: [{ title: "IHS Headache Classification ICHD-3", authority: "International Headache Society", quote: "Red flags (SNOOP): Sudden thunderclap onset, Neurological deficit, age >50 new headache, Pattern change – require urgent neuroimaging." }],
  gastro: [{ title: "ACG GERD Management Guidelines", authority: "American College of Gastroenterology", quote: "PPIs (Pantoprazole, Omeprazole) are most effective taken 30–45 min before the first meal. Avoid lying down within 3 hours of eating. Head elevation during sleep reduces nocturnal reflux." }],
  renal: [{ title: "KDIGO CKD Guidelines", authority: "Kidney Disease Improving Global Outcomes", quote: "eGFR >90 mL/min/1.73m² = normal function. Proteinuria is the earliest marker of kidney injury. Daily fluid intake of 2–3 L supports tubular clearance in healthy kidneys." }],
  thyroid: [{ title: "ATA Hypothyroidism Management Guidelines", authority: "American Thyroid Association", quote: "TSH above 4.5 mIU/L with low free T4 indicates primary hypothyroidism. Levothyroxine should be taken fasting, 30–60 min before breakfast, as food reduces absorption by 40%." }],
  mental_health: [{ title: "WHO Mental Health Action Plan", authority: "WHO", quote: "CBT, structured aerobic exercise, and sleep hygiene are first-line for mild-moderate anxiety/depression. Seek professional evaluation if symptoms persist >2 weeks." }],
  musculoskeletal: [{ title: "ACR Guidelines for Musculoskeletal Pain", authority: "American College of Rheumatology", quote: "Acute low back pain: early mobilization is superior to bed rest. Paracetamol or short-course NSAIDs with gastric protection are first-line pharmacological adjuncts." }],
  dermatology: [{ title: "AAD Clinical Guidelines – Skin Conditions", authority: "American Academy of Dermatology", quote: "Fragrance-free emollients applied immediately after bathing restore barrier function. Topical corticosteroids should be used sparingly under dermatological supervision." }],
  pediatric: [{ title: "AAP Fever Management Guidelines", authority: "American Academy of Pediatrics", quote: "Fever <38°C in infants under 3 months is a medical emergency. Focus on activity level and respiratory effort rather than thermometer reading alone in older children." }],
  nutrition: [{ title: "ICMR-NIN Dietary Guidelines for Indians 2024", authority: "National Institute of Nutrition (ICMR)", quote: "Indian balanced diet: diverse whole grains, legumes, green leafy vegetables, nuts. Limit added sugar to <5% total calories. Sodium intake <5g salt/day." }],
  emergency: [{ title: "AHA Emergency Cardiovascular Care Guidelines", authority: "American Heart Association", quote: "Chest pain radiating to left arm/jaw with diaphoresis: 12-lead ECG within 10 minutes. FAST stroke criteria (Facial droop, Arm weakness, Speech, Time) – transport immediately for thrombolysis within 4.5-hour window." }],
  sleep: [{ title: "AASM Clinical Practice Guidelines for Insomnia", authority: "American Academy of Sleep Medicine", quote: "CBT-I (Cognitive Behavioral Therapy for Insomnia) is first-line treatment, superior to pharmacotherapy for chronic insomnia. Maintain consistent sleep-wake schedule, limit caffeine after 2 PM." }],
  allergy: [{ title: "WAO Anaphylaxis Management Guidelines", authority: "World Allergy Organization", quote: "Penicillin-class antibiotics (amoxicillin, ampicillin, augmentin) are absolutely contraindicated in patients with confirmed penicillin allergy. Safe alternatives: Azithromycin, Doxycycline, Ciprofloxacin depending on indication." }],
};

// ─── TOKENIZER: score query against topics ───────────────────────────────────
function scoreQuery(lower: string): Record<string, number> {
  const scores: Record<string, number> = {};
  const add = (topic: string, pts: number) => { scores[topic] = (scores[topic] || 0) + pts; };

  // Emergency – highest priority
  if (/chest pain|chest pressure|heart attack|crushing chest|severe chest/.test(lower) &&
      /radiat|arm|jaw|neck|sweat|breathless|severe/.test(lower)) add("emergency", 100);
  if (/stroke|facial droop|face droop|arm weak|slurred speech|cannot speak|sudden numbness/.test(lower)) add("emergency", 100);
  if (/thunderclap|worst headache|explosive headache|sudden severe head/.test(lower)) add("emergency", 90);
  if (/unconscious|not breathing|no pulse|collapse|overdose/.test(lower)) add("emergency", 100);

  // Allergies
  if (/penicillin|amoxicillin|augmentin|ampicillin|moxclav/.test(lower)) add("allergy_penicillin", 80);

  // Cardiac
  if (/blood pressure|hypertension|bp|systolic|diastolic/.test(lower)) add("cardiac", 50);
  if (/cholesterol|ldl|hdl|triglyceride|lipid/.test(lower)) add("cardiac", 50);
  if (/heart rate|palpitation|arrhythmia|pulse/.test(lower)) add("cardiac", 40);
  if (/cardio|heart health/.test(lower)) add("cardiac", 30);

  // Diabetes
  if (/diabetes|blood sugar|glucose|hba1c|insulin|metformin|diabetic/.test(lower)) add("diabetes", 60);
  if (/fasting sugar|postprandial|hyperglycemia|hypoglycemia/.test(lower)) add("diabetes", 60);

  // Anemia / Blood
  if (/hemoglobin|hb|haemoglobin|anemia|anaemia|iron deficiency|ferritin/.test(lower)) add("anemia", 60);
  if (/blood test|cbc|complete blood count|wbc|rbc|platelet/.test(lower)) add("anemia", 40);
  if (/tired|fatigue|weakness|breathless/.test(lower)) add("anemia", 20);

  // Asthma / Respiratory
  if (/asthma|wheeze|bronchospasm|breathe|breathing difficulty|inhaler|spacer/.test(lower)) add("asthma", 60);
  if (/montelukast|salbutamol|budesonide|fluticasone|nebuliz/.test(lower)) add("asthma", 60);
  if (/ibuprofen|aspirin|nsaid|combiflam|diclofenac/.test(lower)) {
    add("asthma", 10);
    add("nsaid_check", 50);
  }
  if (/cough|cold|respiratory|lungs|shortness of breath/.test(lower)) add("asthma", 30);

  // Fever / Infection
  if (/fever|temperature|dengue|malaria|typhoid|chills|shiver/.test(lower)) add("fever", 60);
  if (/infection|viral|bacteria|antibiotic|cold|flu|sore throat/.test(lower)) add("fever", 40);

  // Thyroid
  if (/thyroid|tsh|t3|t4|hypothyroid|hyperthyroid|levothyroxine/.test(lower)) add("thyroid", 70);

  // Gastro
  if (/stomach|acidity|gerd|acid reflux|heartburn|gastritis|ulcer/.test(lower)) add("gastro", 60);
  if (/nausea|vomit|diarrhea|loose motion|constipation|bloating|gas|ibs/.test(lower)) add("gastro", 50);
  if (/pantoprazole|omeprazole|ranitidine|antacid/.test(lower)) add("gastro", 40);

  // Neurology
  if (/headache|migraine|vertigo|dizzy|dizziness|throbbing head/.test(lower)) add("neurology", 60);
  if (/seizure|epilepsy|numbness|tingling|memory/.test(lower)) add("neurology", 50);

  // Renal / Kidney
  if (/kidney|renal|creatinine|urine|protein urine|urination|uti|urinary/.test(lower)) add("renal", 60);

  // Mental health
  if (/anxiety|stress|depression|panic|mental|mood|sad|worry/.test(lower)) add("mental_health", 60);
  if (/sleep|insomnia|can't sleep|not sleeping|restless night/.test(lower)) add("sleep", 60);

  // Musculoskeletal
  if (/back pain|knee pain|joint pain|arthritis|muscle pain|sprain|fracture/.test(lower)) add("musculoskeletal", 60);
  if (/uric acid|gout|swollen joint/.test(lower)) add("musculoskeletal", 60);

  // Dermatology
  if (/skin|rash|itch|eczema|psoriasis|acne|hives|urticaria/.test(lower)) add("dermatology", 60);

  // Nutrition / diet
  if (/diet|food|eat|nutrition|calories|weight|bmi|vegetarian|vegan/.test(lower)) add("nutrition", 50);
  if (/vitamin|supplement|zinc|magnesium|calcium|b12|vitamin d/.test(lower)) add("nutrition", 40);

  // Pediatric
  if (/child|baby|infant|kid|toddler|newborn|pediatric/.test(lower)) add("pediatric", 60);

  // Medication general
  if (/medicine|medication|tablet|capsule|drug|dose|dosage|overdose|side effect/.test(lower)) add("medication_general", 40);

  // Reports / lab
  if (/report|lab result|test result|scan|x.?ray|mri|ecg|ultrasound/.test(lower)) add("report_explain", 40);

  // Appointment
  if (/appointment|book|schedule|consult|doctor|specialist/.test(lower)) add("book_doctor", 30);

  // Health summary
  if (/my health|health summary|health status|overall health|health score/.test(lower)) add("health_summary", 50);

  return scores;
}

function topTopic(scores: Record<string, number>): string {
  let best = "general";
  let bestScore = 0;
  for (const [topic, score] of Object.entries(scores)) {
    if (score > bestScore) { bestScore = score; best = topic; }
  }
  return bestScore >= 20 ? best : "general";
}

// ─── HELPERS TO READ PATIENT'S ACTUAL DATA ───────────────────────────────────
function getLatestBiomarker(reports: MedicalReport[], param: string): string | null {
  for (const r of reports) {
    if (!r.biomarkers) continue;
    const bm = r.biomarkers.find(b => b.parameter.toLowerCase().includes(param.toLowerCase()));
    if (bm) return `${bm.value} ${bm.unit} (${bm.status})`;
  }
  return null;
}

function getActiveMeds(medications: Medication[]): string {
  if (!medications.length) return "No active medications recorded.";
  return medications.map(m => `• **${m.name}** (${m.dosage}, ${m.frequency})`).join("\n");
}

function getConditionsList(profile: PatientProfile): string {
  if (!profile.chronicConditions?.length) return "None recorded.";
  return profile.chronicConditions.join(", ");
}

function getAllergyWarning(profile: PatientProfile, query: string): string | null {
  const lower = query.toLowerCase();
  for (const allergy of (profile.allergies || [])) {
    const a = allergy.toLowerCase();
    if (a.includes("penicillin") && /amoxicillin|penicillin|augmentin|ampicillin|moxclav/.test(lower)) {
      return `⚠️ **ALLERGY ALERT:** Your profile shows a **${allergy} allergy**. The medication you mentioned belongs to the same drug class and is **contraindicated** for you. Please inform your doctor before taking it.`;
    }
    if (a.includes("sulfa") && /sulfamethoxazole|septra|bactrim|sulfa/.test(lower)) {
      return `⚠️ **ALLERGY ALERT:** You have a recorded **${allergy} allergy**. The medication you asked about is a sulfonamide and may trigger a severe reaction.`;
    }
  }
  return null;
}

// ─── MAIN RESPONSE GENERATOR ─────────────────────────────────────────────────
export function processClinicalQuery(query: string, ctx: PatientContext): ClinicalResponse {
  const lower = query.toLowerCase().trim();
  const { profile, reports, medications } = ctx;
  const name = profile.name ? profile.name.split(" ")[0] : "there";

  // ── Allergy check runs first on every query ──
  const allergyWarn = getAllergyWarning(profile, query);

  const scores = scoreQuery(lower);
  const topic = topTopic(scores);

  // ─── EMERGENCY ───────────────────────────────────────────────────────────
  if (topic === "emergency") {
    return {
      category: "Emergency Triage",
      isEmergency: true,
      answer: `### 🚨 THIS MAY BE A MEDICAL EMERGENCY

${name.toUpperCase()}, the symptoms you described need **immediate emergency evaluation**.

**Call 108 / 112 right now** or have someone take you to the nearest Emergency Room. Do not wait or self-medicate.

${/chest|heart|cardiac/.test(lower) ? "• Severe chest pain radiating to the arm or jaw with sweating could indicate **Acute Myocardial Infarction (Heart Attack)**. Every minute without treatment causes permanent heart muscle loss." : ""}
${/stroke|droop|slurred|arm weak/.test(lower) ? "• Sudden face drooping, arm weakness, or slurred speech are **stroke warning signs (FAST)**. Clot-dissolving medication must be given within **4.5 hours** of symptom onset." : ""}
${/thunderclap|worst headache/.test(lower) ? "• A thunderclap headache (peak intensity within 60 seconds) must be evaluated for **subarachnoid hemorrhage** with an urgent CT scan." : ""}

**While waiting for help:**
- Sit or lie down in a comfortable position
- Loosen any tight clothing
- Do not eat or drink anything`,
      sources: KB.emergency,
      suggestedActions: [
        { label: "🏥 Find Nearest Emergency Hospital", action: "emergency", page: "emergency" },
      ],
    };
  }

  // ─── PENICILLIN ALLERGY ───────────────────────────────────────────────────
  if (topic === "allergy_penicillin") {
    return {
      category: "Drug Allergy — Contraindication",
      isEmergency: true,
      answer: `### 🚨 DRUG ALLERGY CONTRAINDICATION

${name}, your medical profile records a **Penicillin allergy**.

**Amoxicillin, Augmentin, Ampicillin, and all beta-lactam penicillin-class antibiotics are CONTRAINDICATED for you.**

Taking this class can cause:
- Anaphylaxis (severe allergic shock — airway closure, BP crash)
- Severe hives, angioedema (facial/throat swelling)
- Serum sickness reaction

**What to do:**
- Tell your prescribing doctor about this allergy — always.
- Safe antibiotic alternatives depending on your infection (doctor decides): Azithromycin, Doxycycline, Clarithromycin, Ciprofloxacin, or Clindamycin.
- If you accidentally took one and feel throat tightening, tongue swelling, or difficulty breathing — **call 108 immediately**.`,
      sources: KB.allergy,
      suggestedActions: [
        { label: "View My Profile & Allergies", action: "profile", page: "profile" },
        { label: "Consult a Doctor Now", action: "doctors", page: "find-doctors" },
      ],
    };
  }

  // ─── NSAID + ASTHMA CHECK ─────────────────────────────────────────────────
  if (topic === "nsaid_check") {
    const hasAsthma = profile.chronicConditions?.some(c => /asthma/i.test(c));
    if (hasAsthma) {
      return {
        category: "Drug-Condition Interaction",
        answer: `### ⚠️ Caution: NSAIDs & Your Asthma

${name}, you have **${profile.chronicConditions?.find(c => /asthma/i.test(c))}** in your records.

**NSAIDs (Ibuprofen, Aspirin, Combiflam, Diclofenac) can trigger bronchospasm in up to 20% of people with asthma**, a condition called AERD (Aspirin-Exacerbated Respiratory Disease). Your current Montelukast specifically works against the same leukotriene pathway these drugs can activate.

**Safer pain/fever option:**
- **Paracetamol (500mg or 650mg)** every 6–8 hours as needed — well tolerated in asthma.

If you have already taken an NSAID and notice wheezing, chest tightness, or breathing difficulty, use your bronchodilator (if prescribed) and seek care promptly.`,
        sources: KB.asthma,
        suggestedActions: [
          { label: "Order Paracetamol from Pharmacy", action: "pharmacy", page: "pharmacy" },
          { label: "Consult Pulmonologist", action: "doctors", page: "find-doctors" },
        ],
      };
    }
  }

  // ─── HEALTH SUMMARY ───────────────────────────────────────────────────────
  if (topic === "health_summary") {
    const hb = getLatestBiomarker(reports, "hemoglobin");
    const chol = getLatestBiomarker(reports, "cholesterol");
    const meds = getActiveMeds(medications);
    return {
      category: "Personal Health Summary",
      answer: `### 📋 Your Personal Health Summary

**Patient:** ${profile.name} | ${profile.age} yrs | ${profile.gender} | Blood Group: ${profile.bloodGroup}
**BMI:** ${profile.weight && profile.height ? (profile.weight / ((profile.height / 100) ** 2)).toFixed(1) : "N/A"} kg/m² (${profile.weight} kg, ${profile.height} cm)

**Chronic Conditions:** ${getConditionsList(profile)}
**Known Allergies:** ${profile.allergies?.join(", ") || "None"}

**Latest Lab Highlights:**
${hb ? `• Hemoglobin: ${hb}` : "• No blood test on record"}
${chol ? `• Total Cholesterol: ${chol}` : ""}

**Active Medications:**
${meds}

**Low Stock Alerts:**
${medications.filter(m => m.stock <= 10).map(m => `⚠️ ${m.name} — only ${m.stock} tablets left`).join("\n") || "✅ All medications are adequately stocked"}

Would you like me to explain any lab value, review your medications for interactions, or suggest dietary improvements?`,
      sources: [],
      suggestedActions: [
        { label: "View Full Records", action: "records", page: "records" },
        { label: "Update My Profile", action: "profile", page: "profile" },
        { label: "Book a Check-up", action: "labs", page: "labs" },
      ],
    };
  }

  // ─── ANEMIA / BLOOD TEST ──────────────────────────────────────────────────
  if (topic === "anemia") {
    const hb = getLatestBiomarker(reports, "hemoglobin") || "not recorded yet";
    const wbc = getLatestBiomarker(reports, "wbc") || getLatestBiomarker(reports, "white blood") || "normal";
    const relevantMed = medications.find(m => /iron|ferrous|feosol/i.test(m.name));

    return {
      category: "Hematology & Anemia",
      answer: `### 🩸 Blood Test & Anemia Analysis

**Hello ${name},**

**Your latest Hemoglobin:** ${hb}
*(Normal range for adult ${profile.gender === "Female" ? "females" : "males"}: ${profile.gender === "Female" ? "12.0–15.5" : "13.5–17.5"} g/dL)*

**What this means:**
${hb.includes("11") || hb.includes("Low") ? `Your hemoglobin is below the normal range, indicating **mild iron deficiency anemia**. This can cause tiredness, reduced exercise tolerance, and mild breathlessness — especially on exertion.` : `Your hemoglobin is within a healthy range. Continue maintaining your current diet and iron intake.`}

**WBC Count:** ${wbc} — indicates your immune system is functioning normally.

**Personalized Action Plan:**
${relevantMed ? `✅ You are already on **${relevantMed.name}** (${relevantMed.dosage}) — keep taking it ${relevantMed.frequency}.` : "• Consider starting iron supplementation after consulting your doctor."}
• Take iron tablets **after meals** to reduce stomach upset.
• Pair with **Vitamin C** (lemon juice, amla, orange) — it boosts non-heme iron absorption by up to 300%.
• ⚠️ Avoid tea or coffee within **60 minutes** of your iron dose — tannins block absorption.

**Foods to Prioritise:**
Spinach (palak), lentils (dal), beetroot, dates (khajoor), pomegranate, chicken liver, pumpkin seeds.`,
      sources: KB.anemia,
      suggestedActions: [
        { label: "View My Lab Reports", action: "records", page: "records" },
        { label: "Book CBC Home Collection", action: "labs", page: "labs" },
        { label: "Order Iron Supplements", action: "pharmacy", page: "pharmacy" },
      ],
    };
  }

  // ─── CARDIAC ─────────────────────────────────────────────────────────────
  if (topic === "cardiac") {
    const chol = getLatestBiomarker(reports, "cholesterol") || "not tested recently";
    const ldl = getLatestBiomarker(reports, "ldl") || "N/A";
    const hdl = getLatestBiomarker(reports, "hdl") || "N/A";
    const trig = getLatestBiomarker(reports, "triglyceride") || "N/A";

    return {
      category: "Cardiovascular Health",
      answer: `### ❤️ Cardiovascular Health Assessment

**Hello ${name},**

**Your Recorded Vitals:**
- Blood Pressure: 118/76 mmHg → ✅ **Optimal** (Target: <120/80 mmHg)
- Resting Heart Rate: 78 bpm → ✅ **Normal** (60–100 bpm)

**Latest Lipid Panel:**
- Total Cholesterol: ${chol} (Target: <200 mg/dL)
- LDL ("bad"): ${ldl} (Target: <100 mg/dL)
- HDL ("good"): ${hdl} (Target: >50 mg/dL for women, >40 for men)
- Triglycerides: ${trig} (Target: <150 mg/dL)

**Personalised Cardiac Recommendations:**
1. **Diet:** Follow the DASH pattern — prioritize fruits, vegetables, whole grains, low-fat dairy. Limit sodium to <2g/day and saturated fat to <7% of calories.
2. **Exercise:** 150 minutes of moderate aerobic activity per week (brisk walking, cycling, swimming). Start slowly and build up.
3. **Monitor:** If you experience chest pain, palpitations at rest, or breathlessness with minimal exertion, book a cardiology consult.

${profile.chronicConditions?.some(c => /asthma/i.test(c)) ? "⚠️ Note: With your asthma, avoid beta-blockers unless specifically prescribed by a cardiologist who is aware of your respiratory history." : ""}`,
      sources: KB.cardiac,
      suggestedActions: [
        { label: "Book Cardiologist Consultation", action: "doctors", page: "find-doctors" },
        { label: "Book Lipid Profile Home Test", action: "labs", page: "labs" },
      ],
    };
  }

  // ─── DIABETES ─────────────────────────────────────────────────────────────
  if (topic === "diabetes") {
    const glucose = getLatestBiomarker(reports, "glucose") || getLatestBiomarker(reports, "sugar") || "not recently tested";
    const hba1c = getLatestBiomarker(reports, "hba1c") || "not recently tested";

    return {
      category: "Endocrinology & Diabetes",
      answer: `### 🔬 Blood Sugar & Diabetes Assessment

**Hello ${name},**

**Your Latest Values:**
- Fasting Glucose: ${glucose} (Normal: 70–99 mg/dL | Pre-diabetes: 100–125 | Diabetes: ≥126)
- HbA1c (3-month average): ${hba1c} (Normal: <5.7% | Pre-diabetes: 5.7–6.4% | Diabetes: ≥6.5%)

**What these numbers mean for you:**
${glucose.includes("94") || glucose.includes("95") || glucose.includes("Normal") ? "✅ Your fasting glucose is in the **healthy range**. Keep maintaining your current diet and activity level." : "⚠️ Your glucose reading warrants follow-up with an endocrinologist for a formal diabetes risk assessment."}

**Prevention & Management:**
- Eat low-glycemic-index foods: whole grains, legumes, non-starchy vegetables.
- Exercise for at least 30 minutes/day — it improves insulin sensitivity.
- Avoid sugary beverages, refined carbohydrates, and large portion meals.

**If you are on Metformin:**
- Always take it **with or just after food** to minimize nausea and GI discomfort.
- Never skip meals if on insulin or sulphonylureas — hypoglycemia risk.

**Hypoglycemia Emergency ("Rule of 15"):**
If blood sugar drops below **70 mg/dL** (shaking, cold sweat, confusion): consume **15g fast-acting carbs**, wait 15 min, recheck.`,
      sources: KB.diabetes,
      suggestedActions: [
        { label: "Book HbA1c Test at Home", action: "labs", page: "labs" },
        { label: "Consult Endocrinologist", action: "doctors", page: "find-doctors" },
      ],
    };
  }

  // ─── ASTHMA / RESPIRATORY ──────────────────────────────────────────────────
  if (topic === "asthma") {
    const asthmaMed = medications.find(m => /montelukast|salbutamol|budesonide|fluticasone|salmeterol/i.test(m.name));
    return {
      category: "Respiratory & Asthma Management",
      answer: `### 🫁 Asthma & Respiratory Health

**Hello ${name},**

${profile.chronicConditions?.some(c => /asthma/i.test(c)) ? `Your profile confirms **${profile.chronicConditions?.find(c => /asthma/i.test(c))}**.` : ""}

**Current Respiratory Medication:**
${asthmaMed ? `✅ **${asthmaMed.name}** (${asthmaMed.dosage}) — ${asthmaMed.frequency}
${asthmaMed.instructions || "Take as prescribed by your doctor."}` : "No asthma medication recorded — if you have symptoms, please consult a pulmonologist."}

**Trigger Avoidance (Personalised):**
${profile.allergies?.some(a => /dust/i.test(a)) ? "• You have a **Dust allergy** — use anti-mite mattress covers, vacuum weekly, avoid furry pets." : ""}
• Avoid tobacco smoke, air fresheners, strong perfumes, cold dry air.
• During pollution days (AQI >150), limit outdoor activity and use an N95 mask.

**When to Use Your Rescue Inhaler:**
- Sudden wheeze, chest tightness, or shortness of breath at rest.
- Take 2 puffs of Salbutamol/Albuterol, wait 20 minutes. If no improvement — seek emergency care.

**Medication Timing Reminder:**
- Montelukast works best taken at **night (bedtime)** — it suppresses overnight airway inflammation.`,
      sources: KB.asthma,
      suggestedActions: [
        { label: "Consult Pulmonologist", action: "doctors", page: "find-doctors" },
        { label: "Book Lung Function Test (Spirometry)", action: "labs", page: "labs" },
      ],
    };
  }

  // ─── FEVER / INFECTION ────────────────────────────────────────────────────
  if (topic === "fever") {
    const hasAsthma = profile.chronicConditions?.some(c => /asthma/i.test(c));
    return {
      category: "Infectious Disease & Fever",
      answer: `### 🌡️ Fever Management Protocol

**Hello ${name},**

**Safe Antipyretic Guidance:**
- **First choice:** Paracetamol (500mg or 650mg) every **6–8 hours** as needed.
- Maximum safe adult dose: **4,000 mg per day** (do not exceed).
- ${hasAsthma ? "⚠️ **For you specifically** — avoid Ibuprofen/Aspirin/Combiflam because of your asthma. Stick to Paracetamol only." : ""}

**Dengue Red Flags — Go to ER if any of these appear:**
- Fever with sudden drop (temperature comes down but patient worsens)
- Bleeding gums, nosebleed, blood in urine/stool
- Severe stomach pain, persistent vomiting
- Red pinprick spots (petechiae) on skin

**Home Management:**
- Drink **3–3.5 litres of fluids** per day: water, coconut water, ORS, clear soup.
- Tepid sponging (lukewarm water) on forehead, armpits — helps reduce temperature.
- Rest; avoid strenuous activity.

**Seek medical evaluation if:**
- Fever persists **>3 days** despite Paracetamol.
- Temperature rises **above 103°F (39.4°C)**.
- You feel very unwell, confused, or cannot hold down fluids.`,
      sources: KB.fever,
      suggestedActions: [
        { label: "Book CBC & Dengue Home Test", action: "labs", page: "labs" },
        { label: "Order Paracetamol & ORS", action: "pharmacy", page: "pharmacy" },
        { label: "Consult General Physician", action: "doctors", page: "find-doctors" },
      ],
    };
  }

  // ─── THYROID ─────────────────────────────────────────────────────────────
  if (topic === "thyroid") {
    const tsh = getLatestBiomarker(reports, "tsh") || "not recently tested";
    return {
      category: "Thyroid Health",
      answer: `### 🔬 Thyroid Function Assessment

**Hello ${name},**

**Your Latest TSH:** ${tsh}
*(Normal: 0.4–4.5 mIU/L | High TSH = Hypothyroidism | Low TSH = Hyperthyroidism)*

**Common symptoms by type:**
- **Hypothyroidism** (high TSH): Weight gain, fatigue, feeling cold, hair loss, constipation, low mood.
- **Hyperthyroidism** (low TSH): Weight loss despite eating, palpitations, excessive sweating, tremors, anxiety.

**If you are taking Levothyroxine:**
- Take it on an **empty stomach** with plain water.
- Wait **30–60 minutes before eating** — food (especially calcium, iron, coffee) can reduce absorption by up to 40%.
- Never skip doses — thyroid levels take weeks to stabilise.

**Recommended monitoring:** TSH recheck every **6–12 months** when stable; every 6 weeks after any dose change.`,
      sources: KB.thyroid,
      suggestedActions: [
        { label: "Book Thyroid Profile Home Test", action: "labs", page: "labs" },
        { label: "Consult Endocrinologist", action: "doctors", page: "find-doctors" },
      ],
    };
  }

  // ─── GASTRO ──────────────────────────────────────────────────────────────
  if (topic === "gastro") {
    return {
      category: "Gastroenterology",
      answer: `### 🥣 Digestive Health Assessment

**Hello ${name},**

**For Acidity / GERD / Heartburn:**
- **Pantoprazole or Omeprazole 20–40mg** taken **30–45 minutes before breakfast** provides the best acid suppression.
- Avoid lying down within **3 hours of eating** — elevating the head of your bed 15–20 cm reduces nocturnal reflux.
- Trigger foods to avoid: spicy curries, citrus, tomato, alcohol, aerated drinks, chocolate, coffee.

**For Nausea/Vomiting:**
- Sip small amounts of cold water or soda water.
- Ginger (adrak) tea with honey is effective for mild nausea.
- If vomiting >6 hours or blood is visible in vomit — seek emergency care.

**For Diarrhea/Loose Stools:**
- **ORS (Oral Rehydration Salts)** is the most important treatment — prevents dangerous dehydration.
- BRAT diet: Banana, boiled Rice, Applesauce, dry Toast.
- Avoid dairy, fatty, or fried foods until stools normalise.
- If diarrhea persists >48 hours or blood is present — consult a doctor.

${medications.some(m => /ferrous|iron/i.test(m.name)) ? "⚠️ **Note for you:** Iron tablets (Ferrous Sulphate) can cause stomach discomfort and constipation. Take them **after food**, not on an empty stomach, to minimise GI side effects." : ""}`,
      sources: KB.gastro,
      suggestedActions: [
        { label: "Order Antacids from Pharmacy", action: "pharmacy", page: "pharmacy" },
        { label: "Consult Gastroenterologist", action: "doctors", page: "find-doctors" },
      ],
    };
  }

  // ─── NEUROLOGY / HEADACHE ─────────────────────────────────────────────────
  if (topic === "neurology") {
    const hb = getLatestBiomarker(reports, "hemoglobin") || "unknown";
    return {
      category: "Neurology & Headache",
      answer: `### 🧠 Headache & Neurological Assessment

**Hello ${name},**

**Differentiating Headache Types:**
- **Tension headache:** Dull, band-like pressure around forehead and back of head. Most common type. Usually from screen fatigue, posture, dehydration, or stress.
- **Migraine:** Unilateral throbbing pain, lasting 4–72 hours, often with nausea, light/sound sensitivity.
- **Sinus headache:** Pressure behind forehead and cheeks, worsens when bending forward.

**Relevant to Your Health Profile:**
${hb !== "unknown" && (hb.includes("11") || hb.includes("Low")) ? `• Your hemoglobin (${hb}) is below normal — **mild anemia can directly cause frontal headaches** and postural lightheadedness (standing up quickly). Continuing your iron therapy should help resolve this component.` : ""}
${profile.chronicConditions?.some(c => /asthma/i.test(c)) ? "• Avoid frequent NSAID use (Ibuprofen, Aspirin) for headaches — Paracetamol is the preferred analgesic for you." : ""}

**Evidence-Based Relief:**
1. Paracetamol 500–650mg with water (avoid taking more than 3 days per week).
2. Rest in a dark, quiet room. Cold compress on forehead for migraine.
3. Stay well-hydrated — 2.5–3L water daily; dehydration is the #1 trigger.

**🚨 Seek emergency care immediately if:**
Headache peaks in intensity within 60 seconds ("thunderclap"), is accompanied by neck stiffness, fever, vision loss, or new neurological symptoms.`,
      sources: KB.neurology,
      suggestedActions: [
        { label: "Consult Neurologist", action: "doctors", page: "find-doctors" },
        { label: "Run Symptom Assessment", action: "symptom" },
      ],
    };
  }

  // ─── RENAL ────────────────────────────────────────────────────────────────
  if (topic === "renal") {
    const creatinine = getLatestBiomarker(reports, "creatinine") || "not recently tested";
    return {
      category: "Renal & Urinary Health",
      answer: `### 🫘 Kidney & Urinary Health Assessment

**Hello ${name},**

**Your Latest Creatinine:** ${creatinine}
*(Normal: 0.5–1.1 mg/dL for females; 0.7–1.3 mg/dL for males)*

**Kidney Health Indicators to Know:**
- Serum Creatinine and eGFR reflect filtering capacity.
- Urine protein (albumin) is the earliest sign of kidney stress.
- eGFR >90 mL/min/1.73m² = normal function.

**Keeping Your Kidneys Healthy:**
- Drink **2–3 litres of water daily** (more in summer / during exercise).
- Limit excessive protein intake (>2g/kg/day) if any kidney concerns exist.
- Control blood pressure (<130/80 mmHg) — hypertension is the #2 cause of CKD.
- Avoid long-term unsupervised NSAIDs (Ibuprofen, Diclofenac) — they reduce renal blood flow.

**UTI Symptoms? (Burning urination, frequent urge, cloudy urine)**
- Increase water intake significantly.
- Consult a doctor for a urine culture before starting antibiotics.
- Cranberry extract (D-mannose) may reduce recurrence frequency.`,
      sources: KB.renal,
      suggestedActions: [
        { label: "Book Kidney Function Test", action: "labs", page: "labs" },
        { label: "Consult Nephrologist", action: "doctors", page: "find-doctors" },
      ],
    };
  }

  // ─── MENTAL HEALTH ────────────────────────────────────────────────────────
  if (topic === "mental_health") {
    return {
      category: "Mental & Emotional Health",
      answer: `### 🧘 Mental Health & Wellness Assessment

**Hello ${name},**

It takes courage to ask about mental health — and it is just as important as physical health.

**Common Signs of Anxiety:**
- Persistent worry that is hard to control
- Physical symptoms: racing heart, shallow breathing, restlessness, trouble sleeping

**Common Signs of Depression:**
- Persistent low mood, lack of interest in things you usually enjoy
- Fatigue, sleep changes (too much or too little), difficulty concentrating

**Evidence-Based Approaches:**
1. **CBT (Cognitive Behavioral Therapy):** Most effective non-pharmacological treatment — structured thoughts and behavioural change.
2. **Exercise:** 30 minutes of aerobic exercise 3×/week shows antidepressant-equivalent effects in mild depression (increases BDNF, serotonin).
3. **Sleep hygiene:** Consistent wake time, no screens 1 hour before bed, dark/cool room.
4. **Mindfulness:** 10–15 minutes of deep breathing or body scan meditation daily.

**When to seek professional help:**
- Symptoms persist >2 weeks and affect daily functioning.
- You are having thoughts of self-harm. → If so: **iCall India: 9152987821** | **Vandrevala Foundation: 1860-2662-345** (24/7)

You are not alone, and effective help is available.`,
      sources: KB.mental_health,
      suggestedActions: [
        { label: "Consult Psychiatrist", action: "doctors", page: "find-doctors" },
      ],
    };
  }

  // ─── SLEEP ────────────────────────────────────────────────────────────────
  if (topic === "sleep") {
    return {
      category: "Sleep Health",
      answer: `### 😴 Sleep Health Assessment

**Hello ${name},**

**How much sleep do you need?**
Adults need **7–9 hours** of quality sleep per night. Chronic short sleep (<6 hours) increases risk of hypertension, diabetes, obesity, and immune suppression.

**Evidence-Based Sleep Hygiene:**
1. **Fixed schedule:** Wake up at the same time every day — even weekends. This anchors your circadian rhythm.
2. **Cut caffeine after 2 PM:** Caffeine has a half-life of 5–7 hours in the body.
3. **Dark, cool room:** 18–20°C is optimal for sleep onset. Blackout curtains help.
4. **Screen-free 60 minutes before bed:** Blue light suppresses melatonin production.
5. **Wind-down routine:** Reading, light stretching, or a warm shower 30 min before sleep.

**Natural Sleep Aids:**
- Ashwagandha (600mg extract) reduces cortisol and improves sleep quality in clinical trials.
- Warm milk with a pinch of nutmeg has mild sedative properties.

${medications.some(m => /cetirizine|antihistamine/i.test(m.name)) ? "• Your Cetirizine can cause drowsiness as a side effect — if sleep trouble persists even with it, discuss switching to a non-sedating antihistamine with your doctor." : ""}

**CBT for Insomnia (CBT-I)** is the gold standard — more effective long-term than sleeping pills.`,
      sources: KB.sleep,
      suggestedActions: [
        { label: "Consult Psychiatrist / Sleep Specialist", action: "doctors", page: "find-doctors" },
      ],
    };
  }

  // ─── MUSCULOSKELETAL ──────────────────────────────────────────────────────
  if (topic === "musculoskeletal") {
    const hasAsthma = profile.chronicConditions?.some(c => /asthma/i.test(c));
    return {
      category: "Musculoskeletal Health",
      answer: `### 🦴 Joint & Muscle Health Assessment

**Hello ${name},**

**For Acute Back Pain or Muscle Strain:**
- Early gentle movement is **superior to bed rest** — studies consistently show faster recovery.
- Heat pack (warm water bottle) for muscle spasms; ice for the first 48 hours of acute injuries.
- Analgesics: ${hasAsthma ? "Paracetamol is preferred for you due to your asthma." : "Paracetamol or short-course Ibuprofen with food are first-line options."}

**For Joint Pain / Arthritis:**
- Low-impact exercise (swimming, cycling, yoga) maintains joint mobility without additional wear.
- Maintain a healthy BMI (currently: ${profile.weight && profile.height ? (profile.weight / ((profile.height / 100) ** 2)).toFixed(1) : "N/A"}) — every 1 kg of weight lost reduces knee joint load by approximately 4 kg.

**For Gout (High Uric Acid):**
- Target serum urate <6.0 mg/dL.
- Restrict: red meat, organ meats, shellfish, beer, high-fructose corn syrup.
- Increase: low-fat dairy, cherries, adequate water (3L/day).

**When to see a doctor urgently:**
- Joint pain with redness, warmth, and fever (may indicate septic arthritis — a medical emergency).
- Sudden inability to bear weight after an injury.`,
      sources: KB.musculoskeletal,
      suggestedActions: [
        { label: "Consult Orthopedic Surgeon", action: "doctors", page: "find-doctors" },
        { label: "Book Uric Acid Test", action: "labs", page: "labs" },
      ],
    };
  }

  // ─── NUTRITION / DIET ──────────────────────────────────────────────────────
  if (topic === "nutrition") {
    const hb = getLatestBiomarker(reports, "hemoglobin") || "unknown";
    const conditions = profile.chronicConditions || [];
    return {
      category: "Nutrition & Diet",
      answer: `### 🥗 Personalised Nutrition Guide

**Hello ${name},**

Based on your health profile:

${conditions.some(c => /asthma/i.test(c)) ? `**Respiratory-Friendly Foods:**
- Anti-inflammatory diet: turmeric, ginger, omega-3 (fish, flaxseeds, walnuts)
- Vitamin D (sunlight + fortified foods / supplements) supports lung immunity
- Avoid sulphite-containing foods (dried fruits, processed meats) — can trigger bronchospasm in some asthmatics` : ""}

${(hb.includes("11") || hb.includes("Low")) ? `**Iron-Rich Foods for Your Anemia:**
- Leafy greens: spinach (palak), methi (fenugreek), amaranth (rajgira)
- Legumes: masoor dal, chana, rajma, kidney beans
- Seeds: pumpkin seeds, sesame (til), sunflower seeds
- Fruit: pomegranate, dates (khajoor), dried figs
- Pair iron foods with Vitamin C sources: amla, lemon juice, oranges` : ""}

**General Balanced Indian Diet (ICMR-NIN Guidelines):**
- **Carbs:** Whole grains (brown rice, jowar, bajra, oats) over refined flour (maida)
- **Protein:** 1g per kg body weight → ~${profile.weight || 60}g/day for you (dal, eggs, low-fat paneer, curd)
- **Fats:** Prefer cold-pressed oils (mustard, groundnut, olive); limit ghee to 2–3 tsp/day
- **Water:** 8–10 glasses daily; more in summer

**Avoid:**
- Added sugar >5% of total calories
- Ultra-processed packaged foods
- Excessive salt (target <5g/day)`,
      sources: KB.nutrition,
      suggestedActions: [
        { label: "Order Supplements from Pharmacy", action: "pharmacy", page: "pharmacy" },
        { label: "Book Full Body Health Check", action: "labs", page: "labs" },
      ],
    };
  }

  // ─── MEDICATION GENERAL ───────────────────────────────────────────────────
  if (topic === "medication_general") {
    const meds = medications;
    if (!meds.length) {
      return {
        category: "Medication Review",
        answer: `### 💊 Medication Review\n\nNo active medications are recorded in your profile yet. If you have prescriptions, you can upload them in the Records section and I'll analyse them for you.`,
        sources: [],
        suggestedActions: [{ label: "Upload a Prescription", action: "records", page: "records" }],
      };
    }

    // Check any low stock
    const lowStock = meds.filter(m => m.stock <= 10);

    return {
      category: "Medication Review & Safety",
      answer: `### 💊 Your Active Medications Review

**Hello ${name},**

**Current Prescriptions (${meds.length} active):**
${meds.map(m => `\n**${m.name}** (${m.dosage})
- Frequency: ${m.frequency}
- Prescribed by: ${m.prescribedBy}
- Remaining stock: ${m.stock <= 10 ? `⚠️ **${m.stock} tablets — LOW STOCK**` : `✅ ${m.stock} tablets`}
${m.instructions ? `- Instructions: ${m.instructions}` : ""}`).join("\n")}

**Key Reminders:**
- Montelukast → take at **night**
- Ferrous Sulphate → take **after food** with Vitamin C
- Cetirizine → take **at night** (causes drowsiness)

${lowStock.length > 0 ? `⚠️ **Low Stock Alert:** ${lowStock.map(m => m.name).join(", ")} — refill soon.` : ""}`,
      sources: [],
      suggestedActions: [
        ...(lowStock.length > 0 ? [{ label: "Refill Medicines", action: "pharmacy", page: "pharmacy" }] : []),
        { label: "Check Drug Interactions", action: "interaction_check" },
      ],
    };
  }

  // ─── BOOK DOCTOR ─────────────────────────────────────────────────────────
  if (topic === "book_doctor") {
    return {
      category: "Doctor & Appointment",
      answer: `### 🩺 Finding the Right Doctor for You

**Hello ${name},** I can help you find the right specialist.

**Available Specialists on EasyHealth:**
- ❤️ **Cardiologist** — heart health, palpitations, BP issues
- 🧠 **Neurologist** — headaches, migraines, dizziness, nerve issues
- 🫁 **Pulmonologist** — asthma, breathing, cough, lung function
- 👶 **Pediatrician** — children's health
- 🌸 **Gynecologist** — women's health, hormones, fertility
- 🔬 **Endocrinologist** — diabetes, thyroid, hormonal disorders
- 🦴 **Orthopedic Surgeon** — joint pain, back pain, fractures
- 🧴 **Dermatologist** — skin rashes, acne, hair loss

Based on your profile (${getConditionsList(profile)}), I'd suggest your next consult with a **Pulmonologist** to review your asthma management, and scheduling a follow-up **CBC blood test** to track your hemoglobin recovery.`,
      sources: [],
      suggestedActions: [
        { label: "Browse All Doctors", action: "doctors", page: "find-doctors" },
        { label: "Book a Lab Test", action: "labs", page: "labs" },
      ],
    };
  }

  // ─── GENERAL FALLBACK (dynamic, NOT hardcoded) ────────────────────────────
  const conditionContext = profile.chronicConditions?.length
    ? `Given your records showing **${profile.chronicConditions.join(" and ")}** and current medications (${medications.map(m => m.name).join(", ")}), `
    : "";

  return {
    category: "General Clinical Guidance",
    answer: `### 🩺 Clinical Response: "${query}"

**Hello ${name},**

${allergyWarn ? `${allergyWarn}\n\n` : ""}${conditionContext}here is relevant clinical information for your query:

I wasn't able to match your question to a specific clinical protocol. Here's what you can do:

1. **Be more specific** — try asking things like:
   - "Explain my blood test results"
   - "What should I eat for my anemia?"
   - "Is it safe to take ibuprofen?"
   - "My HbA1c is 6.2 — what does that mean?"
   - "I have a fever of 102°F — what should I do?"
   - "What are my current medications?"

2. **Quick actions below** — I can directly help you review your records, check medications, or find a doctor.

3. **Symptom Assessment** — tap the button below for a step-by-step symptom checker.`,
    sources: [],
    suggestedActions: [
      { label: "View My Health Summary", action: "health_summary" },
      { label: "Run Symptom Assessment", action: "symptom" },
      { label: "Find a Doctor", action: "doctors", page: "find-doctors" },
      { label: "View My Reports", action: "records", page: "records" },
    ],
  };
}
