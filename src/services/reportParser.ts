import { BiomarkerResult } from "../types";

// ─── All medical parameter patterns ──────────────────────────────────────────
// Each entry: [regex to find the line, unit hint]
const PARAMETER_PATTERNS: { regex: RegExp; unit: string; ref: string; label: string }[] = [
  // ── Haematology ────────────────────────────────────────────────────────────
  { regex: /haemoglobin|hemoglobin|hb\b|hgb/i,       unit: "g/dL",    ref: "12.0–15.5 (F) / 13.5–17.5 (M)", label: "Hemoglobin" },
  { regex: /packed cell vol|hematocrit|pcv\b|hct\b/i, unit: "%",      ref: "36–46 (F) / 40–52 (M)",          label: "Hematocrit (PCV)" },
  { regex: /rbc count|red blood cell|erythrocyte/i,   unit: "mil/μL", ref: "3.8–5.2 (F) / 4.5–6.0 (M)",     label: "RBC Count" },
  { regex: /wbc|white blood cell|leucocyte|leukocyte|tlc\b/i, unit: "/μL", ref: "4,000–11,000",              label: "WBC Count" },
  { regex: /platelet|plt\b|thrombocyte/i,             unit: "/μL",    ref: "150,000–450,000",                 label: "Platelet Count" },
  { regex: /mcv\b/i,                                  unit: "fL",     ref: "80–100",                         label: "MCV" },
  { regex: /mch\b(?!r)/i,                             unit: "pg",     ref: "27–33",                          label: "MCH" },
  { regex: /mchc\b/i,                                 unit: "g/dL",   ref: "31.5–36",                        label: "MCHC" },
  { regex: /rdw\b/i,                                  unit: "%",      ref: "11.5–14.5",                      label: "RDW" },
  { regex: /neutrophil/i,                             unit: "%",      ref: "50–70",                          label: "Neutrophils" },
  { regex: /lymphocyte/i,                             unit: "%",      ref: "20–40",                          label: "Lymphocytes" },
  { regex: /monocyte/i,                               unit: "%",      ref: "2–10",                           label: "Monocytes" },
  { regex: /eosinophil/i,                             unit: "%",      ref: "1–6",                            label: "Eosinophils" },
  { regex: /basophil/i,                               unit: "%",      ref: "0–1",                            label: "Basophils" },
  { regex: /esr\b|erythrocyte sedimentation/i,        unit: "mm/hr",  ref: "0–20 (F) / 0–15 (M)",           label: "ESR" },

  // ── Lipid Profile ──────────────────────────────────────────────────────────
  { regex: /total cholesterol(?! hdl| ldl)/i,         unit: "mg/dL",  ref: "< 200",                          label: "Total Cholesterol" },
  { regex: /hdl[\s\-]?cholesterol|hdl\b/i,            unit: "mg/dL",  ref: "> 50 (F) / > 40 (M)",           label: "HDL Cholesterol" },
  { regex: /ldl[\s\-]?cholesterol|ldl\b/i,            unit: "mg/dL",  ref: "< 100",                          label: "LDL Cholesterol" },
  { regex: /triglyceride|tg\b/i,                      unit: "mg/dL",  ref: "< 150",                          label: "Triglycerides" },
  { regex: /vldl\b/i,                                 unit: "mg/dL",  ref: "< 30",                           label: "VLDL Cholesterol" },
  { regex: /non[\s\-]?hdl/i,                          unit: "mg/dL",  ref: "< 130",                          label: "Non-HDL Cholesterol" },

  // ── Diabetes ───────────────────────────────────────────────────────────────
  { regex: /fasting\s+(blood\s+)?glucose|fbs\b|fbg\b/i,      unit: "mg/dL", ref: "70–99",    label: "Fasting Blood Glucose" },
  { regex: /postprandial|pp\s+glucose|ppbs\b|2\s*hr\s+glucose/i, unit: "mg/dL", ref: "< 140", label: "Postprandial Glucose" },
  { regex: /random\s+(blood\s+)?glucose|rbs\b|rbg\b/i,       unit: "mg/dL", ref: "70–140",   label: "Random Blood Glucose" },
  { regex: /hba1c|glycated\s+hemo|glycosylated/i,            unit: "%",     ref: "< 5.7",    label: "HbA1c" },
  { regex: /insulin\s+fasting/i,                             unit: "μIU/mL",ref: "2–25",     label: "Fasting Insulin" },

  // ── Liver Function ─────────────────────────────────────────────────────────
  { regex: /total\s+bilirubin(?!\s*direct|\s*indirect)/i,    unit: "mg/dL", ref: "0.2–1.2",  label: "Total Bilirubin" },
  { regex: /direct\s+bilirubin|conjugated/i,                 unit: "mg/dL", ref: "0.0–0.3",  label: "Direct Bilirubin" },
  { regex: /indirect\s+bilirubin|unconjugated/i,             unit: "mg/dL", ref: "0.1–0.9",  label: "Indirect Bilirubin" },
  { regex: /sgpt|alt\b|alanine\s+(amino|trans)/i,            unit: "U/L",   ref: "7–56",     label: "SGPT (ALT)" },
  { regex: /sgot|ast\b|aspartate\s+(amino|trans)/i,          unit: "U/L",   ref: "10–40",    label: "SGOT (AST)" },
  { regex: /alkaline\s+phosphatase|alp\b/i,                  unit: "U/L",   ref: "44–147",   label: "Alkaline Phosphatase" },
  { regex: /gamma[\s\-]?gt|ggt\b/i,                          unit: "U/L",   ref: "9–48",     label: "GGT" },
  { regex: /total\s+protein(?!\s+albumin)/i,                  unit: "g/dL",  ref: "6.3–8.2",  label: "Total Protein" },
  { regex: /albumin(?!\s+creatinine)/i,                       unit: "g/dL",  ref: "3.4–5.4",  label: "Albumin" },
  { regex: /globulin/i,                                       unit: "g/dL",  ref: "2.0–3.5",  label: "Globulin" },
  { regex: /a[\s\/]g\s+ratio|albumin.globulin/i,             unit: "",      ref: "1.2–2.2",  label: "A/G Ratio" },

  // ── Kidney Function ────────────────────────────────────────────────────────
  { regex: /serum\s+creatinine|creatinine(?!\s+clearance|\s+urine)/i, unit: "mg/dL", ref: "0.6–1.1 (F) / 0.7–1.3 (M)", label: "Serum Creatinine" },
  { regex: /blood\s+urea\s+nitrogen|bun\b/i,                 unit: "mg/dL", ref: "7–20",     label: "BUN" },
  { regex: /urea(?!\s+nitrogen)/i,                            unit: "mg/dL", ref: "15–45",    label: "Blood Urea" },
  { regex: /uric\s+acid/i,                                    unit: "mg/dL", ref: "2.4–6.0 (F) / 3.5–7.2 (M)", label: "Uric Acid" },
  { regex: /egfr|estimated\s+gfr|glomerular\s+filtration/i,  unit: "mL/min/1.73m²", ref: "> 90", label: "eGFR" },
  { regex: /sodium\b(?!\s+urine)/i,                           unit: "mEq/L", ref: "136–145",  label: "Sodium" },
  { regex: /potassium\b(?!\s+urine)/i,                        unit: "mEq/L", ref: "3.5–5.0",  label: "Potassium" },
  { regex: /chloride\b/i,                                     unit: "mEq/L", ref: "98–107",   label: "Chloride" },
  { regex: /bicarbonate|hco3\b/i,                             unit: "mEq/L", ref: "22–29",    label: "Bicarbonate" },
  { regex: /calcium\b(?!\s+urine)/i,                          unit: "mg/dL", ref: "8.5–10.5", label: "Calcium" },
  { regex: /phosphorus|phosphate\b/i,                         unit: "mg/dL", ref: "2.5–4.5",  label: "Phosphorus" },
  { regex: /magnesium\b/i,                                    unit: "mg/dL", ref: "1.7–2.3",  label: "Magnesium" },
  { regex: /creatinine\s+clearance/i,                         unit: "mL/min",ref: "90–120",   label: "Creatinine Clearance" },

  // ── Thyroid ────────────────────────────────────────────────────────────────
  { regex: /tsh\b|thyroid\s+stimulating/i,                   unit: "mIU/L", ref: "0.4–4.5",  label: "TSH" },
  { regex: /free\s+t3|ft3\b/i,                               unit: "pg/mL", ref: "2.3–4.2",  label: "Free T3 (FT3)" },
  { regex: /free\s+t4|ft4\b/i,                               unit: "ng/dL", ref: "0.8–1.8",  label: "Free T4 (FT4)" },
  { regex: /total\s+t3(?!\s*free|\s*ft)/i,                   unit: "ng/dL", ref: "80–200",   label: "Total T3" },
  { regex: /total\s+t4(?!\s*free|\s*ft)/i,                   unit: "μg/dL", ref: "5.0–12.0", label: "Total T4" },

  // ── Vitamins & Minerals ────────────────────────────────────────────────────
  { regex: /vitamin\s*d\s*total|25[\s\-]?oh[\s\-]?d|calcidiol/i, unit: "ng/mL", ref: "30–100", label: "Vitamin D (25-OH)" },
  { regex: /vitamin\s*b[\s\-]?12|cobalamin/i,                unit: "pg/mL", ref: "200–900",  label: "Vitamin B12" },
  { regex: /folate|folic\s+acid\b/i,                         unit: "ng/mL", ref: "3.0–17.0", label: "Folate" },
  { regex: /ferritin\b/i,                                    unit: "ng/mL", ref: "12–150 (F) / 12–300 (M)", label: "Ferritin" },
  { regex: /serum\s+iron(?!\s+binding)/i,                    unit: "μg/dL", ref: "60–170",   label: "Serum Iron" },
  { regex: /tibc\b|total\s+iron\s+binding/i,                 unit: "μg/dL", ref: "250–370",  label: "TIBC" },
  { regex: /transferrin\s+saturation/i,                      unit: "%",     ref: "20–50",    label: "Transferrin Saturation" },
  { regex: /zinc\b/i,                                        unit: "μg/dL", ref: "60–130",   label: "Zinc" },

  // ── Cardiac Markers ────────────────────────────────────────────────────────
  { regex: /troponin[\s\-]?i\b/i,                            unit: "ng/mL", ref: "< 0.04",   label: "Troponin I" },
  { regex: /troponin[\s\-]?t\b/i,                            unit: "ng/mL", ref: "< 0.1",    label: "Troponin T" },
  { regex: /creatine\s+kinase|ck\b(?!\s*mb)/i,               unit: "U/L",   ref: "24–170",   label: "Creatine Kinase (CK)" },
  { regex: /ck[\s\-]?mb\b/i,                                 unit: "U/L",   ref: "< 25",     label: "CK-MB" },
  { regex: /bnp\b|b[\s\-]?type\s+natriuretic/i,             unit: "pg/mL", ref: "< 100",    label: "BNP" },
  { regex: /crp\b|c[\s\-]?reactive\s+protein/i,             unit: "mg/L",  ref: "< 5.0",    label: "CRP" },
  { regex: /homocysteine/i,                                   unit: "μmol/L",ref: "5–15",     label: "Homocysteine" },

  // ── Hormones ───────────────────────────────────────────────────────────────
  { regex: /testosterone(?!\s*free)/i,                        unit: "ng/dL", ref: "270–1070 (M) / 15–70 (F)", label: "Testosterone" },
  { regex: /estradiol|e2\b/i,                                 unit: "pg/mL", ref: "15–350 (F)",label: "Estradiol (E2)" },
  { regex: /fsh\b|follicle\s+stimulating/i,                  unit: "mIU/mL",ref: "3–10 (F premenopausal)", label: "FSH" },
  { regex: /lh\b|luteinizing/i,                               unit: "mIU/mL",ref: "2–15",     label: "LH" },
  { regex: /prolactin/i,                                      unit: "ng/mL", ref: "2–29 (F) / 2–18 (M)", label: "Prolactin" },
  { regex: /cortisol\b/i,                                     unit: "μg/dL", ref: "6–23 (morning)",      label: "Cortisol" },
  { regex: /insulin\s*(?!fasting)/i,                          unit: "μIU/mL",ref: "2–25",     label: "Insulin" },

  // ── Inflammation / Infection ───────────────────────────────────────────────
  { regex: /esr\b|erythrocyte\s+sed/i,                       unit: "mm/hr", ref: "0–20",     label: "ESR" },
  { regex: /procalcitonin|pct\b/i,                           unit: "ng/mL", ref: "< 0.1",    label: "Procalcitonin" },
  { regex: /il[\s\-]?6\b|interleukin/i,                      unit: "pg/mL", ref: "< 7",      label: "IL-6" },

  // ── Urine Parameters ──────────────────────────────────────────────────────
  { regex: /urine\s+ph\b/i,                                  unit: "",      ref: "4.5–8.0",  label: "Urine pH" },
  { regex: /urine\s+specific\s+gravity/i,                    unit: "",      ref: "1.001–1.035", label: "Urine Specific Gravity" },
  { regex: /urine\s+protein|proteinuria/i,                   unit: "",      ref: "Nil",       label: "Urine Protein" },
  { regex: /urine\s+glucose|glucosuria/i,                    unit: "",      ref: "Nil",       label: "Urine Glucose" },
  { regex: /pus\s+cell|wbc.*urine/i,                        unit: "/HPF",  ref: "0–5",       label: "Pus Cells (Urine)" },
  { regex: /rbc.*urine|red.*cell.*urine/i,                  unit: "/HPF",  ref: "0–2",       label: "RBCs (Urine)" },
  { regex: /epithelial.*cell/i,                              unit: "/HPF",  ref: "0–5",       label: "Epithelial Cells" },
  { regex: /urine\s+ketone/i,                                unit: "",      ref: "Nil",       label: "Urine Ketones" },
  { regex: /urine\s+bilirubin/i,                             unit: "",      ref: "Nil",       label: "Urine Bilirubin" },
  { regex: /microalbumin/i,                                  unit: "mg/L",  ref: "< 20",      label: "Microalbumin" },
  { regex: /albumin[\s\/]creatinine|acr\b/i,                 unit: "mg/g",  ref: "< 30",      label: "Albumin:Creatinine Ratio" },
];

