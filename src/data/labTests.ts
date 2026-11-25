import { LabTest } from "../types";

export const labTests: LabTest[] = [
  { id: "l1", name: "Complete Blood Count (CBC)", category: "Blood Tests", price: 350, discountPct: 30, finalPrice: 245, homeCollection: true, reportTime: "6 hours", description: "Measures red cells, white cells, haemoglobin and platelets", popular: true },
  { id: "l2", name: "HbA1c (Glycated Haemoglobin)", category: "Diabetes", price: 650, discountPct: 25, finalPrice: 487, homeCollection: true, reportTime: "24 hours", description: "3-month average blood sugar level", popular: true },
  { id: "l3", name: "Lipid Profile", category: "Cardiac", price: 800, discountPct: 35, finalPrice: 520, homeCollection: true, reportTime: "12 hours", description: "Total cholesterol, LDL, HDL, triglycerides", popular: true },
  { id: "l4", name: "Thyroid Profile (TSH, T3, T4)", category: "Thyroid", price: 950, discountPct: 20, finalPrice: 760, homeCollection: true, reportTime: "24 hours", description: "Full thyroid function panel", popular: false },
  { id: "l5", name: "Urine Routine & Microscopy", category: "Urine Tests", price: 180, discountPct: 10, finalPrice: 162, homeCollection: true, reportTime: "4 hours", description: "Physical, chemical and microscopic examination", popular: false },
  { id: "l6", name: "Liver Function Test (LFT)", category: "Blood Tests", price: 700, discountPct: 30, finalPrice: 490, homeCollection: true, reportTime: "12 hours", description: "SGOT, SGPT, bilirubin, albumin and more", popular: false },
  { id: "l7", name: "Kidney Function Test (KFT)", category: "Blood Tests", price: 600, discountPct: 25, finalPrice: 450, homeCollection: true, reportTime: "12 hours", description: "Creatinine, urea, uric acid, electrolytes", popular: false },
  { id: "l8", name: "Vitamin D Total", category: "Vitamins", price: 1200, discountPct: 40, finalPrice: 720, homeCollection: true, reportTime: "24 hours", description: "25-OH Vitamin D level measurement", popular: true },
  { id: "l9", name: "COVID-19 RT-PCR", category: "Infection", price: 500, discountPct: 0, finalPrice: 500, homeCollection: true, reportTime: "6 hours", description: "Gold standard test for COVID-19 detection", popular: false },
  { id: "l10", name: "Dengue NS1 Antigen + IgM/IgG", category: "Infection", price: 1100, discountPct: 20, finalPrice: 880, homeCollection: true, reportTime: "6 hours", description: "Early and late dengue detection combo", popular: false },
  { id: "l11", name: "Full Body Checkup - Basic", category: "Health Packages", price: 2999, discountPct: 50, finalPrice: 1499, homeCollection: true, reportTime: "24 hours", description: "CBC, blood sugar, lipid, LFT, KFT, thyroid, urine", popular: true, includes: ["CBC", "Blood Sugar (Fasting + PP)", "Lipid Profile", "LFT", "KFT", "Thyroid (TSH)", "Urine Routine"] },
  { id: "l12", name: "Full Body Checkup - Comprehensive", category: "Health Packages", price: 5999, discountPct: 55, finalPrice: 2699, homeCollection: true, reportTime: "48 hours", description: "Complete 60+ parameter health check", popular: true, includes: ["Everything in Basic", "Vitamin B12 & D", "Iron Profile", "HbA1c", "CRP", "ECG", "Chest X-Ray", "Doctor Consultation"] },
  { id: "l13", name: "Women's Health Package", category: "Health Packages", price: 3499, discountPct: 45, finalPrice: 1924, homeCollection: true, reportTime: "24 hours", description: "Tailored health check for women", popular: true, includes: ["CBC", "Hormonal Profile", "Thyroid", "Pap Smear", "Bone Density", "Vitamin Panel"] },
  { id: "l14", name: "Cardiac Risk Assessment", category: "Cardiac", price: 2200, discountPct: 30, finalPrice: 1540, homeCollection: true, reportTime: "24 hours", description: "Comprehensive heart risk profiling", popular: false, includes: ["Lipid Profile", "CRP", "Homocysteine", "ECG", "Troponin I"] },
];

export const labCategories = ["All", "Health Packages", "Blood Tests", "Urine Tests", "Diabetes", "Cardiac", "Thyroid", "Vitamins", "Infection"];
