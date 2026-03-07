import argparse
import json
from dataclasses import dataclass
from typing import Any, Dict, List, Optional


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
        "Mediterranean / DASH style pattern (plants + healthy fats + lean protein)",
        "High fiber (especially soluble fiber)",
        "Low saturated fat, zero trans fat",
        "Lower sodium; prioritize potassium-rich foods (unless restricted by clinician)",
        "Steady, balanced meals (avoid large high-sugar spikes)",
    ]

    if chol is not None and chol >= 240:
        focus.append("Cholesterol-lowering emphasis: oats, legumes, nuts, soluble fiber; limit processed meats")
    if trestbps is not None and trestbps >= 140:
        focus.append("Blood-pressure emphasis: sodium reduction + more fruits/vegetables; limit pickles/packaged foods")

    recommended = [
        "Vegetables (leafy greens, broccoli, carrots) — aim half your plate",
        "Fruits (berries, apples, citrus) — 2–3 servings/day",
        "Whole grains (oats, brown rice, whole-wheat, quinoa)",
        "Legumes (lentils, beans, chickpeas) — several times/week",
        "Fish (esp. oily fish like salmon/sardines) — 1–2x/week",
        "Nuts & seeds (walnuts, flax/chia) — small handful/day",
        "Low-fat dairy or unsweetened alternatives",
        "Healthy oils (olive/canola); avocado in moderation",
        "Water, unsweetened tea; limit sugary drinks",
    ]

    avoid = [
        "Fried foods and fast food",
        "Processed meats (sausages, bacon, salami)",
        "Trans fats / hydrogenated oils",
        "Sugary drinks, desserts, refined carbs (white bread, pastries)",
        "High-sodium packaged foods (instant noodles, chips, packaged soups)",
        "Excess alcohol (if any, keep minimal and per clinician advice)",
    ]

    tips = [
        "Use herbs/spices, lemon, vinegar instead of extra salt.",
        "Choose grilled/steamed/baked instead of fried.",
        "Read labels: prefer lower sodium and lower saturated fat.",
        "If eating out: ask for sauces/dressings on the side; avoid creamy sauces.",
        "Aim for consistent meal timing; include protein + fiber each meal.",
    ]

    if higher_risk:
        title = "Heart-supportive diet (higher-risk focus)"
        overview = (
            "Your results suggest higher heart risk. This plan emphasizes blood-pressure friendly, "
            "cholesterol-aware meals and limits sodium, saturated fat, and ultra-processed foods."
        )
        tips.insert(
            0,
            "If you have chest pain, breathlessness, fainting, or severe symptoms, seek urgent medical care.",
        )
    else:
        title = "Heart-healthy diet (maintenance & prevention)"
        overview = (
            "Your results suggest lower heart risk, but prevention matters. This plan supports long-term "
            "heart health with a Mediterranean/DASH pattern."
        )

    sample = [
        "Breakfast: oats + berries + a spoon of nuts/seeds",
        "Lunch: mixed salad + chickpeas/beans + olive oil & lemon; whole-grain side",
        "Snack: fruit + unsalted nuts (small handful)",
        "Dinner: grilled fish/tofu + vegetables + brown rice/quinoa",
        "Optional: unsweetened yogurt or warm milk (low-fat) if it fits your diet",
    ]

    return DietPlan(
        title=title,
        overview=overview,
        focus_areas=focus,
        recommended_foods=recommended,
        limit_or_avoid=avoid,
        practical_tips=tips,
        sample_day=sample,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Diet recommendation system for heart patients.")
    parser.add_argument("--prediction", required=True, help="Heart disease prediction: 0 or 1.")
    parser.add_argument(
        "--features",
        nargs=13,
        required=True,
        help="13 heart-model features in the same order used by heartpredict.py",
    )
    args = parser.parse_args()

    features = _parse_features(args.features)
    try:
        pred_int = int(float(args.prediction))
    except Exception:
        pred_int = 0

    plan = recommend_diet(pred_int, features)

    payload = {
        "prediction": pred_int,
        "feature_summary": {k: features.get(k) for k in ("age", "trestbps", "chol", "thalach", "oldpeak")},
        "diet": {
            "title": plan.title,
            "overview": plan.overview,
            "focus_areas": plan.focus_areas,
            "recommended_foods": plan.recommended_foods,
            "limit_or_avoid": plan.limit_or_avoid,
            "practical_tips": plan.practical_tips,
            "sample_day": plan.sample_day,
            "disclaimer": "General guidance only; not a substitute for medical advice. Personal needs vary.",
        },
    }
    print(json.dumps(payload))


if __name__ == "__main__":
    main()

