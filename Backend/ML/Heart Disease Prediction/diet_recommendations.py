import argparse
import json
import math
from dataclasses import dataclass
from typing import Any, Dict, List, Optional


UCI_KEYS = [
    "age","sex","cp","trestbps","chol","fbs","restecg",
    "thalach","exang","oldpeak","slope","ca","thal"
]


def _to_float(x: Any) -> Optional[float]:
    try:
        if x is None:
            return None
        val = float(x)
        if math.isnan(val):
            return None
        return val
    except Exception:
        return None


def _parse_features(feature_args: List[str]) -> Dict[str, Optional[float]]:
    values = [_to_float(v) for v in feature_args]
    out: Dict[str, Optional[float]] = {}
    for i, key in enumerate(UCI_KEYS):
        out[key] = values[i] if i < len(values) else None
    return out


@dataclass(frozen=True)
class DietPlan:
    title: str
    overview: str
    focus_areas: List[str]
    recommended_foods: List[str]
    limit_or_avoid: List[str]
    practical_tips: List[str]
    sample_day: List[str]


def recommend_diet(prediction: int, features: Dict[str, Optional[float]]) -> DietPlan:

    chol = features.get("chol")
    trestbps = features.get("trestbps")

    higher_risk = int(prediction) == 1

    focus = [
        "Mediterranean / DASH style diet",
        "High fiber foods",
        "Low saturated fat",
        "Low sodium intake",
        "Balanced meals"
    ]

    if chol is not None and chol >= 240:
        focus.append("Increase soluble fiber foods (oats, legumes, nuts)")

    if trestbps is not None and trestbps >= 140:
        focus.append("Reduce sodium and increase potassium-rich foods")

    recommended = [
        "Vegetables (spinach, broccoli)",
        "Fruits (berries, apples)",
        "Whole grains (oats, brown rice)",
        "Legumes (lentils, beans)",
        "Fish (salmon, sardines)",
        "Nuts & seeds",
        "Olive oil",
        "Low-fat dairy",
        "Water / unsweetened tea"
    ]

    avoid = [
        "Fried food",
        "Processed meat",
        "Sugary drinks",
        "Refined carbs",
        "High sodium packaged foods"
    ]

    tips = [
        "Use herbs instead of salt",
        "Prefer grilled food",
        "Read nutrition labels",
        "Maintain regular meal timings"
    ]

    if higher_risk:
        title = "Heart Supportive Diet"
        overview = "Your prediction indicates higher heart risk. Follow a stricter heart friendly diet."
    else:
        title = "Heart Healthy Diet"
        overview = "Maintain heart health with a balanced Mediterranean style diet."

    sample = [
        "Breakfast: Oats with berries",
        "Lunch: Vegetable salad with olive oil",
        "Snack: Fruit + nuts",
        "Dinner: Grilled fish/tofu + vegetables"
    ]

    return DietPlan(
        title=title,
        overview=overview,
        focus_areas=focus,
        recommended_foods=recommended,
        limit_or_avoid=avoid,
        practical_tips=tips,
        sample_day=sample
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--prediction", required=True)
    parser.add_argument("--features", nargs=13, required=True)

    args = parser.parse_args()

    features = _parse_features(args.features)

    try:
        pred_int = int(float(args.prediction))
    except:
        pred_int = 0

    plan = recommend_diet(pred_int, features)

    payload = {
        "prediction": pred_int,
        "diet": {
            "title": plan.title,
            "overview": plan.overview,
            "focus_areas": plan.focus_areas,
            "recommended_foods": plan.recommended_foods,
            "limit_or_avoid": plan.limit_or_avoid,
            "practical_tips": plan.practical_tips,
            "sample_day": plan.sample_day
        }
    }

    print(json.dumps(payload))


if __name__ == "__main__":
    main()