// ─── Determine status from value and reference range ─────────────────────────
function inferStatus(value: string, ref: string): BiomarkerResult["status"] {
  // Handle qualitative values
  const v = value.toLowerCase().trim();
  if (/nil|negative|absent|not found|normal/i.test(v)) return "Normal";
  if (/positive|present|found|trace/i.test(v)) return "High";

  const num = parseFloat(value.replace(/,/g, ""));
  if (isNaN(num)) return "Normal";

  // Parse reference range: "12.0 - 15.5", "< 200", "> 50", "70–99"
  const ltMatch = ref.match(/^<\s*([\d.]+)/);
  const gtMatch = ref.match(/^>\s*([\d.]+)/);
  const rangeMatch = ref.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);

  if (ltMatch) {
    const upper = parseFloat(ltMatch[1]);
    if (num > upper * 1.3) return "Critical";
    if (num > upper) return "High";
    return "Normal";
  }
  if (gtMatch) {
    const lower = parseFloat(gtMatch[1]);
    if (num < lower * 0.7) return "Critical";
    if (num < lower) return "Low";
    return "Normal";
  }
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1]);
    const high = parseFloat(rangeMatch[2]);
    if (num < low * 0.8 || num > high * 1.3) return "Critical";
    if (num < low) return "Low";
    if (num > high) return "High";
    return "Normal";
  }
  return "Normal";
}

