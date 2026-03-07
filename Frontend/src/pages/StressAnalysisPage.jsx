import React, { useState } from "react";
import "../App.css";

const StressAnalysisPage = () => {

  const [form, setForm] = useState({
    sleep_hours: "",
    mood: "okay",
    work_hours: "",
    activity_level: "moderate",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {

    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {

      const payload = {
        sleep_hours: Number(form.sleep_hours) || 0,
        mood: form.mood,
        work_hours: Number(form.work_hours) || 0,
        activity_level: form.activity_level,
      };

      const response = await fetch(
        "http://localhost:8080/api/v1/predict/stress-analysis",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      setResult(data?.stress);

    } catch (err) {
      console.error(err);
      alert("Failed to analyze stress");
    }

    setLoading(false);
  };

  return (
    <div className="heart-page-container">

      <h1 className="heart-page-header">STRESS ANALYSIS</h1>

      <form className="heart-page-form" onSubmit={handleSubmit}>

        <div className="heart-page-input-container">

          <input
            className="heart-page-input"
            type="number"
            step="0.1"
            name="sleep_hours"
            placeholder="Sleep Hours"
            value={form.sleep_hours}
            onChange={handleChange}
          />

          <select
            className="heart-page-input"
            name="mood"
            value={form.mood}
            onChange={handleChange}
          >
            <option value="bad">Mood: Bad</option>
            <option value="okay">Mood: Okay</option>
            <option value="good">Mood: Good</option>
          </select>

          <input
            className="heart-page-input"
            type="number"
            name="work_hours"
            placeholder="Work hours per day"
            value={form.work_hours}
            onChange={handleChange}
          />

          <select
            className="heart-page-input"
            name="activity_level"
            value={form.activity_level}
            onChange={handleChange}
          >
            <option value="low">Activity Level: Low</option>
            <option value="moderate">Activity Level: Moderate</option>
            <option value="high">Activity Level: High</option>
          </select>

        </div>

        <button
          type="submit"
          className="heart-page-button"
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Analyze Stress"}
        </button>

      </form>

      {result && (
        <div className="heart-page-result-container">

          <h3>Stress Level: {result.level.toUpperCase()}</h3>

          <p>Score: {result.score}</p>

          <h4>Reasons</h4>
          <ul>
            {result.reasons.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>

          <h4>Recommendations</h4>
          <ul>
            {result.recommendations.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>

        </div>
      )}

    </div>
  );
};

export default StressAnalysisPage;