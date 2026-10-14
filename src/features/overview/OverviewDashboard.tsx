import React, { useState, useEffect, useRef } from 'react';
import { 
  PatientAssessmentInput, 
  PredictionResult 
} from '../../types/cardiac';
import { 
  Activity, 
  Layers, 
  Heart, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Microscope,
  Info,
  HelpCircle,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Utensils,
  Flame,
  Stethoscope,
  AlertOctagon,
  FileText
} from 'lucide-react';
import { NavigationTab } from '../../components/Navigation';
import { generateHeartHealthActionPlan } from '../../services/recommendationEngine';
import { 
  generateVoiceResultsScript, 
  SpeechPlayerController, 
  isSpeechSynthesisSupported 
} from '../../services/speechService';

interface OverviewDashboardProps {
  patientInput: PatientAssessmentInput;
  predictionResult: PredictionResult;
  onNavigate: (tab: NavigationTab) => void;
  onSelectSyntheticProfile: (profileId: string) => void;
  onLaunchDemo: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  patientInput,
  predictionResult,
  onNavigate,
  onSelectSyntheticProfile,
  onLaunchDemo
}) => {
  const probPercent = (predictionResult.predictedProbability * 100).toFixed(1);
  const isHigh = predictionResult.riskCategory === 'elevated';
  const isMod = predictionResult.riskCategory === 'moderate';

  const riskBadgeStyles = isHigh
    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
    : isMod
    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';

  // Generate personalized heart health action plan
  const actionPlan = generateHeartHealthActionPlan(patientInput, predictionResult);

  // Audio / Speech State
  const [isAudioSupported, setIsAudioSupported] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [audioTranscript, setAudioTranscript] = useState('');
  const [showTranscriptDrawer, setShowTranscriptDrawer] = useState(false);

  const speechControllerRef = useRef<SpeechPlayerController | null>(null);

  useEffect(() => {
    setIsAudioSupported(isSpeechSynthesisSupported());
    speechControllerRef.current = new SpeechPlayerController((state) => {
      setIsPlayingAudio(state.isSpeaking && !state.isPaused);
      setIsPausedAudio(state.isPaused);
    });

    return () => {
      speechControllerRef.current?.stop();
    };
  }, []);

  const handleStartAudioResults = () => {
    const script = generateVoiceResultsScript(patientInput, predictionResult, actionPlan);
    setAudioTranscript(script);
    setShowTranscriptDrawer(true);
    speechControllerRef.current?.speak(script);
  };

  const handlePauseAudio = () => {
    speechControllerRef.current?.pause();
  };

  const handleResumeAudio = () => {
    speechControllerRef.current?.resume();
  };

  const handleStopAudio = () => {
    speechControllerRef.current?.stop();
    setIsPlayingAudio(false);
    setIsPausedAudio(false);
  };

  const handleReplayAudio = () => {
    speechControllerRef.current?.replay();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* HERO BANNER & HACKATHON STATEMENT */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-[#0a1832] to-slate-900 border border-sky-500/25 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Multimodal AI Hackathon 2026 — Track A Cardiovascular Visualization
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              CardioVision 3D AI
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Bridging machine learning risk stratification, explainable feature attributions, personalized action plans, and interactive 3D human anatomy. Designed for clinicians, researchers, and patient health education.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Audited Risk Stratification
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Real-Time Three.js Spatial Heatmap
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Voice-Enabled Guided Review &amp; Speech
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0">
            <button
              onClick={onLaunchDemo}
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 font-extrabold text-sm shadow-xl shadow-sky-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>Launch Demo Assessment</span>
            </button>
            <button
              onClick={() => onNavigate('explorer')}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-sky-500/30 text-sky-200 text-sm font-semibold transition-all hover:text-white cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Enter 3D Explorer</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* DATA PROVENANCE BANNER (SYNTHETIC DEMO VS CUSTOM CLINICAL ASSESSMENT) */}
      {patientInput.isSyntheticDemo ? (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-amber-300">Active Profile: </span>
              <span>{patientInput.profileName || 'Synthetic Benchmark Patient'}</span>
              <span className="text-amber-400/80 block sm:inline sm:ml-2">
                (Clearly labeled DEMO DATA for hackathon evaluation &bull; Not a real patient record)
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('assessment')}
            className="text-amber-300 underline font-semibold hover:text-amber-100 shrink-0 cursor-pointer"
          >
            Edit Values
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-emerald-300">Active Profile: </span>
              <span>{patientInput.profileName || 'Custom Patient Clinical Assessment'}</span>
              <span className="text-emerald-300/80 block sm:inline sm:ml-2">
                (User-provided or extracted clinical data &bull; Calibrated prediction active)
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('assessment')}
            className="text-emerald-300 underline font-semibold hover:text-white shrink-0 cursor-pointer"
          >
            Modify Values
          </button>
        </div>
      )}

      {/* ========================================================
          PART 1 — YOUR CARDIOVASCULAR HEALTH ASSESSMENT (PROMINENT)
          ======================================================== */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-sky-500/30 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
                <Heart className="w-5 h-5 text-rose-500" />
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">Your Cardiovascular Health Assessment</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Patient-specific statistical risk stratification based on confirmed clinical markers and historical catheterization benchmarks.
            </p>
          </div>

          {/* SPOKEN RESULTS (PART 7) CTA */}
          <div className="flex items-center gap-2">
            <button
              onClick={isPlayingAudio ? handlePauseAudio : isPausedAudio ? handleResumeAudio : handleStartAudioResults}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="w-4 h-4 fill-slate-950" />
                  <span>Pause Spoken Summary</span>
                </>
              ) : isPausedAudio ? (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Resume Spoken Summary</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Listen to My Results</span>
                </>
              )}
            </button>

            {(isPlayingAudio || isPausedAudio) && (
              <button
                onClick={handleStopAudio}
                title="Stop Audio"
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              >
                <VolumeX className="w-4 h-4" />
              </button>
            )}

            {audioTranscript && !isPlayingAudio && !isPausedAudio && (
              <button
                onClick={handleReplayAudio}
                title="Replay Spoken Summary"
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* SPOKEN RESULTS TRANSCRIPT DRAWER */}
        {showTranscriptDrawer && audioTranscript && (
          <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-800/60 text-xs space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-sky-300 font-bold">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4" />
                Spoken Assessment Audio Transcript
              </span>
              <span className="text-[10px] font-mono text-sky-400">
                {isPlayingAudio ? 'Speaking...' : isPausedAudio ? 'Paused' : 'Complete'}
              </span>
            </div>
            <p className="text-slate-200 text-[11px] leading-relaxed italic bg-slate-950/50 p-3 rounded-xl border border-sky-900/40">
              "{audioTranscript}"
            </p>
          </div>
        )}

        {/* PRIMARY PREDICTION CARD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Model Output</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${riskBadgeStyles}`}>
                {predictionResult.riskCategory} Likelihood
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-extrabold text-white font-mono">{probPercent}%</span>
                <span className="text-xs text-sky-400 font-bold uppercase">Classification Score</span>
              </div>
              <p className="text-xs text-slate-300">
                Model Classification Score on Historical Catheterization Referral Cohort
              </p>
            </div>

            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${isHigh ? 'bg-gradient-to-r from-amber-500 to-rose-500' : isMod ? 'bg-amber-400' : 'bg-cyan-400'}`}
                style={{ width: `${predictionResult.predictedProbability * 100}%` }}
              />
            </div>

            <div className="text-[11px] text-amber-300/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/25 leading-snug">
              <strong>Uncalibrated Score Notice:</strong> This output reflects classification similarity on a referral cohort, NOT an individual's validated clinical disease probability or 10-year event risk.
            </div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* 1. Predicted Outcome */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <h4 className="font-bold text-sky-300 flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                1. Predicted Outcome &amp; Exact Target
              </h4>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                The model was trained to predict the <strong>presence of angiographically verified coronary artery disease (&gt;50% vessel diameter stenosis in at least one major vessel upon catheterization)</strong> in the UCI benchmark dataset.
              </p>
            </div>

            {/* 2. What this score means and does not mean */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <h4 className="font-bold text-rose-300 flex items-center gap-1.5 text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                2. What the Score Does NOT Mean
              </h4>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                A score of {probPercent}% does <strong>NOT</strong> mean a {probPercent}% chance of a future heart attack (unlike 10-year ASCVD tools) and does <strong>NOT</strong> equal a clinical diagnosis. It reflects cross-sectional research associations.
              </p>
            </div>

            {/* 3. Prediction Horizon */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <h4 className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                3. Prediction Horizon &amp; Uncertainty
              </h4>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {predictionResult.predictionHorizon}
              </p>
              <p className="text-[10px] text-slate-400 italic">
                * 95% Confidence Interval omitted per statistical audit: individual prediction variance requires an empirical covariance matrix to prevent false precision.
              </p>
            </div>

            {/* 4. Appropriate Next Steps */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <h4 className="font-bold text-emerald-300 flex items-center gap-1.5 text-sm">
                <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                4. Appropriate Next Steps &amp; Diagnostics
              </h4>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Confirming or excluding coronary disease requires formal non-invasive imaging: <strong>Coronary CT Angiography (CCTA)</strong>, <strong>Coronary Artery Calcium (CAC) scoring</strong>, or stress echocardiography evaluated by a cardiologist.
              </p>
            </div>
          </div>
        </div>

        {/* CLINICAL 10-YEAR & LIFETIME HEART ATTACK / ASCVD RISK (ACC/AHA GUIDELINES) */}
        {predictionResult.prognosticRisk && (
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-[#0a1830] to-slate-900 border border-sky-500/40 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-900/40 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  <Flame className="w-5 h-5 text-rose-400" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white">
                    Individual 10-Year &amp; Lifetime Heart Attack / Stroke Probability
                  </h3>
                  <p className="text-[11px] text-sky-300">
                    Calculated using official American College of Cardiology &amp; American Heart Association (ACC/AHA) Pooled Cohort Equations
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-300 border border-sky-400/30 font-semibold self-start sm:self-auto">
                Prospective Hard Event Risk
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 10-Year ASCVD Event Risk */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">10-Year Hard Heart Attack &amp; Stroke Risk</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                    predictionResult.prognosticRisk.tenYearRiskPercent >= 20
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : predictionResult.prognosticRisk.tenYearRiskPercent >= 7.5
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {predictionResult.prognosticRisk.tenYearRiskTier}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                    {predictionResult.prognosticRisk.tenYearRiskPercent}%
                  </span>
                  <span className="text-xs text-sky-400 font-semibold">10-year probability</span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {predictionResult.prognosticRisk.tenYearOutcomeDefinition}
                </p>

                <div className="text-[11px] bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-slate-400">
                  <span>Optimal profile for your age:</span>
                  <strong className="text-emerald-400 font-mono font-bold">
                    {predictionResult.prognosticRisk.optimalTenYearRiskPercent}%
                  </strong>
                </div>
              </div>

              {/* Lifetime ASCVD Risk */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Individual Lifetime Cardiovascular Risk</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                    predictionResult.prognosticRisk.lifetimeRiskPercent >= 39
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {predictionResult.prognosticRisk.lifetimeRiskTier}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                    {predictionResult.prognosticRisk.lifetimeRiskPercent}%
                  </span>
                  <span className="text-xs text-sky-400 font-semibold">lifetime probability</span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {predictionResult.prognosticRisk.lifetimeOutcomeDefinition}
                </p>

                <div className="text-[11px] bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-slate-400">
                  <span>Optimal lifetime benchmark:</span>
                  <strong className="text-emerald-400 font-mono font-bold">
                    {predictionResult.prognosticRisk.optimalLifetimeRiskPercent}%
                  </strong>
                </div>
              </div>
            </div>

            {/* Key Risk Drivers */}
            {predictionResult.prognosticRisk.keyDrivers.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs space-y-2">
                <span className="font-bold text-slate-300 block text-[11px] uppercase tracking-wider">
                  Primary Clinically Actionable Drivers Elevating Your Event Probability:
                </span>
                <div className="flex flex-wrap gap-2">
                  {predictionResult.prognosticRisk.keyDrivers.map((driver, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-sky-950/60 border border-sky-800/60 text-sky-200 text-[11px] font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      {driver}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ========================================================
          WHAT MAY AFFECT YOUR CARDIOVASCULAR HEALTH?
          Actual submitted values, units, clinical reference targets
          ======================================================== */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-400" />
              What May Affect Your Cardiovascular Health?
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Your actual submitted measurements compared with clinical reference guidelines:
            </p>
          </div>
          <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700 w-fit">
            Units &amp; Reference Context
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Blood Pressure Card */}
          <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-sky-500/40 transition-all space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold text-slate-300">Blood Pressure (Systolic)</span>
              <Activity className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono">{patientInput.restingBP}</span>
              <span className="text-xs text-slate-400 font-mono">mm Hg</span>
            </div>
            <div className="text-xs flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${patientInput.restingBP > 130 ? 'bg-rose-400' : 'bg-emerald-400'}`} />
              <span className="text-slate-300 font-medium">
                {patientInput.restingBP > 140 ? 'Stage 2 Hypertension' : patientInput.restingBP > 120 ? 'Elevated Pressure' : 'Normal Pressure'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              <strong>Why it matters:</strong> Elevated pressure exerts chronic shear stress on arterial walls, accelerating endothelial damage and atherosclerotic plaque formation. Reference target: &lt;120 mm Hg.
            </p>
          </div>

          {/* Serum Cholesterol Card */}
          <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-sky-500/40 transition-all space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold text-slate-300">Total Serum Cholesterol</span>
              <Microscope className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono">{patientInput.serumCholesterol}</span>
              <span className="text-xs text-slate-400 font-mono">mg/dL</span>
            </div>
            <div className="text-xs flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${patientInput.serumCholesterol > 200 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <span className="text-slate-300 font-medium">
                {patientInput.serumCholesterol >= 240 ? 'High Hypercholesterolemia' : patientInput.serumCholesterol >= 200 ? 'Borderline High' : 'Desirable Range'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              <strong>Why it matters:</strong> Circulating atherogenic lipoproteins infiltrate the arterial intima, contributing to plaque volume. Clinical target: &lt;200 mg/dL (with optimal LDL &lt;100 mg/dL).
            </p>
          </div>

          {/* Fasting Glucose / Diabetes Card */}
          <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-sky-500/40 transition-all space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold text-slate-300">Fasting Glucose &amp; Diabetes</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono">{patientInput.fastingBloodSugar}</span>
              <span className="text-xs text-slate-400 font-mono">mg/dL</span>
            </div>
            <div className="text-xs flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${patientInput.fastingBloodSugar >= 126 || patientInput.diabetesDiagnosed ? 'bg-rose-400' : patientInput.fastingBloodSugar >= 100 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <span className="text-slate-300 font-medium">
                {patientInput.diabetesDiagnosed ? 'Diagnosed Diabetes' : patientInput.fastingBloodSugar >= 126 ? 'Elevated (Diabetes Range)' : patientInput.fastingBloodSugar >= 100 ? 'Prediabetic Range' : 'Normal Fasting'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              <strong>Why it matters:</strong> Hyperglycemia induces advanced glycation end-products and microvascular remodeling, compounding coronary risk. Target: &lt;100 mg/dL fasting.
            </p>
          </div>

          {/* Peak Exercise HR Card */}
          <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-sky-500/40 transition-all space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold text-slate-300">Peak Exercise HR (thalach)</span>
              <Heart className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono">{patientInput.maxHR}</span>
              <span className="text-xs text-slate-400 font-mono">bpm</span>
            </div>
            <div className="text-xs flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${patientInput.maxHR >= 145 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-slate-300 font-medium">
                {patientInput.maxHR >= 150 ? 'Strong Chronotropic Reserve' : 'Reduced Exertional Peak'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              <strong>Why it matters:</strong> High peak exercise rate indicates cardiovascular reserve and physical fitness. Age-predicted maximum target is ~{Math.round(220 - patientInput.age)} bpm.
            </p>
          </div>

          {/* Exercise ST Depression Card */}
          <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-sky-500/40 transition-all space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold text-slate-300">Exercise ST Depression (oldpeak)</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono">{patientInput.stDepression.toFixed(1)}</span>
              <span className="text-xs text-slate-400 font-mono">mm</span>
            </div>
            <div className="text-xs flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${patientInput.stDepression >= 1.0 ? 'bg-rose-400' : 'bg-emerald-400'}`} />
              <span className="text-slate-300 font-medium">
                {patientInput.stDepression >= 2.0 ? 'Marked Subendocardial Ischemia' : patientInput.stDepression >= 1.0 ? 'Inducible Ischemia Signal' : 'Minimal / Normal ST Shift'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              <strong>Why it matters:</strong> ST-segment horizontal or downsloping shifts on treadmill stress indicate exertional supply-demand mismatch in the myocardium. Target: &lt;0.5 mm.
            </p>
          </div>

          {/* Smoking & Lifestyle Card */}
          <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-sky-500/40 transition-all space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold text-slate-300">Smoking Status &amp; Exposure</span>
              <Flame className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white capitalize">{patientInput.smokingStatus}</span>
              <span className="text-xs text-slate-400">Smoker</span>
            </div>
            <div className="text-xs flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${patientInput.smokingStatus === 'current' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
              <span className="text-slate-300 font-medium">
                {patientInput.smokingStatus === 'current' ? 'Active Tobacco Exposure' : patientInput.smokingStatus === 'former' ? 'Former Tobacco Exposure' : 'Non-Smoker (Low Risk)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              <strong>Why it matters:</strong> Tobacco combustion impairs endothelial vasodilation and doubles coronary thrombosis risk. Cessation rapidly attenuates acute risk.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-900/60 flex items-start gap-2.5 text-xs text-sky-200">
          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <span>
            <strong>Clinical Correlation Notice:</strong> Observed factors represent epidemiological correlations from validated cardiology literature. They do not imply that a single factor caused this prediction or that changing it guarantees a specific outcome.
          </span>
        </div>
      </section>

      {/* ========================================================
          PART 2 — YOUR HEART-HEALTHY ACTION PLAN (PROMINENT)
          Personalized recommendations with Indian diet context,
          physical activity caution, lifestyle, and doctor questions
          ======================================================== */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-emerald-500/30 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Utensils className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">Your Heart-Healthy Action Plan</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Personalized, practical lifestyle and nutritional guidance based on your clinical measurements.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 w-fit">
            Educational Action Plan
          </span>
        </div>

        {/* URGENT MEDICAL SYMPTOM WARNING (IF APPLICABLE) */}
        {actionPlan.urgentMedicalAlert?.hasUrgentSymptom && (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/15 border-2 border-rose-500/40 text-rose-200 space-y-2 animate-fadeIn">
            <div className="flex items-center gap-2 text-rose-300 font-extrabold text-sm">
              <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
              <span>URGENT CLINICAL SYMPTOM NOTICE</span>
            </div>
            <p className="text-xs leading-relaxed">
              <strong>Symptom Flag: </strong> {actionPlan.urgentMedicalAlert.symptomSummary}
            </p>
            <p className="text-xs font-semibold text-white bg-rose-950/80 p-3 rounded-xl border border-rose-800/80">
              {actionPlan.urgentMedicalAlert.guidance}
            </p>
          </div>
        )}

        {/* ACTION PLAN TABS / SUBSECTIONS */}
        <div className="space-y-6">
          {/* A. Food and Diet Suggestions */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-sky-300 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-sky-400" />
              A. Food &amp; Dietary Suggestions (Including Familiar Indian Meals)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {actionPlan.dietSuggestions.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-white text-sm">{item.title}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700 shrink-0">
                      {item.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    <strong>Why it's relevant: </strong> {item.whyRelevant}
                  </p>
                  <p className="text-slate-200 text-[11px] leading-relaxed">
                    <strong>Action you can take: </strong> {item.actionableStep}
                  </p>
                  {item.indianDietContext && (
                    <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-900/50 text-[11px] text-sky-200">
                      <strong>Indian meal context: </strong> {item.indianDietContext}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* B. Physical Activity Suggestions */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              B. Safe Physical Activity Suggestions
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {actionPlan.physicalActivitySuggestions.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-white text-sm">{item.title}</span>
                    <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border shrink-0 ${
                      item.type === 'urgent_clinical' 
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                        : 'bg-slate-800 text-emerald-300 border-slate-700'
                    }`}>
                      {item.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    <strong>Why it's relevant: </strong> {item.whyRelevant}
                  </p>
                  <p className="text-slate-200 text-[11px] leading-relaxed">
                    <strong>Action you can take: </strong> {item.actionableStep}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* C. Lifestyle Suggestions */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              C. Cardiovascular Lifestyle Suggestions
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {actionPlan.lifestyleSuggestions.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-white text-sm">{item.title}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 shrink-0">
                      {item.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    <strong>Why it's relevant: </strong> {item.whyRelevant}
                  </p>
                  <p className="text-slate-200 text-[11px] leading-relaxed">
                    <strong>Action you can take: </strong> {item.actionableStep}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* D. Questions for a Healthcare Professional */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-indigo-400" />
              D. Follow-up Questions for Your Healthcare Professional
            </h4>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <p className="text-xs text-slate-300">
                Bring these personalized questions to your next appointment with your doctor or cardiologist:
              </p>
              <ul className="space-y-2 pt-1">
                {actionPlan.doctorDiscussionQuestions.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Action Plan Educational Disclaimer */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
          <strong>Action Plan Safety Notice: </strong> {actionPlan.disclaimer}
        </div>
      </section>

      {/* ========================================================
          3D ANATOMICAL DIGITAL TWIN PREVIEW & QUICK ACTIONS
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Key Model Influencers (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-white text-base">Key Model Influencers</h3>
              </div>
              <button
                onClick={() => onNavigate('intelligence')}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                Deep Intelligence <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Relative magnitude and direction of patient factors in the statistical model:
            </p>

            <div className="space-y-3 mt-4">
              {predictionResult.featureContributions.slice(0, 5).map((fc, idx) => {
                const isElevating = fc.impact === 'elevating';
                const isProtective = fc.impact === 'protective';
                return (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{fc.label}</span>
                      <span className={`font-mono text-[11px] px-2 py-0.5 rounded font-bold ${
                        isElevating ? 'bg-rose-500/20 text-rose-300' : isProtective ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {fc.weight > 0 ? `+${fc.weight}` : fc.weight} ({fc.impact})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Value: <strong className="text-white">{fc.patientValue}</strong></span>
                      <span>Target: {fc.normalRange}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{fc.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-900/60 flex items-start gap-2.5 text-xs text-sky-200">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span>
              <strong>Clinical Causation Notice:</strong> Statistical model associations do not imply direct individual causation. Modifying a risk factor must be evaluated with a physician.
            </span>
          </div>
        </div>

        {/* Right Column: 3D Visualizer Teaser & Quick Action Hub (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-rose-400" />
                <h3 className="font-bold text-white text-base">3D Anatomical Risk Map</h3>
              </div>
              <button
                onClick={() => onNavigate('explorer')}
                className="text-xs px-3 py-1.5 rounded-xl bg-sky-500 text-slate-950 font-bold hover:bg-sky-400 transition-all flex items-center gap-1.5 shadow-md shadow-sky-500/20 cursor-pointer"
              >
                <span>Launch Full 3D Explorer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Coronary arterial branches (LAD, RCA, LCx), aortic arch, and ventricular chambers rendered in real-time Three.js with dynamic risk heat projection.
            </p>

            {/* Visual Teaser Card */}
            <div 
              onClick={() => onNavigate('explorer')}
              className="relative h-64 rounded-2xl overflow-hidden border border-sky-500/30 bg-gradient-to-b from-[#091428] via-[#050c18] to-[#040812] cursor-pointer group flex items-center justify-center"
            >
              <div className="absolute inset-0 medical-grid opacity-40" />
              <div className="relative text-center p-6 space-y-3 z-10">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-500/10 border border-sky-400/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Heart className="w-8 h-8 text-rose-500 animate-heart-pulse fill-rose-500/20" />
                </div>
                <h4 className="text-white font-bold text-base group-hover:text-sky-300 transition-colors">
                  Interactive 3D Heart Explorer
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Rotate 360°, zoom into the Left Anterior Descending (LAD) coronary artery, toggle whole-torso ribcage context, and inspect anatomical vascular territories.
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs text-sky-400 font-semibold group-hover:underline">
                  Click to inspect 3D model <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => onNavigate('simulator')}
              className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/30 text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 text-sky-400 text-xs font-bold mb-1">
                <Sliders className="w-3.5 h-3.5" />
                What-If Simulator
              </div>
              <p className="text-[11px] text-slate-400">Test hypothetical changes in blood pressure and cholesterol.</p>
            </button>

            <button
              onClick={() => onNavigate('datalab')}
              className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/30 text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold mb-1">
                <Microscope className="w-3.5 h-3.5" />
                Health Data Lab
              </div>
              <p className="text-[11px] text-slate-400">Upload lab PDFs or CSV reports for Gemini multimodal parsing.</p>
            </button>

            <button
              onClick={() => onNavigate('reports')}
              className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                PDF Report Export
              </div>
              <p className="text-[11px] text-slate-400">Generate a downloadable clinical-grade summary report.</p>
            </button>
          </div>
        </div>
      </div>

      {/* SYNTHETIC DEMONSTRATION PROFILES SELECTOR */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              Preloaded Synthetic Demonstration Cohort
            </h3>
            <p className="text-xs text-slate-400">
              Select verified synthetic patient profiles to test diverse clinical scenarios without real patient data:
            </p>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700 w-fit">
            No PII Stored
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { id: 'SYNTH-DEMO-01', name: 'Marcus Vance', age: '58M', risk: 'Elevated Risk', bp: '148/84', chol: '284', tag: 'Typical Angina + Exertional ST' },
            { id: 'SYNTH-DEMO-02', name: 'Elena Rostova', age: '46F', risk: 'Minimal / Low', bp: '114/66', chol: '182', tag: 'Normal Stress Test + High HDL' },
            { id: 'SYNTH-DEMO-03', name: 'David Chen', age: '64M', risk: 'Moderate Risk', bp: '136/76', chol: '232', tag: 'Metabolic Borderline + LVH' },
            { id: 'SYNTH-DEMO-04', name: 'Sarah Jenkins', age: '53F', risk: 'Borderline Risk', bp: '142/78', chol: '245', tag: 'Isolated Systolic Hypertension' },
          ].map((profile) => (
            <button
              key={profile.id}
              onClick={() => onSelectSyntheticProfile(profile.id)}
              className="p-4 rounded-2xl bg-slate-900/60 hover:bg-sky-950/40 border border-slate-800 hover:border-sky-500/40 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm group-hover:text-sky-300">{profile.name}</span>
                <span className="text-xs font-mono text-slate-400">{profile.age}</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs">
                <span className={`w-2 h-2 rounded-full ${profile.risk.includes('Elevated') ? 'bg-rose-500' : profile.risk.includes('Moderate') ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                <span className="text-slate-300 font-medium">{profile.risk}</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400 font-mono">
                BP: {profile.bp} | Chol: {profile.chol} mg/dL
              </div>
              <div className="mt-2 text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/80 truncate">
                {profile.tag}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
