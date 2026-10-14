import React, { useState, useEffect, useRef } from 'react';
import { 
  PredictionResult, 
  PatientAssessmentInput 
} from '../../types/cardiac';
import { 
  BrainCircuit, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  BarChart3, 
  Activity, 
  Info, 
  HelpCircle, 
  Award, 
  Cpu, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { generateHeartHealthActionPlan } from '../../services/recommendationEngine';
import { 
  generateVoiceResultsScript, 
  SpeechPlayerController, 
  isSpeechSynthesisSupported 
} from '../../services/speechService';

interface RiskIntelligenceViewProps {
  predictionResult: PredictionResult;
  patientInput: PatientAssessmentInput;
}

export const RiskIntelligenceView: React.FC<RiskIntelligenceViewProps> = ({
  predictionResult,
  patientInput
}) => {
  const { modelMetrics, featureContributions, warnings } = predictionResult;
  const actionPlan = generateHeartHealthActionPlan(patientInput, predictionResult);

  // Maximum absolute weight for scaling bars
  const maxWeight = Math.max(...featureContributions.map(f => Math.abs(f.weight)), 1.0);

  // Audio / Speech State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [audioTranscript, setAudioTranscript] = useState('');
  const [showTranscriptDrawer, setShowTranscriptDrawer] = useState(false);

  const speechControllerRef = useRef<SpeechPlayerController | null>(null);

  useEffect(() => {
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
      {/* HEADER SECTION */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-sky-500/25">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
                <BrainCircuit className="w-5 h-5" />
              </span>
              <h2 className="text-2xl font-extrabold text-white">Explainable AI &amp; Risk Intelligence</h2>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl">
              Transparent feature attribution and statistical validation metrics. Deconstructs the model's decision boundary into individual positive and negative contributions, distinguishing statistical correlation from medical causality.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
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
                  <span>Listen to Results</span>
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
              {isPlayingAudio ? 'Speaking...' : isPausedAudio ? 'Paused' : 'Playback Finished'}
            </span>
          </div>
          <p className="text-slate-200 text-[11px] leading-relaxed italic bg-slate-950/50 p-3 rounded-xl border border-sky-900/40">
            "{audioTranscript}"
          </p>
        </div>
      )}

      {/* TOP SUMMARY STATS ROW (PATIENT FOCUS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl">
          <div className="text-slate-400 text-xs font-semibold">Model Classification Score</div>
          <div className="mt-2 text-3xl font-extrabold text-white font-mono">
            {(predictionResult.predictedProbability * 100).toFixed(1)}%
          </div>
          <p className="mt-2 text-[11px] text-sky-400 font-medium">
            Tier: <strong className="uppercase">{predictionResult.riskCategory}</strong> &bull; Score: {predictionResult.calibratedScore}/100
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            Target: Angiographic CAD (&gt;50% vessel stenosis in UCI cohort)
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <div className="text-slate-400 text-xs font-semibold">Prediction Horizon &amp; Calibration</div>
          <div className="mt-2 text-xl font-bold text-amber-300 font-mono">
            Cross-Sectional
          </div>
          <p className="mt-2 text-[11px] text-slate-300">
            Catheterization status &bull; Not 10-yr event risk
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            * 95% CI omitted per audit: prevents false precision
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <div className="text-slate-400 text-xs font-semibold">Dataset &amp; Population</div>
          <div className="mt-2 text-xl font-bold text-white font-mono">
            UCI Referral Cohort
          </div>
          <p className="mt-2 text-[11px] text-slate-300">
            Cleveland, Hungarian &amp; VA merged data
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            Catheterization referral benchmark
          </p>
        </div>
      </div>

      {/* WHAT DOES THIS RESULT MEAN? CLINICAL INTERPRETATION GUIDE */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-sky-500/20 space-y-5">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <HelpCircle className="w-5 h-5 text-sky-400" />
          <h3 className="text-lg font-bold text-white">What Does This Result Mean?</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800 font-mono">
            Clinical Guide
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <h4 className="font-bold text-sky-300 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
              1. What the Score Measures
            </h4>
            <p className="text-slate-300 leading-relaxed">
              This score represents the statistical likelihood that a patient with these clinical variables has <strong>anatomically significant coronary artery disease (&gt;50% diameter narrowing in &ge;1 major coronary vessel)</strong>, based on retrospective data from the UCI Heart Disease cohort (patients referred for cardiac catheterization).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <h4 className="font-bold text-rose-300 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              2. What the Score Does NOT Measure
            </h4>
            <p className="text-slate-300 leading-relaxed">
              A score of {(predictionResult.predictedProbability * 100).toFixed(0)}% does <strong>NOT</strong> mean the patient has a {(predictionResult.predictedProbability * 100).toFixed(0)}% probability of suffering a future heart attack or stroke within 10 years (unlike longitudinal tools such as the ASCVD Risk Estimator or Framingham Risk Score). It also does not prove acute ischemia or determine specific plaque vulnerability.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <h4 className="font-bold text-amber-300 text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              3. Model Prediction vs. Confirmed Diagnosis
            </h4>
            <p className="text-slate-300 leading-relaxed">
              A machine learning output is a <em>mathematical estimation</em> derived from population correlations. It is <strong>never a confirmed diagnosis</strong>. Many individuals with elevated statistical scores have clean coronaries upon imaging, while some with lower scores have non-obstructive soft plaque or microvascular dysfunction.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <h4 className="font-bold text-emerald-300 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              4. Why Clinicians Need Further Diagnostics
            </h4>
            <p className="text-slate-300 leading-relaxed">
              To verify coronary status, a physician may recommend advanced non-invasive imaging such as <strong>Coronary CT Angiography (CCTA)</strong>, <strong>Coronary Artery Calcium (CAC) scoring</strong>, a <strong>stress echocardiogram</strong>, or functional nuclear myocardial perfusion imaging, alongside high-sensitivity biomarkers (hs-cTn, hs-CRP, Lp(a)).
            </p>
          </div>
        </div>
      </div>

      {/* FEATURE ATTRIBUTION BREAKDOWN (WATERFALL / BAR CHART) */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-sky-400" />
              Audited Risk Factor Panel: Clinical Reference vs. Model Attribution
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Distinguishes standard clinical reference guidelines from model-specific standardized log-odds coefficients (&beta;&middot;z).
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-rose-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Elevating Log-Odds
            </span>
            <span className="flex items-center gap-1 text-cyan-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" /> Protective Log-Odds
            </span>
          </div>
        </div>

        {/* Feature Contribution Cards with Clear Clinical & Model Distinction */}
        <div className="space-y-4">
          {featureContributions.map((fc, index) => {
            const isElevating = fc.weight > 0;
            const barWidthPercent = Math.min(100, (Math.abs(fc.weight) / maxWeight) * 100);

            return (
              <div key={index} className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{fc.label}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        Observed: <strong className="text-sky-300">{fc.patientValue}</strong>
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span className="text-slate-500 font-semibold">Clinical Reference:</span>
                      <span className="text-slate-300">{fc.clinicalReferenceRange || fc.normalRange}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg ${
                      isElevating ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}>
                      {fc.weight > 0 ? `+${fc.weight}` : fc.weight} log-odds
                    </span>
                    {fc.oddsRatioEstimate && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800" title="Estimated odds ratio effect">
                        OR: ~{fc.oddsRatioEstimate}x
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar Visualization */}
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden flex items-center">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isElevating ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-gradient-to-r from-sky-500 to-cyan-400'
                    }`}
                    style={{ width: `${barWidthPercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
                  <div className="text-slate-300">
                    <strong className="text-slate-200">Plain-English Rationale: </strong>
                    {fc.plainEnglishDescription || fc.description}
                  </div>
                  <div className="text-slate-400 bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                    <strong className="text-sky-300">Model Attribution Note: </strong>
                    Derived from standardized coefficient weight in the UCI benchmark logistic matrix. Does not assert isolated clinical causality.
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DEVELOPER & TECHNICAL VALIDATION BENCHMARK (CLEARLY SEGREGATED) */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">Developer &amp; Technical Benchmark Diagnostics</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Internal algorithm evaluation metrics on the test partition. These metrics represent model architecture validation, not the patient's personal clinical disease risk.
            </p>
          </div>
          {predictionResult.baselineComparison && (
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              {predictionResult.baselineComparison.modelConcordance}
            </span>
          )}
        </div>

        {/* Technical Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Test ROC-AUC</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">{modelMetrics.rocAuc}</span>
            <span className="text-[10px] text-slate-400 block mt-1">Discrimination</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Test Precision</span>
            <span className="text-2xl font-bold font-mono text-white">{(modelMetrics.precision * 100).toFixed(1)}%</span>
            <span className="text-[10px] text-slate-400 block mt-1">Positive Predictive Value</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Test Sensitivity</span>
            <span className="text-2xl font-bold font-mono text-cyan-300">{(modelMetrics.recall * 100).toFixed(1)}%</span>
            <span className="text-[10px] text-slate-400 block mt-1">True Positive Rate</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">F1-Score / Loss</span>
            <span className="text-2xl font-bold font-mono text-amber-300">{modelMetrics.f1Score.toFixed(3)}</span>
            <span className="text-[10px] text-slate-400 block mt-1">Harmonic Mean</span>
          </div>
        </div>

        {/* Cross-Model Benchmark Comparison */}
        {predictionResult.baselineComparison && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">Logistic Regression (L2 Baseline)</span>
                <span className="text-xs font-mono text-sky-400 font-bold">
                  {(predictionResult.baselineComparison.logisticRegression.probability * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Linear log-odds attribution provides transparent directional interpretability for each standardized clinical input.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">Random Forest Classifier (100 Trees)</span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {(predictionResult.baselineComparison.randomForest.probability * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Non-linear ensemble decision splits validate concordance across risk stratification categories.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