// ─── Extract a numeric/text value from text near the parameter name ───────────
function extractValueFromLine(line: string): string | null {
  // Pattern: grab the first number (with optional commas/decimals) or qualitative word
  const qualitative = line.match(/\b(nil|negative|positive|absent|present|trace|not\s+detected|detected)\b/i);
  if (qualitative) return qualitative[1];

  // Number with optional comma separators
  const numMatch = line.match(/[\d,]+\.?\d*/);
  if (numMatch) return numMatch[0].replace(/,/g, "");

  return null;
}

// ─── Main parser: takes raw text from PDF/image and returns biomarkers ────────
export function parseReportText(rawText: string): BiomarkerResult[] {
  const lines = rawText.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
  const found: BiomarkerResult[] = [];
  const seenLabels = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Also look at next 1 line in case value is on the following line
    const context = line + " " + (lines[i + 1] || "");

    for (const pattern of PARAMETER_PATTERNS) {
      if (!pattern.regex.test(line)) continue;
      if (seenLabels.has(pattern.label)) continue;

      let value = extractValueFromLine(context);
      if (!value) {
        // Try just the current line
        value = extractValueFromLine(line);
      }
      if (!value) continue;

      const status = inferStatus(value, pattern.ref);
      found.push({
        parameter: pattern.label,
        value,
        unit: pattern.unit,
        referenceRange: pattern.ref,
        status,
        explanation: status === "Normal"
          ? `Within normal range.`
          : status === "Low"
          ? `Below normal — discuss with your doctor.`
          : status === "High"
          ? `Above normal range — requires medical attention.`
          : `Critically out of range — consult a doctor urgently.`,
      });
      seenLabels.add(pattern.label);
      break; // one pattern per line
    }
  }

  return found;
}

