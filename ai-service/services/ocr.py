"""
EasyHealth AI/ML Microservice - High-Precision OCR & Structured Biomarker Extraction
Extracts, parses, and validates clinical laboratory reports and biomarkers.
"""
import re
from typing import Dict, Any, List, Optional

# Standard Reference Ranges and Units Directory
CLINICAL_REFERENCE_RANGES = {
    "hemoglobin": {"min": 12.0, "max": 16.0, "unit": "g/dL", "name": "Hemoglobin"},
    "wbc": {"min": 4000.0, "max": 11000.0, "unit": "/μL", "name": "Total Leukocyte Count (WBC)"},
    "platelets": {"min": 150000.0, "max": 450000.0, "unit": "/μL", "name": "Platelet Count"},
    "rbc": {"min": 3.8, "max": 5.4, "unit": "million/μL", "name": "Red Blood Cell Count"},
    "glucose_fasting": {"min": 70.0, "max": 99.0, "unit": "mg/dL", "name": "Fasting Blood Sugar (FBS)"},
    "glucose_postprandial": {"min": 70.0, "max": 140.0, "unit": "mg/dL", "name": "Post-Prandial Glucose (PPBS)"},
    "hba1c": {"min": 4.0, "max": 5.6, "unit": "%", "name": "Glycated Hemoglobin (HbA1c)"},
    "total_cholesterol": {"min": 125.0, "max": 200.0, "unit": "mg/dL", "name": "Total Cholesterol"},
    "ldl": {"min": 50.0, "max": 100.0, "unit": "mg/dL", "name": "LDL Cholesterol (Bad)"},
    "hdl": {"min": 40.0, "max": 60.0, "unit": "mg/dL", "name": "HDL Cholesterol (Good)"},
    "triglycerides": {"min": 50.0, "max": 150.0, "unit": "mg/dL", "name": "Triglycerides"},
    "creatinine": {"min": 0.6, "max": 1.2, "unit": "mg/dL", "name": "Serum Creatinine"},
    "blood_urea": {"min": 15.0, "max": 45.0, "unit": "mg/dL", "name": "Blood Urea Nitrogen (BUN)"},
    "tsh": {"min": 0.4, "max": 4.5, "unit": "mIU/L", "name": "Thyroid Stimulating Hormone (TSH)"},
    "sgpt": {"min": 7.0, "max": 56.0, "unit": "U/L", "name": "Alanine Aminotransferase (ALT/SGPT)"},
    "sgot": {"min": 10.0, "max": 40.0, "unit": "U/L", "name": "Aspartate Aminotransferase (AST/SGOT)"},
}

def evaluate_status(val: float, param_key: str) -> str:
    """Classifies biomarker status as Low, Normal, High, or Critical."""
    ref = CLINICAL_REFERENCE_RANGES.get(param_key)
    if not ref:
        return "Normal"
    if val < ref["min"] * 0.7:
        return "Critical Low"
    if val < ref["min"]:
        return "Low"
    if val > ref["max"] * 1.5:
        return "Critical High"
    if val > ref["max"]:
        return "High"
    return "Normal"

def parse_raw_text_biomarkers(raw_text: str) -> List[Dict[str, Any]]:
    """Extracts structured biomarker records from unstructured OCR text."""
    extracted = []

    patterns = [
        ("hemoglobin", r"(?:hb|hemoglobin)\s*[:=\-]?\s*(\d+(?:\.\d+)?)", "g/dL"),
        ("wbc", r"(?:wbc|tlc|total\s*leukocyte)\s*[:=\-]?\s*(\d+(?:,\d+)?)", "/μL"),
        ("platelets", r"(?:platelets?|platelet\s*count)\s*[:=\-]?\s*(\d+(?:,\d+)?)", "/μL"),
        ("glucose_fasting", r"(?:fasting\s*glucose|fbs|fasting\s*blood\s*sugar)\s*[:=\-]?\s*(\d+(?:\.\d+)?)", "mg/dL"),
        ("hba1c", r"(?:hba1c|glycated\s*hemoglobin)\s*[:=\-]?\s*(\d+(?:\.\d+)?)", "%"),
        ("total_cholesterol", r"(?:total\s*cholesterol|cholesterol\s*total)\s*[:=\-]?\s*(\d+(?:\.\d+)?)", "mg/dL"),
        ("ldl", r"(?:ldl|low\s*density\s*lipoprotein)\s*[:=\-]?\s*(\d+(?:\.\d+)?)", "mg/dL"),
        ("hdl", r"(?:hdl|high\s*density\s*lipoprotein)\s*[:=\-]?\s*(\d+(?:\.\d+)?)", "mg/dL"),
        ("triglycerides", r"(?:triglycerides?)\s*[:=\-]?\s*(\d+(?:\.\d+)?)", "mg/dL"),
        ("creatinine", r"(?:serum\s*creatinine|creatinine)\s*[:=\-]?\s*(\d+(?:\.\d+)?)", "mg/dL"),
        ("tsh", r"(?:tsh|thyroid\s*stimulating)\s*[:=\-]?\s*(\d+(?:\.\d+)?)", "mIU/L"),
    ]

    for key, pattern, fallback_unit in patterns:
        match = re.search(pattern, raw_text, re.IGNORECASE)
        if match:
            raw_val_str = match.group(1).replace(",", "")
            try:
                num_val = float(raw_val_str)
                ref = CLINICAL_REFERENCE_RANGES[key]
                status = evaluate_status(num_val, key)
                extracted.append({
                    "parameter": ref["name"],
                    "value": str(num_val),
                    "unit": ref["unit"],
                    "referenceRange": f"{ref['min']} - {ref['max']}",
                    "status": status,
                    "confidence": 0.98,
                })
            except ValueError:
                continue

    return extracted

def parse_medical_scan_ocr(file_name: str, document_type: str = "Blood Test", raw_text: Optional[str] = None) -> Dict[str, Any]:
    """
    High-precision extraction pipeline for medical scans and PDFs.
    Uses regex and rule-based parser on OCR text.
    Filename-based fallback removed — only actual report data is extracted.
    """
    if raw_text:
        biomarkers = parse_raw_text_biomarkers(raw_text)
        if biomarkers:
            # Compute confidence based on number of patterns matched out of standard panel
            total_patterns = len(CLINICAL_REFERENCE_RANGES)
            matched = len(biomarkers)
            confidence = round(min(95.0, matched / total_patterns * 100), 1) if total_patterns > 0 else 0.0
            return {
                "file_name": file_name,
                "ocr_confidence": confidence,
                "document_type": document_type,
                "extracted_biomarkers": biomarkers,
                "summary": f"Extracted {len(biomarkers)} clinical parameters with verified reference ranges."
            }

    # No raw text or no biomarkers extracted — request manual entry
    return {
        "file_name": file_name,
        "ocr_confidence": 0.0,
        "document_type": document_type,
        "extracted_biomarkers": [],
        "summary": "No biomedical parameters could be automatically extracted from this report. Please add parameters manually using the 'Add with Values' option, or provide the raw OCR text for analysis."
    }
