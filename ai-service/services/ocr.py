"""
EasyHealth AI/ML Microservice - OCR Report & Prescription Text Extraction
"""
from typing import Dict, Any, List

def parse_medical_scan_ocr(file_name: str, document_type: str = "Blood Test") -> Dict[str, Any]:
    """
    Simulates high-precision OCR extraction of medical lab scan documents.
    """
    if "lipid" in file_name.lower():
        biomarkers = [
            {"parameter": "Total Cholesterol", "value": "185", "unit": "mg/dL", "referenceRange": "< 200", "status": "Normal"},
            {"parameter": "HDL Cholesterol", "value": "48", "unit": "mg/dL", "referenceRange": "> 50", "status": "Low"},
            {"parameter": "LDL Cholesterol", "value": "105", "unit": "mg/dL", "referenceRange": "< 100", "status": "High"},
            {"parameter": "Triglycerides", "value": "140", "unit": "mg/dL", "referenceRange": "< 150", "status": "Normal"},
        ]
        summary = "OCR extracted Lipid Profile with 98.2% confidence. Marginal elevation in LDL detected."
    elif "prescription" in file_name.lower():
        biomarkers = [
            {"parameter": "Rx: Ferrous Ascorbate", "value": "100mg", "unit": "Daily", "referenceRange": "Once Daily", "status": "Normal"},
            {"parameter": "Rx: Vitamin D3", "value": "60,000 IU", "unit": "Weekly", "referenceRange": "Weekly x 8wks", "status": "Normal"},
        ]
        summary = "Doctor prescription scan parsed: 2 medications detected with administration timings."
    else:
        # Default Complete Blood Count (CBC)
        biomarkers = [
            {"parameter": "Hemoglobin (Hb)", "value": "11.4", "unit": "g/dL", "referenceRange": "12.0 - 15.5", "status": "Low"},
            {"parameter": "Total WBC Count", "value": "7,200", "unit": "/μL", "referenceRange": "4,000 - 11,000", "status": "Normal"},
            {"parameter": "Platelets", "value": "245,000", "unit": "/μL", "referenceRange": "150,000 - 450,000", "status": "Normal"},
            {"parameter": "RBC Count", "value": "4.1", "unit": "million/μL", "referenceRange": "3.8 - 5.2", "status": "Normal"},
        ]
        summary = "CBC report parsed with 98.7% confidence. Mild iron-deficiency anemia indicated."

    return {
        "file_name": file_name,
        "ocr_confidence": 98.7,
        "document_type": document_type,
        "extracted_biomarkers": biomarkers,
        "summary": summary
    }
