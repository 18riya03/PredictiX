import argparse
import json
import re
from dataclasses import dataclass
from typing import Optional


_DISCLAIMER = (
    "General information only; not a substitute for professional medical advice. "
    "If symptoms are severe or sudden, seek urgent medical care."
)


@dataclass(frozen=True)
class ChatResponse:
    answer: str
    intent: str
    disclaimer: str = _DISCLAIMER


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip().lower())


def answer_basic_health_question(question: str, context_prediction: Optional[int] = None) -> ChatResponse:
    q = _norm(question)

    # Basic safety triage
    if any(k in q for k in ["chest pain", "tightness", "pressure in chest", "can't breathe", "shortness of breath severe", "faint", "passed out"]):
        return ChatResponse(
            intent="emergency_triage",
            answer=(
                "Chest pain, severe breathlessness, fainting, or sudden weakness can be emergencies. "
                "Please seek urgent medical care now (local emergency number), especially if symptoms are new/worsening."
            ),
        )

    # Post-prediction next steps
    if any(k in q for k in ["what next", "next steps", "what should i do", "what do i do now", "after prediction"]):
        if context_prediction == 1:
            return ChatResponse(
                intent="next_steps_high_risk",
                answer=(
                    "Because your result suggests higher heart risk, focus on: "
                    "1) scheduling a clinician visit for confirmation and risk review, "
                    "2) monitoring blood pressure and symptoms, "
                    "3) heart-healthy diet and gentle activity if safe, "
                    "4) medication adherence if prescribed. "
                    "If you develop chest pain, severe shortness of breath, or fainting, seek urgent care."
                ),
            )
        return ChatResponse(
            intent="next_steps_general",
            answer=(
                "A prediction isn't a diagnosis. If you have symptoms or risk factors, consider a clinician visit to review "
                "blood pressure, cholesterol, diabetes status, and lifestyle factors. Prevention basics: no smoking, regular activity, "
                "heart-healthy diet, good sleep, and stress management."
            ),
        )

    # Diet
    if any(k in q for k in ["diet", "food", "what to eat", "meal", "sodium", "salt", "cholesterol"]):
        return ChatResponse(
            intent="diet",
            answer=(
                "A heart-healthy pattern is Mediterranean/DASH: vegetables, fruits, whole grains, legumes, nuts, fish, and olive oil. "
                "Limit fried foods, processed meats, sugary drinks, and high-sodium packaged foods. "
                "If blood pressure is high, reduce sodium and prefer fresh foods; if cholesterol is high, add soluble fiber (oats, beans) and nuts."
            ),
        )

    # Exercise
    if any(k in q for k in ["exercise", "workout", "walking", "activity", "gym"]):
        return ChatResponse(
            intent="exercise",
            answer=(
                "For most people, starting with low-impact activity (like walking 20–30 minutes most days) is a good baseline. "
                "Increase gradually. If you get chest pain, severe breathlessness, dizziness, or fainting with activity, stop and seek medical advice."
            ),
        )

    # Stress / sleep
    if any(k in q for k in ["stress", "anxious", "anxiety", "panic", "sleep", "insomnia"]):
        return ChatResponse(
            intent="stress_sleep",
            answer=(
                "Quick stress reducers: slow breathing (inhale 4s, exhale 6s for 3–5 minutes), a short walk, and reducing caffeine later in the day. "
                "Aim for consistent sleep schedule and 7–9 hours for most adults. If anxiety/panic is frequent or disabling, consider professional support."
            ),
        )

    # Medications (general)
    if any(k in q for k in ["medicine", "medication", "statin", "aspirin", "bp pills", "beta blocker"]):
        return ChatResponse(
            intent="medications_general",
            answer=(
                "Medication choices depend on your clinician's assessment (blood pressure, cholesterol, diabetes, symptoms, and overall risk). "
                "Don't start/stop medicines without medical advice. If you already have prescriptions, take them as directed and ask your clinician about side effects."
            ),
        )

    return ChatResponse(
        intent="unknown",
        answer=(
            "I can help with basics on diet, exercise, stress/sleep, and general next steps. "
            "Try asking: 'What diet is good for heart health?', 'What should I do next?', or 'How can I reduce stress safely?'"
        ),
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Basic health chatbot (rule-based).")
    parser.add_argument("--question", required=True, help="User question text.")
    parser.add_argument(
        "--context_prediction",
        required=False,
        help="Optional: heart prediction (0 or 1) to tailor next-step advice.",
    )
    args = parser.parse_args()

    pred: Optional[int] = None
    if args.context_prediction is not None:
        try:
            pred = int(float(args.context_prediction))
        except Exception:
            pred = None

    resp = answer_basic_health_question(args.question, context_prediction=pred)
    print(json.dumps({"chatbot": {"intent": resp.intent, "answer": resp.answer, "disclaimer": resp.disclaimer}}))


if __name__ == "__main__":
    main()