// ─── PDF text extractor using pdfjs-dist ─────────────────────────────────────
export async function extractTextFromPDF(file: File): Promise<string> {
  // Dynamically import to avoid SSR issues
  const pdfjsLib = await import("pdfjs-dist");

  // Set worker source — use the bundled worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.js",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");
    fullText += pageText + "\n";
  }

  return fullText;
}

// ─── Image text extractor using Tesseract.js ─────────────────────────────────
export async function extractTextFromImage(file: File): Promise<string> {
  const Tesseract = await import("tesseract.js");
  const { data } = await Tesseract.recognize(file, "eng", {
    logger: () => {}, // suppress progress logs
  });
  return data.text;
}

// ─── Auto-detect file type and extract ───────────────────────────────────────
export async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return extractTextFromPDF(file);
  }
  if (file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|bmp|tiff?)$/i.test(file.name)) {
    return extractTextFromImage(file);
  }
  throw new Error("Unsupported file type. Please upload a PDF or image file.");
}

// ─── Generate AI summary from biomarkers ─────────────────────────────────────
export function generateSummary(biomarkers: BiomarkerResult[], reportName: string): string {
  if (biomarkers.length === 0) {
    return `${reportName} uploaded. No structured parameters could be automatically extracted — the report may use an unusual format. Please add parameters manually using the 'Add with Values' option.`;
  }

  const abnormal = biomarkers.filter(b => b.status !== "Normal");
  const critical = biomarkers.filter(b => b.status === "Critical");
  const low = biomarkers.filter(b => b.status === "Low");
  const high = biomarkers.filter(b => b.status === "High");
  const normal = biomarkers.filter(b => b.status === "Normal");

  let summary = `Extracted ${biomarkers.length} parameter${biomarkers.length !== 1 ? "s" : ""} from ${reportName}. `;

  if (normal.length > 0) {
    summary += `${normal.length} parameter${normal.length !== 1 ? "s are" : " is"} within normal range. `;
  }

  if (critical.length > 0) {
    summary += `⚠️ CRITICAL: ${critical.map(b => `${b.parameter} (${b.value} ${b.unit})`).join(", ")} — urgent medical review needed. `;
  }

  if (high.length > 0) {
    summary += `Elevated: ${high.map(b => `${b.parameter} (${b.value} ${b.unit})`).join(", ")}. `;
  }

  if (low.length > 0) {
    summary += `Below normal: ${low.map(b => `${b.parameter} (${b.value} ${b.unit})`).join(", ")}. `;
  }

  if (abnormal.length === 0) {
    summary += "All parameters are within acceptable reference ranges. Good overall result.";
  } else {
    summary += "Consult your doctor to discuss the out-of-range values.";
  }

  return summary;
}
