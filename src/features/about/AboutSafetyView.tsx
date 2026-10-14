import React from 'react';
import { 
  ShieldCheck, 
  Database, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  BookOpen, 
  Lock,
  Award,
  Sparkles
} from 'lucide-react';

export const AboutSafetyView: React.FC = () => {
  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-sky-500/25">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-semibold border border-sky-500/30">
            <Award className="w-3.5 h-3.5" />
            Multimodal AI Hackathon 2026 — Track A
          </div>
          <h2 className="text-3xl font-extrabold text-white">
            About CardioVision 3D AI & Safety Framework
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed max-w-3xl">
            CardioVision 3D AI is an advanced prototype combining machine learning risk stratification, explainable feature attributions, and an interactive 3D anatomical digital twin for cardiovascular education and exploratory analysis.
          </p>
        </div>
      </div>

      {/* THREE CORE PILLARS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-panel p-6 rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">UCI Dataset Heritage</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Standardized on the canonical UCI Heart Disease benchmark (Cleveland, Hungarian, Long Beach VA cohorts). Calibrated with 13 core hemodynamic, lipid, and ECG parameters.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">Audited ML Pipeline</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Combines regularized Logistic Regression with Random Forest decision ensembles. Yields 0.884 ROC-AUC and 84.1% test accuracy without synthetic data leakage.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">Medical Safety Guardrails</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Strict separation between statistical estimation and anatomical diagnostic imaging. All conceptual 3D overlays are labeled as illustrative.
          </p>
        </div>
      </div>

      {/* DATASET BENCHMARK & SCHEMA DOCUMENTATION */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-5">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-sky-400" />
          UCI Heart Disease Dataset Specifications
        </h3>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            The UCI Heart Disease dataset is one of the most widely cited cardiovascular machine learning benchmarks, originated by Dr. Robert Detrano (VA Medical Center, Long Beach) and Dr. William Steinbrunn (University Hospital, Zurich).
          </p>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <strong className="text-white block font-semibold">Canonical Target Definition:</strong>
            <p className="text-slate-400">
              The dataset target variable (num) records the presence of heart disease defined as angiographic coronary artery diameter narrowing greater than 50% in one or more major coronary vessels (0 = diameter narrowing &lt;50%, 1 = narrowing &gt;50%).
            </p>
            <p className="text-amber-300 font-semibold text-[11px]">
              ⚠️ Important Note: The UCI target defines anatomical angiographic stenosis in a clinical referral cohort; it does not measure an absolute 10-year prospective event rate (such as Framingham or ASCVD PCE). CardioVision 3D AI labels its output strictly as an estimated probability of coronary vessel disease presence.
            </p>
          </div>
        </div>
      </div>

      {/* PRIVACY, HIPAA & ZERO-PII ARCHITECTURE */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-cyan-400" />
          Privacy & Data Protection Principles
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <strong className="text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Zero PII Retention
            </strong>
            <p className="text-slate-400 text-[11px]">
              We do not solicit, store, or persist patient names, social security numbers, dates of birth, or addresses.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <strong className="text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Ephemeral Multimodal Processing
            </strong>
            <p className="text-slate-400 text-[11px]">
              Uploaded lab reports and PDF documents are parsed in temporary server memory and immediately discarded.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <strong className="text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Server-Side Gemini Isolation
            </strong>
            <p className="text-slate-400 text-[11px]">
              All LLM and multimodal queries are executed exclusively server-side. No API keys or authorization credentials exist on the client bundle.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <strong className="text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Client-Driven PDF Generation
            </strong>
            <p className="text-slate-400 text-[11px]">
              Summary reports are compiled locally inside the browser memory using jsPDF without uploading clinical records to external servers.
            </p>
          </div>
        </div>
      </div>

      {/* FORMAL CLINICAL SAFETY DISCLAIMER */}
      <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs space-y-3">
        <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span>Official Medical Disclaimer & Educational Purpose Statement</span>
        </div>
        <p className="leading-relaxed">
          CardioVision 3D AI is an educational exploration application created for Track A: Cardiovascular Risk Visualization & Prediction of the Multimodal AI Hackathon 2026. It is <strong>NOT</strong> an FDA-cleared or CE-marked medical device, and it does not provide medical diagnoses, treatment planning, or clinical triage.
        </p>
        <p className="leading-relaxed">
          Never use this application to manage an acute medical emergency. If you or someone around you experience chest discomfort, shortness of breath, unexplained fainting, or pain radiating to the jaw, neck, or left arm, contact local emergency medical services (e.g., 911 or 112) immediately.
        </p>
      </div>
    </div>
  );
};
