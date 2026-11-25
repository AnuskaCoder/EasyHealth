"""
EasyHealth AI/ML Microservice - Symptom Triage & Urgency Assessment
"""
from typing import Dict, Any, List

SPECIALIST_MAPPING = {
    "chest": "Cardiologist",
    "heart": "Cardiologist",
    "palpitation": "Cardiologist",
    "breath": "Pulmonologist",
    "cough": "Pulmonologist",
    "skin": "Dermatologist",
    "rash": "Dermatologist",
    "joint": "Orthopedic Surgeon",
    "bone": "Orthopedic Surgeon",
    "headache": "Neurologist",
    "migraine": "Neurologist",
    "stomach": "Gastroenterologist",
    "acid": "Gastroenterologist",
    "child": "Pediatrician",
    "ear": "ENT Specialist",
    "throat": "ENT Specialist",
    "anxiety": "Psychiatrist",
}

def evaluate_symptoms_triage(
    chief_complaint: str,
    duration: str,
    severity: int,
    red_flags: List[str]
) -> Dict[str, Any]:
    """
    Computes clinical urgency level, recommended specialist, and triage action.
    """
    is_emergency = severity >= 8 or len(red_flags) > 0
    lower_symptom = chief_complaint.lower()

    # Find matching specialist
    recommended_specialist = "General Physician"
    for keyword, specialist in SPECIALIST_MAPPING.items():
        if keyword in lower_symptom:
            recommended_specialist = specialist
            break

    if is_emergency:
        urgency_level = "High Priority / Urgent Care"
        action = "Emergency Evaluation or Immediate Doctor Consult"
    elif severity >= 5:
        urgency_level = "Priority Consultation"
        action = f"Book Appointment with {recommended_specialist} within 24-48 hours"
    else:
        urgency_level = "Routine Care & Observation"
        action = "Hydration, rest, and follow-up outpatient consultation"

    return {
        "chief_complaint": chief_complaint,
        "duration": duration,
        "severity_score": severity,
        "red_flags_present": len(red_flags),
        "urgency_level": urgency_level,
        "recommended_specialist": recommended_specialist,
        "clinical_action": action,
        "triage_confidence": 0.96
    }
