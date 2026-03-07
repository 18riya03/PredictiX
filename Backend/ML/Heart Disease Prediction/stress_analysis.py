import argparse
import json
from dataclasses import dataclass
from typing import Any, Dict, Optional


UCI_KEYS = [
    "age",
    "sex",
    "cp",
    "trestbps",
    "chol",
    "fbs",
    "restecg",
    "thalach",
    "exang",
    "oldpeak",
    "slope",
    "ca",
    "thal",
]


def _to_float(x: Any) -> Optional[float]:
    try:
        if x is None:
            return None
        return float(x)
    except Exception:
        return None


def _parse_features(feature_args: list[str]) -> Dict[str, Optional[float]]:
    values = [_to_float(v) for v in feature_args]
    out: Dict[str, Optional[float]] = {}
    for i, key in enumerate(UCI_KEYS):
        out[key] = values[i] if i < len(values) else None
    return out


@dataclass(frozen=True)
class StressResult:
    score_0_100: int
    level: str
    reasons: list[str]
    recommendations: list[str]


def analyze_stress(
    features: Dict[str, Optional[float]],
    sleep_hours: Optional[float] = None,
    self_report_0_10: Optional[float] = None,
) -> StressResult:
    """
    Heuristic stress estimate. Not a diagnosis.
    Uses vitals-like features (BP, max HR, exercise angina, oldpeak) plus optional self-report.
    """
    trestbps = features.get("trestbps")
    thalach = features.get("thalach")
    exang = features.get("exang")
    oldpeak = features.get("oldpeak")

    score = 25
    reasons: list[str] = []

    if trestbps is not None:
        if trestbps >= 160:
            score += 20
            reasons.append("Higher resting blood pressure can correlate with stress load.")
        elif trestbps >= 140:
            score += 12
            reasons.append("Elevated resting blood pressure may reflect stress and/or other factors.")
        elif trestbps < 110:
            score += 2

    if thalach is not None:
        if thalach < 110:
            score += 10
            reasons.append("Lower exercise capacity (max heart rate) can relate to low fitness or health constraints.")
        elif thalach > 170:
            score += 4

    if exang is not None and int(exang) == 1:
        score += 10
        reasons.append("Exercise-induced discomfort can increase worry and perceived stress.")

    if oldpeak is not None:
        if oldpeak >= 2.0:
            score += 10
            reasons.append("Higher exertion-related ST depression can be associated with higher overall strain.")
        elif oldpeak >= 1.0:
            score += 5

    if sleep_hours is not None:
        if sleep_hours < 5:
            score += 20
            reasons.append("Very short sleep is strongly linked with stress and recovery issues.")
        elif sleep_hours < 7:
            score += 10
            reasons.append("Less than 7 hours sleep can increase stress and affect blood pressure.")
        elif sleep_hours > 9:
            score += 3

    if self_report_0_10 is not None:
        score += int(round(max(0.0, min(10.0, self_report_0_10)) * 4))  # 0..40
        reasons.append("Self-reported stress contributes to the stress estimate.")

    score = max(0, min(100, score))

    if score >= 70:
        level = "high"
    elif score >= 40:
        level = "moderate"
    else:
        level = "low"

    recs = [
        "Try 5 minutes of slow breathing (e.g., inhale 4s, exhale 6s) twice daily.",
        "Aim for regular sleep/wake times; reduce screens/caffeine late in the day.",
        "Add light activity most days (walking 20–30 minutes), if medically safe for you.",
        "If you feel persistent anxiety, low mood, or panic symptoms, consider speaking with a clinician/therapist.",
    ]
    if level in ("moderate", "high"):
        recs.insert(0, "Consider stress triggers (work, family, health worries) and plan 1–2 changes you can sustain.")
    if level == "high":
        recs.insert(
            0,
            "If you have chest pain, severe shortness of breath, or fainting, seek urgent medical care.",
        )

    return StressResult(score_0_100=score, level=level, reasons=reasons, recommendations=recs)


def main() -> None:
    parser = argparse.ArgumentParser(description="Stress level analysis module.")
    parser.add_argument(
        "--features",
        nargs=13,
        required=True,
        help="13 heart-model features in the same order used by heartpredict.py",
    )
    parser.add_argument("--sleep_hours", required=False, help="Optional: hours slept last night (e.g., 6.5).")
    parser.add_argument(
        "--self_report_0_10",
        required=False,
        help="Optional: self-reported stress level (0-10).",
    )
    args = parser.parse_args()

    features = _parse_features(args.features)
    sleep_hours = _to_float(args.sleep_hours) if args.sleep_hours is not None else None
    self_report = _to_float(args.self_report_0_10) if args.self_report_0_10 is not None else None

    result = analyze_stress(features, sleep_hours=sleep_hours, self_report_0_10=self_report)

    payload = {
        "stress": {
            "score_0_100": result.score_0_100,
            "level": result.level,
            "reasons": result.reasons,
            "recommendations": result.recommendations,
            "disclaimer": "Heuristic estimate only; not a medical diagnosis.",
        }
    }
    print(json.dumps(payload))


if __name__ == "__main__":
    main()

