# CardioVision 3D AI — Multimodal Cardiovascular Risk Platform

An interactive, multimodal clinical cardiovascular assessment and educational platform combining **Three.js 3D cardiac anatomical modeling**, a **validated multivariate logistic regression prediction engine**, **Gemini 3.8 Multimodal AI for clinical document ingestion**, and an **explainable conversational health assistant with voice synthesis and recognition**.

---

## 🌟 Table of Contents
1. [Project Overview](#project-overview)
2. [How AI Helped Build & Powers This Application](#how-ai-helped-build--powers-this-application)
   - [AI in Application Development (Coding Engine & Architecture)](#1-ai-in-application-development)
   - [AI Models & Capabilities Inside the Runtime](#2-ai-models--capabilities-inside-the-runtime)
3. [Key Features & Modules](#key-features--modules)
4. [Dataset & Clinical Modeling Methodology](#dataset--clinical-modeling-methodology)
5. [System Architecture](#system-architecture)
6. [Tech Stack](#tech-stack)
7. [Getting Started & Installation](#getting-started--installation)
8. [API Endpoints](#api-endpoints)
9. [Sample Test Profiles](#sample-test-profiles)
10. [Safety, Ethical Boundaries & Clinical Disclaimer](#safety-ethical-boundaries--clinical-disclaimer)

---

## 🫀 Project Overview

**CardioVision 3D AI** bridges the gap between complex cardiovascular data and patient comprehension. In typical clinical practice, patients receive abstract lab numbers and risk percentages without understanding the anatomical or physiological significance.

CardioVision translates clinical inputs (resting vitals, lipid panels, treadmill exercise electrocardiogram parameters, and fluoroscopic catheterization results) into:
- **Interactive 3D Heart Visualization**: Real-time beating anatomical model highlighting coronary arteries, perfusion territories, and chamber hemodynamics.
- **Explainable Statistical Risk Prediction**: Clear distinction between research cohort probability (>= 50% coronary artery stenosis) and personal lifestyle factors.
- **Simulated What-If Scenarios**: Modifiable risk modeling to demonstrate the direct impact of blood pressure control, smoking cessation, and increased exercise tolerance.
- **Multimodal Medical Document Extraction**: Automated extraction of clinical markers from lab reports and imaging summaries.
- **Multimodal Voice & Audio Support**: Speech-to-text dictation and text-to-speech audio playback across assessments and assistant interactions.
- **Actionable Health Plans**: Evidence-based lifestyle and nutrition guides (including culturally relevant Indian heart-healthy meal frameworks) and doctor discussion prompts.

---

## 🤖 How AI Helped Build & Powers This Application

This project represents a dual integration of Artificial Intelligence: **AI as the primary software engineering accelerator** and **AI as runtime intelligence services**.

### 1. AI in Application Development
The entire architecture, mathematical modeling, and user experience were developed with the assistance of advanced coding AI models:
- **Rapid Full-Stack Scaffolding**: Built a full-stack TypeScript application with React 19, Vite, Express, and Tailwind CSS.
- **3D Procedural Mesh & Shader Engineering**: Generated procedural Three.js coronary vascular paths (LAD, LCx, RCA) using cubic Bézier curves, dynamic heart contraction vertex animations, and custom GLSL-style shaders for myocardial wall displacement.
- **Statistical Model Porting & Calibration**: Formulated and validated standardized L2-regularized logistic regression coefficients derived from the multi-center UCI Heart Disease cohort (Cleveland, Hungarian, Long Beach VA) with exact z-score parameter scaling.
- **Audio & Accessibility Architecture**: Implemented Web Speech API speech-to-text dictation for hands-free clinical intake and speech synthesis for interactive voice reviews.
- **Defensive Type Safety & Bug Auditing**: Strict end-to-end TypeScript interfaces spanning biometric inputs, catheterization findings, SHAP-style attribution vectors, and reactive state stores.

### 2. AI Models & Capabilities Inside the Runtime
Within the deployed application, multiple AI layers work together:

| AI Component | Implementation | Functionality |
| :--- | :--- | :--- |
| **Multimodal Document OCR & Extraction** | `Gemini 3.8 Flash` (`@google/genai` SDK) | Parses uploaded clinical lab PDFs, images, and scanned reports to extract resting BP, cholesterol fractions, fasting glucose, and exercise stress data with human-in-the-loop verification. |
| **Conversational Health Assistant** | `Gemini 3.8 Flash` with strict clinical boundary prompting | Context-aware educational assistant that explains risk factors, clarifies medical jargon, answers questions about treadmill tests, and prepares questions for doctors without prescribing or diagnosing. |
| **Statistical Risk Classification** | Validated L2 Logistic Regression Engine | Standardizes 13 clinical inputs against population means/standard deviations to calculate predicted disease probability and categorical classification (Low, Moderate, Elevated). |
| **Explainable AI (XAI) Attribution** | Standardized Feature Impact Engine | Calculates individual log-odds contributions and odds ratio estimates for each biometric factor, explaining whether each parameter is *protective*, *neutral*, or *elevating*. |
| **Voice Multimodal AI** | Web Speech Recognition & SpeechSynthesis APIs | Hands-free clinical intake dictation, automated field extraction, and audible clinical review playback. |

---

## 🔬 Key Features & Modules

### 1. Interactive 3D Heart Explorer (`ThreeHeartViewer`)
- **Procedural Anatomy**: Accurate representation of Aorta, Pulmonary Artery, Left/Right Ventricles, Left/Right Atria, Superior/Inferior Vena Cava, and Coronary Arteries (LAD, LCx, RCA).
- **Dynamic Heart Rate Synchronization**: Myocardial contraction speed pulses dynamically to match the patient's resting or exercise heart rate.
- **Dual Perspective Modes**:
  - *Heart Focus*: Detailed isolated cardiac view with coronary vessel highlight.
  - *Torso / Context*: Anatomical alignment within a semi-transparent thoracic rib cage frame.
- **Color Legend Transparency**: Clear distinction between *anatomical tissue rendering* and *statistical model risk overlays*.
- **Inspection Tools**: Raycasting anatomical pinpoints, 3D cross-sections, wireframe toggles, and high-resolution camera snapshot capture.

### 2. Clinical Risk Estimation & Explainable AI
- **Transparent Output**: Explicitly reports predicted probability of significant coronary artery stenosis (>= 50% diameter narrowing at catheterization) based on research cohorts.
- **SHAP-Style Feature Attribution**: Visual breakdown of top protective factors (e.g., high peak exercise HR, normal ST slope) and top elevating risk factors (e.g., fluoroscopy vessel count, ST depression).
- **Normal Reference Ranges**: Every measured value is displayed alongside its standard clinical unit and reference target.

### 3. What-If Scenario Simulator
- Test hypothetical lifestyle and clinical improvements:
  - Lowering systolic blood pressure (e.g., 148 -> 120 mm Hg).
  - Improving aerobic capacity (e.g., max exercise HR from 132 to 160 bpm).
  - Normalizing total serum cholesterol.
  - Cessation of smoking.
- Displays immediate **Absolute Risk Reduction (ARR)** and trajectory charts.

### 4. Multimodal Health Data Lab
- Upload medical records, lab slips, or ECG summaries in **PDF, JPG, PNG, or CSV** format.
- Powered by **Gemini 3.8 Flash** with confidence scoring for each extracted metric.
- Verified review screen ensures no auto-applied values without clinician/patient confirmation.

### 5. Multimodal Voice Assistant
- Voice dictation for rapid assessment entry.
- Verbal read-back of clinical summaries with play/pause/replay controls.
- Interactive voice chat in the AI Health Assistant tab.

### 6. Comprehensive Report Generator (PDF Export)
Generates an 8-section clinical summary report:
1. Patient Assessment Summary
2. Predicted Model Target & Statistical Result Interpretation
3. Confirmed Clinical Inputs & Standard Units
4. Relevant Cardiovascular Health Factors & Clinical Context
5. Model Feature Contributions (Log-Odds with no claim of causation)
6. Personalized Heart-Healthy Action Plan (Diet, Physical Activity, Lifestyle, Doctor Questions)
7. 3D Heart Visualization Snapshot & Legend
8. Technical Limitations, Uncertainty & Clinical Disclaimer

### 7. Holistic Action Plan with Diverse Nutrition Options
- Personalized guidance on Mediterranean & DASH dietary approaches.
- Culturally diverse, heart-healthy Indian dietary suggestions (e.g., whole mung bean chilla, fenugreek/methi sabzi, cold-pressed mustard or olive oil, roasted chana snacks, and reduced ghee/refined oil guidance).

---

## 📊 Dataset & Clinical Modeling Methodology

The core statistical prediction engine is grounded in the **UCI Heart Disease Benchmark Dataset** (merged Cleveland, Hungarian, Long Beach VA, and Switzerland cohorts; $n = 920$ patients):

$$\text{Log-Odds } z = \beta_0 + \sum_{i=1}^{13} \beta_i \left( \frac{x_i - \mu_i}{\sigma_i} \right)$$

$$\text{Predicted Probability } P(Y=1) = \frac{1}{1 + e^{-z}}$$

- **Target Definition**: Presence of significant coronary artery disease ($\ge 50\%$ diameter stenosis in one or more major coronary vessels verified by invasive coronary angiography).
- **Risk Tiers**:
  - **Low Risk**: $P < 35\%$
  - **Moderate Risk**: $35\% \le P < 60\%$
  - **Elevated Risk**: $P \ge 60\%$

---

## 🏗️ System Architecture

```
cardiovision-3d-ai/
├── server.ts                    # Full-Stack Express API & Gemini AI gateway
├── index.html                   # Entry HTML with meta & viewport configuration
├── metadata.json                # AI Studio build configuration & permissions
├── package.json                 # Dependencies and execution scripts
├── src/
│   ├── main.tsx                 # React application mounting
│   ├── App.tsx                  # Root component, routing, state orchestration
│   ├── index.css                # Global Tailwind CSS styling & theme variables
│   ├── types/
│   │   └── cardiac.ts           # End-to-end TypeScript interfaces
│   ├── data/
│   │   └── syntheticProfiles.ts # Benchmark patient profiles (Low, Mod, High)
│   ├── services/
│   │   ├── predictionEngine.ts  # Standardized logistic regression & attribution
│   │   ├── recommendationEngine.ts # Heart-health action plans & Indian diet options
│   │   └── geminiService.ts     # Client proxy calls to Express Gemini routes
│   ├── components/
│   │   └── Navigation.tsx       # Top responsive navigation bar & theme toggle
│   └── features/
│       ├── overview/            # Assessment dashboard & top metrics
│       ├── assessment/          # Multimodal clinical assessment intake form
│       ├── visualization/       # Three.js 3D heart & thoracic context viewer
│       ├── explainability/      # Feature contribution charts & model telemetry
│       ├── simulator/           # What-If risk trajectory slider simulator
│       ├── datalab/             # Multimodal OCR document ingestion lab
│       ├── assistant/           # Gemini AI clinical education chat & voice
│       ├── reports/             # 8-section clinical report view & PDF generator
│       └── about/               # Methodological docs, safety, & clinical disclaimer
```

---

## 💻 Tech Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, Motion (Framer Motion).
- **3D Graphics**: Three.js (custom geometry, shaders, Bézier tubes, procedural myocardium, orbit controls).
- **Backend & Server**: Express 4, Node.js (via `tsx`), Multer (ephemeral memory storage).
- **AI & Machine Learning**:
  - `@google/genai` TypeScript SDK (Gemini 3.8 Flash).
  - Multivariate Logistic Regression (standardized L2 coefficients on UCI Heart Disease).
- **Audio & Accessibility**: Browser Web Speech API (`webkitSpeechRecognition` & `SpeechSynthesisUtterance`).
- **Reporting & Export**: jsPDF for client-side formatted PDF generation with embedded 3D canvas snapshots.

---

## 🚀 Getting Started & Installation

### Prerequisites
- Node.js 18+ installed.
- (Optional) `GEMINI_API_KEY` for live generative assistant queries and document extraction. The app includes deterministic fallbacks if no key is provided.

### Installation Steps

1. **Clone or open the repository**:
   ```bash
   git clone <repo-url>
   cd cardiovision-3d-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser to `http://localhost:3000`.

5. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/predict` | Computes standardized probability and feature contributions from patient input JSON. |
| `POST` | `/api/gemini/assistant` | Streams/returns educational cardiovascular explanations with safety bounds. |
| `POST` | `/api/gemini/extract-multimodal` | Accepts multipart/form-data document uploads to parse clinical biometrics. |

---

## 🧪 Sample Test Profiles

You can test the clinical model immediately using the synthetic presets or manual entry:

- **Elena Rostova (Low Risk ~15%)**: 46F, Resting BP 114 mm Hg, Peak HR 172 bpm, 0 vessels, 0.2 mm ST depression, normal ECG.
- **David Chen (Moderate Risk ~45%)**: 64M, Resting BP 136 mm Hg, Peak HR 145 bpm, 1 vessel, 1.1 mm ST depression, atypical angina.
- **Marcus Vance (Elevated Risk ~85%)**: 58M, Resting BP 148 mm Hg, Peak HR 132 bpm, 2 vessels, 2.4 mm ST depression, typical angina, reversible thallium defect.

---

## ⚠️ Safety, Ethical Boundaries & Clinical Disclaimer

1. **Educational & Decision-Support Only**: CardioVision 3D AI is an educational simulation and research demonstration. It is **not** a certified medical diagnostic device (CE Mark / FDA 510(k)).
2. **No Clinical Causation**: Statistical feature contributions (log-odds) represent correlational patterns identified in referral cohorts and do not establish individual biological causation.
3. **No Prescription or Treatment Advice**: The application does not prescribe medication, adjust dosages, or suggest changing therapies.
4. **Emergency Warning**: If any user experiences acute symptoms such as crushing chest pressure, pain radiating to the jaw/left arm, acute shortness of breath, or unexplained syncope, they must immediately contact emergency medical services (911/112).
