import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import "../App.css";

const HealthChatbotPage = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! Ask me a basic health question (diet, exercise, stress/sleep, next steps).",
    },
  ]);

  const ask = async (e) => {
    e.preventDefault();
    const q = String(question || "").trim();
    if (!q) return;

    setError("");
    setLoading(true);
    setMessages((p) => [...p, { role: "user", text: q }]);
    setQuestion("");

    try {
      const response = await fetch(
        "http://localhost:8080/api/v1/predict/health-chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ question: q }),
        }
      );

      if (response.status === 401) {
        toast.info("Please log in to access the Health Chatbot.");
        setTimeout(() => navigate("/login"), 1500);
        return;
      }

      if (!response.ok) throw new Error("Chat request failed.");
      const data = await response.json();
      const answer =
        data?.chatbot?.answer ||
        "Sorry, I couldn't understand that. Try asking about diet, exercise, stress, sleep, or next steps.";
      const disclaimer = data?.chatbot?.disclaimer;

      setMessages((p) => [
        ...p,
        { role: "bot", text: answer },
        ...(disclaimer ? [{ role: "bot", text: disclaimer }] : []),
      ]);
    } catch (err) {
      console.error(err);
      setError("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="heart-page-container">
      <ToastContainer />
      <h1 className="heart-page-header">HEALTH CHATBOT</h1>

      <div className="heart-page-result-container" style={{ width: "100%" }}>
        <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
          {messages.map((m, idx) => (
            <p
              key={`msg-${idx}`}
              style={{
                textAlign: m.role === "user" ? "right" : "left",
                fontWeight: m.role === "user" ? "bold" : "normal",
                color: m.role === "user" ? "#1f1534" : "#333",
              }}
            >
              {m.text}
            </p>
          ))}
        </div>

        <form onSubmit={ask} style={{ marginTop: "1rem" }}>
          <input
            className="heart-page-input"
            type="text"
            placeholder="Type your question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="heart-page-button"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default HealthChatbotPage;

