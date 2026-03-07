import argparse
import json
from dataclasses import dataclass


@dataclass
class StressResult:
    score: int
    level: str
    reasons: list
    recommendations: list


def analyze_stress(sleep_hours, mood, work_hours, activity_level):

    score = 20
    reasons = []

    # Sleep
    if sleep_hours < 5:
        score += 20
        reasons.append("Very low sleep duration")

    elif sleep_hours < 7:
        score += 10
        reasons.append("Insufficient sleep")

    # Mood
    if mood == "bad":
        score += 15
        reasons.append("Negative mood state")

    elif mood == "okay":
        score += 5

    # Work hours
    if work_hours > 10:
        score += 15
        reasons.append("Long work hours")

    elif work_hours > 8:
        score += 8

    # Activity level
    if activity_level == "low":
        score += 10
        reasons.append("Low physical activity")

    elif activity_level == "moderate":
        score += 5

    # Clamp score
    score = max(0, min(100, score))

    # Level
    if score >= 70:
        level = "high"
    elif score >= 40:
        level = "moderate"
    else:
        level = "low"

    recommendations = [
        "Practice breathing exercises daily",
        "Maintain consistent sleep schedule",
        "Take short breaks during work",
        "Include physical activity like walking",
    ]

    if level == "high":
        recommendations.insert(
            0,
            "Consider talking to a healthcare professional if stress persists."
        )

    return StressResult(score, level, reasons, recommendations)


def main():

    parser = argparse.ArgumentParser()

    parser.add_argument("--sleep_hours", required=True)
    parser.add_argument("--mood", required=True)
    parser.add_argument("--work_hours", required=True)
    parser.add_argument("--activity_level", required=True)

    args = parser.parse_args()

    sleep_hours = float(args.sleep_hours)
    mood = args.mood
    work_hours = float(args.work_hours)
    activity_level = args.activity_level

    result = analyze_stress(
        sleep_hours,
        mood,
        work_hours,
        activity_level
    )

    payload = {
        "stress": {
            "score": result.score,
            "level": result.level,
            "reasons": result.reasons,
            "recommendations": result.recommendations,
            "disclaimer": "This is a heuristic estimate, not medical diagnosis."
        }
    }

    print(json.dumps(payload))


if __name__ == "__main__":
    main()