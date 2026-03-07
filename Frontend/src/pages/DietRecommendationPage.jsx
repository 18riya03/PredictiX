import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import "../App.css";
import { loadHeartInput } from "../utils/heartStorage";

const DietRecommendationPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    prediction: "0",
    age: "",
    sex: "",
    trestbps: "",
    chol: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dietData, setDietData] = useState(null);

  useEffect(() => {
    const stored = loadHeartInput();
    if (!stored) return;

    setForm((prev) => ({
      ...prev,
      prediction: stored.prediction ? String(stored.prediction) : prev.prediction,
      age: stored.age ?? prev.age,
      sex: stored.sex ?? prev.sex,
      trestbps: stored.restingBloodPressure ?? prev.trestbps,
      chol: stored.serumCholesterol ?? prev.chol,
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setDietData(null);
    setLoading(true);

    try {

      // Backend expects 13 heart features
      const features = [
        Number(form.age) || 0,
        Number(form.sex) || 0,
        0,
        Number(form.trestbps) || 0,
        Number(form.chol) || 0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
      ];

      const response = await fetch(
        "http://localhost:8080/api/v1/predict/heart-diet",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            prediction: Number(form.prediction) || 0,
            features,
          }),
        }
      );

      if (response.status === 401) {
        toast.info("Please log in to access Diet Recommendation.");
        setTimeout(() => navigate("/login"), 1500);
        return;
      }

      if (!response.ok) throw new Error("Diet recommendation request failed.");

      const data = await response.json();
      setDietData(data?.diet || null);

    } catch (err) {
      console.error(err);
      setError("Failed to get diet recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="heart-page-container">
      <ToastContainer />
      <h1 className="heart-page-header">DIET RECOMMENDATION</h1>

      <form className="heart-page-form" onSubmit={handleSubmit}>
        <div className="heart-page-input-container">

          <select
            className="heart-page-input"
            name="prediction"
            value={form.prediction}
            onChange={handleChange}
          >
            <option value="0">Prediction: Not suffering (0)</option>
            <option value="1">Prediction: Suffering (1)</option>
          </select>

          <input
            className="heart-page-input"
            type="number"
            name="age"
            placeholder="Age"
            value={form.age}
            onChange={handleChange}
          />

          <input
            className="heart-page-input"
            type="number"
            name="sex"
            placeholder="Sex (0 female, 1 male)"
            value={form.sex}
            onChange={handleChange}
          />

          <input
            className="heart-page-input"
            type="number"
            name="trestbps"
            placeholder="Resting BP"
            value={form.trestbps}
            onChange={handleChange}
          />

          <input
            className="heart-page-input"
            type="number"
            name="chol"
            placeholder="Cholesterol"
            value={form.chol}
            onChange={handleChange}
          />

        </div>

        <button type="submit" className="heart-page-button" disabled={loading}>
          {loading ? "Generating..." : "Get Recommendations"}
        </button>
      </form>

      {dietData && (
        <div className="heart-page-result-container">

          <h3>{dietData.title}</h3>
          <p>{dietData.overview}</p>

          <h4>Focus areas</h4>
          <ul>
            {(dietData.focus_areas || []).map((x, i) => <li key={i}>{x}</li>)}
          </ul>

          <h4>Recommended foods</h4>
          <ul>
            {(dietData.recommended_foods || []).map((x, i) => <li key={i}>{x}</li>)}
          </ul>

          <h4>Limit / Avoid</h4>
          <ul>
            {(dietData.limit_or_avoid || []).map((x, i) => <li key={i}>{x}</li>)}
          </ul>

        </div>
      )}

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default DietRecommendationPage;