"""Gemini-backed clinical guidance retrieval using PostgreSQL and pgvector."""
import os
import math
from typing import Any, Dict, List

import psycopg
import requests

EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")
EMBEDDING_DIMENSIONS = 768
CHAT_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GUIDELINE_CORPUS = [
    {
        "source_key": "who-anemia",
        "category": "anemia",
        "authority": "World Health Organization (WHO) & ICMR",
        "guideline_title": "WHO Clinical Guidelines on Nutritional Iron Deficiency Anemia",
        "chunk_text": (
            "Iron deficiency and anemia should be assessed using a person's symptoms, "
            "medical history, and appropriate laboratory tests. A clinician should "
            "confirm the cause and recommend treatment; do not start or change iron "
            "supplements based only on chatbot output."
        ),
        "url": "https://www.who.int/health-topics/anaemia",
    },
    {
        "source_key": "aha-cardiac",
        "category": "cardiac",
        "authority": "American Heart Association (AHA)",
        "guideline_title": "AHA Cardiovascular Health Information",
        "chunk_text": (
            "Blood pressure and cholesterol results need to be interpreted with "
            "individual risk factors and repeated measurements where appropriate. "
            "Discuss abnormal readings and treatment decisions with a qualified "
            "health professional; a chatbot cannot diagnose cardiovascular disease."
        ),
        "url": "https://www.heart.org/en/health-topics",
    },
    {
        "source_key": "ada-diabetes",
        "category": "diabetes",
        "authority": "American Diabetes Association (ADA)",
        "guideline_title": "Standards of Care in Diabetes",
        "chunk_text": (
            "Diabetes care is individualized and uses validated laboratory tests, "
            "medical history, and clinician assessment. Do not start, stop, or "
            "change diabetes medication based on chatbot output. Seek urgent care "
            "for severe or rapidly worsening symptoms."
        ),
        "url": "https://diabetes.org/health-wellness",
    },
    {
        "source_key": "gina-asthma",
        "category": "asthma",
        "authority": "Global Initiative for Asthma (GINA)",
        "guideline_title": "Global Strategy for Asthma Management and Prevention",
        "chunk_text": (
            "Asthma symptoms and treatment plans should be reviewed with a clinician. "
            "Follow the personal asthma action plan provided by the treating clinician. "
            "Severe breathing difficulty requires immediate emergency assistance."
        ),
        "url": "https://ginasthma.org/",
    },
    {
        "source_key": "ata-thyroid",
        "category": "thyroid",
        "authority": "American Thyroid Association (ATA)",
        "guideline_title": "Thyroid Disease Information",
        "chunk_text": (
            "Thyroid test results depend on the specific test, reference interval, "
            "medicines, and clinical context. A qualified clinician should interpret "
            "results and guide any changes to thyroid medication."
        ),
        "url": "https://www.thyroid.org/thyroid-information/",
    },
    {
        "source_key": "kdigo-kidney",
        "category": "renal",
        "authority": "Kidney Disease: Improving Global Outcomes (KDIGO)",
        "guideline_title": "KDIGO Clinical Practice Guidelines",
        "chunk_text": (
            "Kidney health assessment may include blood and urine tests interpreted "
            "over time and alongside medical history. A clinician should evaluate "
            "abnormal kidney results and advise on treatment or fluid intake."
        ),
        "url": "https://kdigo.org/guidelines/",
    },
    {
        "source_key": "icmr-fever",
        "category": "fever",
        "authority": "Indian Council of Medical Research (ICMR)",
        "guideline_title": "ICMR Health Research and Clinical Guidance",
        "chunk_text": (
            "Fever can have many causes and should be assessed in its clinical "
            "context. Seek medical care for severe symptoms, difficulty breathing, "
            "confusion, dehydration, or a rapidly worsening condition. Do not use "
            "chatbot output to select or change medication doses."
        ),
        "url": "https://www.icmr.gov.in/",
    },
    {
        "source_key": "acep-emergency",
        "category": "emergency",
        "authority": "American College of Emergency Physicians (ACEP)",
        "guideline_title": "Emergency Care Information",
        "chunk_text": (
            "Possible heart attack or stroke, loss of consciousness, severe breathing "
            "difficulty, or uncontrolled bleeding requires immediate emergency "
            "assessment. Contact local emergency services; do not wait for an online "
            "assistant to assess an emergency."
        ),
        "url": "https://www.acep.org/",
    },
]


class AIConfigurationError(Exception):
    """Raised when a required provider or database setting is missing."""


class AIServiceError(Exception):
    """Raised when an upstream AI or retrieval dependency fails."""


def _api_key() -> str:
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise AIConfigurationError("GEMINI_API_KEY is not configured.")
    return key


def _database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        raise AIConfigurationError("DATABASE_URL is not configured for vector search.")
    return url


def _vector_literal(values: List[float]) -> str:
    if len(values) != EMBEDDING_DIMENSIONS:
        raise AIServiceError(
            f"Embedding dimension mismatch: expected {EMBEDDING_DIMENSIONS}, got {len(values)}."
        )
    vector = [float(value) for value in values]
    if not all(math.isfinite(value) for value in vector):
        raise AIServiceError("Embedding contains a non-finite value.")
    return "[" + ",".join(str(value) for value in vector) + "]"


