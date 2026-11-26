"""
EasyHealth AI/ML FastAPI Microservice
Provides REST endpoints for LLM Report Summarization, RAG Clinical QA, OCR Extraction, and Symptom Triaging.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from services.summarizer import analyze_report_biomarkers
from services.rag import query_rag_engine
from services.ocr import parse_medical_scan_ocr
from services.triage import evaluate_symptoms_triage

app = FastAPI(
    title="EasyHealth AI/ML Microservice",
    description="LLM Medical Summarization, RAG Clinical QA, OCR, and Symptom Triaging",
    version="1.0.0"
)

# Enable CORS for React frontend & Node backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Pydantic Request Models ──────────────────────────────────────────────────
class BiomarkerItem(BaseModel):
    parameter: str
    value: str
    unit: str = ""
    referenceRange: str = ""
    status: str = "Normal"

class SummarizeRequest(BaseModel):
    report_title: str
    biomarkers: List[BiomarkerItem]

class RagChatRequest(BaseModel):
    query: str
    patient_context: Optional[Dict[str, Any]] = None

class OcrRequest(BaseModel):
    file_name: str
    document_type: Optional[str] = "Blood Test"
    raw_text: Optional[str] = None

class TriageRequest(BaseModel):
    chief_complaint: str
    duration: str = "1-3 days"
    severity: int = Field(default=5, ge=1, le=10)
    red_flags: List[str] = []

# ─── Endpoints ────────────────────────────────────────────────────────────────
@app.get("/ai/health")
def health_check():
    return {
        "status": "Healthy",
        "service": "EasyHealth Python FastAPI AI Microservice",
        "version": "1.0.0",
        "capabilities": ["LLM Summarization", "RAG Q&A", "OCR Extraction", "Symptom Triage"]
    }

@app.post("/ai/summarize-report")
def summarize_report(req: SummarizeRequest):
    try:
        biomarkers_dict = [b.dict() for b in req.biomarkers]
        result = analyze_report_biomarkers(req.report_title, biomarkers_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/rag-chat")
def rag_chat(req: RagChatRequest):
    try:
        result = query_rag_engine(req.query, req.patient_context)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/ocr-extract")
def ocr_extract(req: OcrRequest):
    try:
        result = parse_medical_scan_ocr(req.file_name, req.document_type, req.raw_text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/symptom-triage")
def symptom_triage(req: TriageRequest):
    try:
        result = evaluate_symptoms_triage(
            req.chief_complaint, req.duration, req.severity, req.red_flags
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
