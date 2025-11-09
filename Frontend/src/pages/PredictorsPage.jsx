import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Card from "../components/Card";
import heartImage from "../assets/heart.png";
import lungImage from "../assets/lung.png";
import diabetesImage from "../assets/diabetes.png";
import breastImage from "../assets/breast.png";
import { UserContext } from "../context/UserContext";
import "../App.css";

function PredictorsPage() {
  const { userInfo } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLinkClick = (path) => {
    if (userInfo) {
      navigate(path);
    } else {
      toast.info("Please log in to access this predictor.");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    }
  };

  return (
    <div className="predictor-container">
      <ToastContainer />
      <p className="description">
        The Comprehensive Health Diagnostics Suite utilizes advanced AI
        technology for early detection and precise prediction of breast cancer,
        lung cancer, heart disease, and diabetes. By leveraging sophisticated
        algorithms and extensive datasets, our system identifies these
        conditions early, enabling timely interventions and personalized
        treatments. Our mission is to transform healthcare into a predictive and
        personalized experience, fostering a healthier future for all by
        reducing the burden of these diseases and enhancing quality of life.
      </p>
      <div className="card-container">
        <div
          onClick={() => handleLinkClick("/predictors/heart")}
          className="card"
          style={{ textDecoration: "none" }}
        >
          <Card
            image={heartImage}
            title="Heart Disease"
            description="Guarding Hearts: AI solutions for accurate prediction and early intervention in heart disease."
          />
        </div>
      
       
     
      </div>
    </div>
  );
}

export default PredictorsPage;