def _gemini_request(model: str, operation: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:{operation}"
    try:
        response = requests.post(
            url,
            params={"key": _api_key()},
            json=payload,
            timeout=30,
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as exc:
        raise AIServiceError("Gemini request failed. Check provider availability and configuration.") from exc
    except ValueError as exc:
        raise AIServiceError("Gemini returned an invalid response.") from exc


def _embed_text(text: str, task_type: str) -> List[float]:
    result = _gemini_request(
        EMBEDDING_MODEL,
        "embedContent",
        {
            "model": f"models/{EMBEDDING_MODEL}",
            "content": {"parts": [{"text": text}]},
            "taskType": task_type,
            "outputDimensionality": EMBEDDING_DIMENSIONS,
        },
    )
    try:
        return result["embedding"]["values"]
    except (KeyError, TypeError) as exc:
        raise AIServiceError("Gemini returned no embedding.") from exc


def index_guideline_corpus() -> int:
    """Embed and upsert the bundled, non-patient guideline corpus."""
    database_url = _database_url()
    _api_key()
    try:
        with psycopg.connect(database_url) as connection:
            for item in GUIDELINE_CORPUS:
                embedding = _vector_literal(_embed_text(item["chunk_text"], "RETRIEVAL_DOCUMENT"))
                connection.execute(
                    """
                    INSERT INTO rag_document_chunks
                        (source_key, authority, guideline_title, chunk_text, category, url, embedding)
                    VALUES (%s, %s, %s, %s, %s, %s, %s::vector)
                    ON CONFLICT (source_key) DO UPDATE SET
                        authority = EXCLUDED.authority,
                        guideline_title = EXCLUDED.guideline_title,
                        chunk_text = EXCLUDED.chunk_text,
                        category = EXCLUDED.category,
                        url = EXCLUDED.url,
                        embedding = EXCLUDED.embedding
                    """,
                    (
                        item["source_key"],
                        item["authority"],
                        item["guideline_title"],
                        item["chunk_text"],
                        item["category"],
                        item["url"],
                        embedding,
                    ),
                )
    except psycopg.Error as exc:
        raise AIServiceError("Could not write guideline embeddings to PostgreSQL.") from exc
    return len(GUIDELINE_CORPUS)


def _retrieve(query: str, limit: int = 4) -> List[Dict[str, Any]]:
    query_vector = _vector_literal(_embed_text(query, "RETRIEVAL_QUERY"))
    try:
        with psycopg.connect(_database_url()) as connection:
            rows = connection.execute(
                """
                SELECT authority, guideline_title, chunk_text, category, url,
                       1 - (embedding <=> %s::vector) AS similarity
                FROM rag_document_chunks
                WHERE embedding IS NOT NULL
                  AND 1 - (embedding <=> %s::vector) >= %s
                ORDER BY embedding <=> %s::vector
                LIMIT %s
                """,
                (query_vector, query_vector, 0.35, query_vector, limit),
            ).fetchall()
    except psycopg.Error as exc:
        raise AIServiceError(
            "PostgreSQL vector retrieval failed; check the schema and guideline index."
        ) from exc
    return [
        {
            "authority": row[0],
            "title": row[1],
            "quote": row[2],
            "category": row[3],
            "url": row[4],
            "similarity": float(row[5]),
        }
        for row in rows
    ]


def _generate_answer(query: str, sources: List[Dict[str, Any]]) -> str:
    source_text = "\n\n".join(
        f"Source: {item['title']} ({item['authority']})\n"
        f"Reference passage: {item['quote']}\nURL: {item['url']}"
        for item in sources
    )
    result = _gemini_request(
        CHAT_MODEL,
        "generateContent",
        {
            "contents": [
                {
                    "parts": [
                        {
                            "text": (
                                "You are a cautious health-education assistant, not a clinician. "
                                "Use only the supplied reference passages for factual health claims. "
                                "Do not diagnose, prescribe, recommend medication or dosage changes, "
                                "or invent sources. If the passages do not answer the question, say "
                                "so clearly and recommend consulting a qualified clinician. For "
                                "possible emergency symptoms, tell the user to contact local "
                                "emergency services immediately. Keep the answer concise and state "
                                "that it is general information, not medical advice.\n\n"
                                f"Retrieved reference passages:\n{source_text}\n\n"
                                f"User question:\n{query[:4000]}"
                            )
                        }
                    ]
                }
            ],
            "generationConfig": {"temperature": 0.2},
        },
    )
    try:
        parts = result["candidates"][0]["content"]["parts"]
        answer = "\n".join(part.get("text", "") for part in parts).strip()
    except (KeyError, IndexError, TypeError) as exc:
        raise AIServiceError("Gemini returned no answer.") from exc
    if not answer:
        raise AIServiceError("Gemini returned an empty answer.")
    return answer


def query_rag_engine(user_query: str) -> Dict[str, Any]:
    """Retrieve source passages with pgvector and generate an explicitly grounded answer."""
    sources = _retrieve(user_query.strip())
    if not sources:
        return {
            "query": user_query,
            "answer": (
                "I could not find a matching indexed reference, so I can't provide a "
                "source-grounded answer. Please consult a qualified health professional."
            ),
            "retrieved_sources": [],
            "provider": "No matching indexed source",
        }

    answer = _generate_answer(user_query, sources)
    public_sources = [
        {key: value for key, value in source.items() if key != "similarity"}
        for source in sources
    ]
    return {
        "query": user_query,
        "answer": answer,
        "retrieved_sources": public_sources,
        "provider": "Google Gemini",
    }
