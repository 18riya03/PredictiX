"""
Example usage of the post-prediction modules (diet, stress, chatbot).

This does NOT modify or replace the existing heart disease predictor.
It simply shows how to call the new modules after you already have a prediction.
"""

import json
import subprocess
import sys
from pathlib import Path


HERE = Path(__file__).resolve().parent
PY = sys.executable  # uses the current Python interpreter


def run(script: Path, args: list[str]) -> dict:
    out = subprocess.check_output([PY, str(script), *args], text=True)
    return json.loads(out.strip())


def main() -> None:
    # Example: 13 features in the same order used by heartpredict.py
    features = [
        "58",
        "1",
        "0",
        "140",
        "248",
        "0",
        "0",
        "122",
        "0",
        "1",
        "1",
        "0",
        "2",
    ]

    # Pretend you already got the prediction from heartpredict.py
    prediction = "1"

    diet = run(
        HERE / "diet_recommendations.py",
        ["--prediction", prediction, "--features", *features],
    )
    stress = run(
        HERE / "stress_analysis.py",
        ["--features", *features, "--sleep_hours", "6", "--self_report_0_10", "7"],
    )
    chatbot = run(
        HERE / "health_chatbot.py",
        ["--question", "What should I do next?", "--context_prediction", prediction],
    )

    print(json.dumps({"diet": diet, "stress": stress, "chatbot": chatbot}, indent=2))


if __name__ == "__main__":
    main()

