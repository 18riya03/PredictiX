import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

import path from "path";
import fs from "fs";

// Set up multer for file uploads

// Get the directory path of the current ES module file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//------------------------------------

import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

export { upload };

// Define the relative path to the heartpredict.py script
const heartPath = resolve(
  __dirname,
  "../ML/Heart Disease Prediction/heartpredict.py"
);

// Post-prediction modules (Python)
const dietPath = resolve(
  __dirname,
  "../ML/Heart Disease Prediction/diet_recommendations.py"
);
const stressPath = resolve(
  __dirname,
  "../ML/Heart Disease Prediction/stress_analysis.py"
);
const chatbotPath = resolve(
  __dirname,
  "../ML/Heart Disease Prediction/health_chatbot.py"
);

// Define the relative path to the diabetespredict.py script
const diabetesPath = resolve(
  __dirname,
  "../ML/Diabetes Prediction/diabetespredict.py"
);

const runPython = (scriptPath, args = []) =>
  new Promise((resolvePromise, rejectPromise) => {
    const proc = spawn("python", [scriptPath, ...args]);
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        rejectPromise(
          new Error(
            `Python script failed (code ${code}). ${stderr || "No stderr."}`
          )
        );
        return;
      }
      resolvePromise(stdout.trim());
    });
  });

const heartpred = asyncHandler(async (req, res) => {
  try {
    const {
      p1,
      p2,
      p3,
      p4,
      p5,
      p6,
      p7,
      p8,
      p9,
      p10,
      p11,
      p12,
      p13,
      // optional post-prediction inputs
      sleep_hours,
      stress_self_report_0_10,
      chat_question,
    } = req.body;

    // Condition check for p2: If male (assuming 1 for male and 0 for female)
    const transformedP2 = isNaN(p2)
      ? p2.toLowerCase() === "male"
        ? 1
        : 0
      : p2;

    // Condition check for p6: If yes (assuming 1 for yes and 0 for no)
    const transformedP6 = isNaN(p6) ? (p6.toLowerCase() === "yes" ? 1 : 0) : p6;

    const features = [
      p1,
      transformedP2.toString(),
      p3,
      p4,
      p5,
      transformedP6.toString(),
      p7,
      p8,
      p9,
      p10,
      p11,
      p12,
      p13,
    ].map((v) => (typeof v === "undefined" ? "" : String(v)));

    const predictionStdout = await runPython(heartPath, features);
    const predictionVal = (predictionStdout || "").trim();

    if (predictionVal !== "0" && predictionVal !== "1") {
      res.status(500).json({
        message: "Unexpected prediction output from Python script",
        raw: predictionVal,
      });
      return;
    }

    // Call new post-prediction modules (best-effort; don't block response if one fails)
    let diet = null;
    let stress = null;
    let chatbot = null;

    try {
      const dietOut = await runPython(dietPath, [
        "--prediction",
        predictionVal,
        "--features",
        ...features,
      ]);
      diet = JSON.parse(dietOut);
    } catch (e) {
      console.error("Diet module error:", e?.message || e);
    }

    try {
      const stressArgs = ["--features", ...features];
      if (typeof sleep_hours !== "undefined") {
        stressArgs.push("--sleep_hours", String(sleep_hours));
      }
      if (typeof stress_self_report_0_10 !== "undefined") {
        stressArgs.push("--self_report_0_10", String(stress_self_report_0_10));
      }
      const stressOut = await runPython(stressPath, stressArgs);
      stress = JSON.parse(stressOut);
    } catch (e) {
      console.error("Stress module error:", e?.message || e);
    }

    if (typeof chat_question !== "undefined" && String(chat_question).trim()) {
      try {
        const chatOut = await runPython(chatbotPath, [
          "--question",
          String(chat_question),
          "--context_prediction",
          predictionVal,
        ]);
        chatbot = JSON.parse(chatOut);
      } catch (e) {
        console.error("Chatbot module error:", e?.message || e);
      }
    }

    if (predictionVal === "1") {
      res.json({
        prediction: predictionVal,
        result: "The person is suffering from Heart Disease",
        post_prediction: {
          diet,
          stress,
          chatbot,
        },
      });
    } else {
      res.json({
        prediction: predictionVal,
        result: "The person is not suffering from Heart Disease",
        post_prediction: {
          diet,
          stress,
          chatbot,
        },
      });
    }
  } catch (error) {
    console.error("Error", error);
    res.status(500).json({ message: "Failed to predict" });
  }
});

const heartDietRecommend = asyncHandler(async (req, res) => {
  try {
    const {
      prediction,
      // minimal inputs; if missing, we'll pass NaN so module ignores comparisons
      age,
      sex,
      trestbps,
      chol,
    } = req.body;

    const pred = typeof prediction === "undefined" ? "0" : String(prediction);

    // Provide 13 features in the model's expected order. Use NaN for unknowns.
    const features = [
      typeof age === "undefined" ? "nan" : String(age),
      typeof sex === "undefined" ? "nan" : String(sex),
      "nan", // cp
      typeof trestbps === "undefined" ? "nan" : String(trestbps),
      typeof chol === "undefined" ? "nan" : String(chol),
      "nan", // fbs
      "nan", // restecg
      "nan", // thalach
      "nan", // exang
      "nan", // oldpeak
      "nan", // slope
      "nan", // ca
      "nan", // thal
    ];

    const dietOut = await runPython(dietPath, [
      "--prediction",
      pred,
      "--features",
      ...features,
    ]);
    res.json(JSON.parse(dietOut));
  } catch (error) {
    console.error("heartDietRecommend error", error);
    res.status(500).json({ message: "Failed to generate diet recommendations" });
  }
});

