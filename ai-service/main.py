"""
EasyHealth AI/ML FastAPI Microservice
Provides REST endpoints for LLM Report Summarization, RAG Clinical QA, OCR Extraction, and Symptom Triaging.
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from pydantic import BaseModel, Field
from typing import List, Optional, Any
import os
import logging

from services.summarizer import analyze_report_biomarkers
from services.rag import (
    AIConfigurationError,
    AIServiceError,
    ensure_guideline_corpus_indexed,
    query_rag_engine,
)
from services.ocr import parse_medical_scan_ocr
from services.triage import evaluate_symptoms_triage

logger = logging.getLogger(__name__)

app = FastAPI(
    title="EasyHealth AI/ML Microservice",
    description="Opt-in, source-grounded clinical health education using Gemini and pgvector",
    version="1.0.0"
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.on_event("startup")
def index_bundled_guidelines_if_needed():
    if not os.getenv("DATABASE_URL") or not os.getenv("GEMINI_API_KEY"):
        return
    try:
        indexed_count = ensure_guideline_corpus_indexed()
        if indexed_count:
            logger.info("Indexed %s bundled clinical references.", indexed_count)
    except AIServiceError:
        logger.exception("Bundled guideline indexing failed; RAG requests may be unavailable.")


allowed_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", os.getenv("FRONTEND_URL", "http://localhost:5173")).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
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
    query: str = Field(..., min_length=1, max_length=4000)

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
        "capabilities": ["Gemini + pgvector Q&A (requires indexed corpus)", "OCR Extraction", "Symptom Triage"]
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
@limiter.limit("20/minute")
def rag_chat(request: Request, req: RagChatRequest):
    try:
        return query_rag_engine(req.query)
    except AIConfigurationError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except AIServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        logger.exception("Clinical RAG request failed")
        raise HTTPException(status_code=500, detail="Clinical RAG request failed.")

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