const stressAnalyze = asyncHandler(async (req, res) => {
  try {
    const { sleep_hours, mood, work_hours, activity_level } = req.body;

    const args = [
      "--sleep_hours",
      String(sleep_hours ?? 0),

      "--mood",
      String(mood ?? "okay"),

      "--work_hours",
      String(work_hours ?? 0),

      "--activity_level",
      String(activity_level ?? "moderate"),
    ];

    const stressOut = await runPython(stressPath, args);

    const parsed = JSON.parse(stressOut);

    res.json(parsed);
  } catch (error) {
    console.error("stressAnalyze error", error);
    res.status(500).json({
      message: "Failed to analyze stress",
    });
  }
});

const healthChat = asyncHandler(async (req, res) => {
  try {
    const { question, context_prediction } = req.body;
    if (!question || !String(question).trim()) {
      throw new ApiError(400, "Question is required");
    }

    const args = ["--question", String(question)];
    if (typeof context_prediction !== "undefined") {
      args.push("--context_prediction", String(context_prediction));
    }

    const chatOut = await runPython(chatbotPath, args);
    res.json(JSON.parse(chatOut));
  } catch (error) {
    console.error("healthChat error", error);
    res.status(500).json({ message: "Failed to answer question" });
  }
});

const diabetespred = asyncHandler(async (req, res) => {
  try {
    const {
      pregnancies,
      glucose,
      bloodPressure,
      skinThickness,
      insulin,
      bmi,
      diabetesPedigreeFunction,
      age,
    } = req.body;

    const inputData = [
      pregnancies,
      glucose,
      bloodPressure,
      skinThickness,
      insulin,
      bmi,
      diabetesPedigreeFunction,
      age,
    ];

    if (!inputData.every((value) => typeof value !== "undefined")) {
      throw new ApiError(400, "All inputData fields must be provided");
    }

    const pythonProcess = spawn("python", [diabetesPath, ...inputData]);

    let predictionVal = "";

    pythonProcess.stdout.on("data", (data) => {
      console.log("python stdout: ", data.toString());
      predictionVal = data.toString().trim();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`stderr: ${data.toString()}`);
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`Python script exited with code ${code}`);
        res.status(500).json({ message: "Python script error" });
      } else {
        console.log("predictionVal: ", predictionVal);
        console.log(typeof predictionVal);
        if (predictionVal === "1") {
          res.json({
            prediction: predictionVal.trim(),
            result: "The person is suffering from Diabetes",
          });
        } else if (predictionVal === "0") {
          res.json({
            prediction: predictionVal.trim(),
            result: "The person is not suffering from Diabetes",
          });
        }
      }
    });
  } catch (error) {
    console.error("Error", error);
    res.status(500).json({ message: "Failed to predict" });
  }
});

const lungpred = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      console.error("Multer did not process the file");
      throw new ApiError(400, "No image file uploaded");
    }

    const filePath = path.resolve(
      __dirname,
      "..",
      "uploads",
      req.file.filename
    );
    console.log("Resolved file path:", filePath);

    if (!fs.existsSync(filePath)) {
      throw new ApiError(404, "Uploaded file not found");
    }

    const pythonProcess = spawn("python", [
      path.resolve(__dirname, "../ML/Lung Cancer Prediction/predict.py"),
      filePath,
    ]);

    let predictionData = "";
    let errorOccurred = false;

    pythonProcess.stdout.on("data", (data) => {
      predictionData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`Error from Python script: ${data}`);
      errorOccurred = true;
      res.status(500).json({ error: "Prediction error" });
    });

    pythonProcess.on("close", (code) => {
      if (code === 0 && !errorOccurred) {
        predictionData = predictionData.trim();
        if (predictionData === "cancerous") {
          res
            .status(200)
            .json({ prediction: "Person is suffering from Lung Cancer" });
        } else if (predictionData === "non-cancerous") {
          res
            .status(200)
            .json({ prediction: "Person is not suffering from Lung Cancer" });
        } else {
          res.status(500).json({ error: "Unexpected prediction result" });
        }
      } else if (!errorOccurred) {
        res.status(500).json({ error: "Prediction error" });
      }

      // Always delete the file after the prediction process
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        }
      });
    });
  } catch (error) {
    console.error("Error in lungpred controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const breastpred = asyncHandler(async (req, res) => {
  if (!req.file) {
    console.error("Multer did not process the file");
    throw new ApiError(400, "No image file uploaded");
  }

  const filePath = path.resolve(__dirname, "..", "uploads", req.file.filename);
  console.log("Resolved file path:", filePath);

  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, "Uploaded file not found");
  }

  const pythonProcess = spawn("python", [
    path.resolve(
      __dirname,
      "../ML/Breast Cancer Prediction/breast_cancer_prediction.py"
    ),
    filePath,
  ]);

  let predictionData = "";
  let errorOccurred = false;

  pythonProcess.stdout.on("data", (data) => {
    predictionData += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`Error: ${data}`);
    errorOccurred = true;
    res.status(500).json({ error: "Prediction error" });
  });

  pythonProcess.on("close", (code) => {
    if (code === 0 && !errorOccurred) {
      res.status(200).json({ prediction: predictionData.trim() });
    } else if (!errorOccurred) {
      res.status(500).json({ error: "Prediction error" });
    }

    // Always delete the file after the prediction process
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      }
    });
  });
});

export {
  heartpred,
  diabetespred,
  lungpred,
  breastpred,
  heartDietRecommend,
  stressAnalyze,
  healthChat,
};
