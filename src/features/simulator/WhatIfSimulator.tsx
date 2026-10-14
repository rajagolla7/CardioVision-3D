import React, { useState } from 'react';
import { 
  PatientAssessmentInput, 
  PredictionResult, 
  WhatIfComparison 
} from '../../types/cardiac';
import { compareWhatIfScenarios } from '../../services/predictionEngine';
import { ThreeHeartViewer } from '../visualization/ThreeHeartViewer';
import { 
  Sliders, 
  RotateCcw, 
  ArrowRight, 
  TrendingDown, 
  TrendingUp, 
  ShieldAlert, 
  Sparkles, 
  Activity, 
  Layers, 
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface WhatIfSimulatorProps {
  baselineInput: PatientAssessmentInput;
  baselineResult: PredictionResult;
  onApplyScenarioAsBaseline: (scenario: PatientAssessmentInput) => void;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  baselineInput,
  baselineResult,
  onApplyScenarioAsBaseline
}) => {
  // Scenario state initialized to baseline
  const [scenarioInput, setScenarioInput] = useState<PatientAssessmentInput>({
    ...baselineInput,
    id: `SCENARIO-${Date.now()}`
  });

  // Re-run comparison
  const comparison: WhatIfComparison = compareWhatIfScenarios(baselineInput, scenarioInput);
  const { scenarioResult, deltaProbability, differingFeatures } = comparison;

  const handleResetScenario = () => {
    setScenarioInput({
      ...baselineInput,
      id: `SCENARIO-${Date.now()}`
    });
  };

  const handleSliderChange = <K extends keyof PatientAssessmentInput>(
    field: K,
    value: PatientAssessmentInput[K]
  ) => {
    setScenarioInput(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const basePercent = (baselineResult.predictedProbability * 100).toFixed(1);
  const scenarioPercent = (scenarioResult.predictedProbability * 100).toFixed(1);
  const deltaPercent = (deltaProbability * 100).toFixed(1);
  const isImproved = deltaProbability < 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* HEADER */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-sky-500/25">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Sliders className="w-5 h-5" />
              </span>
              <h2 className="text-2xl font-extrabold text-white">Cardiac What-If Scenario Simulator</h2>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl">
              Simulate hypothetical interventions (e.g. lowering systolic blood pressure, reducing cholesterol, or smoking cessation) through the identical statistical pipeline to observe projected output differences.
            </p>
          </div>

          <button
            onClick={handleResetScenario}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all hover:text-white shrink-0"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Reset to Current Baseline</span>
          </button>
        </div>
      </div>

      {/* COMPARISON SCOREBOARD: BASELINE VS SCENARIO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Baseline Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 relative">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Baseline Assessment
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white font-mono">{basePercent}%</span>
            <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {baselineResult.riskCategory}
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-400 leading-snug">
            Current patient physiological profile based on clinical evaluation.
          </p>
        </div>

        {/* Delta Card */}
        <div className={`glass-panel p-6 rounded-3xl border relative ${
          isImproved ? 'border-emerald-500/30 bg-emerald-950/20' : deltaProbability > 0 ? 'border-rose-500/30 bg-rose-950/20' : 'border-slate-800'
        }`}>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Projected Model Delta
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-4xl font-extrabold font-mono ${
              isImproved ? 'text-emerald-400' : deltaProbability > 0 ? 'text-rose-400' : 'text-slate-300'
            }`}>
              {deltaProbability > 0 ? `+${deltaPercent}%` : `${deltaPercent}%`}
            </span>
            <span className="text-xs font-semibold text-slate-300">
              {isImproved ? 'Relative Reduction' : deltaProbability > 0 ? 'Relative Increase' : 'No Change'}
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-400 leading-snug">
            {differingFeatures.length} hypothetical variable{differingFeatures.length === 1 ? '' : 's'} altered.
          </p>
        </div>

        {/* Hypothetical Scenario Card */}
        <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 bg-slate-900/80 relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
              Simulated Scenario
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-emerald-400 font-mono">{scenarioPercent}%</span>
            <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {scenarioResult.riskCategory}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">Target Category</span>
            <button
              onClick={() => onApplyScenarioAsBaseline(scenarioInput)}
              className="text-[11px] text-emerald-400 hover:underline font-bold flex items-center gap-1"
            >
              Apply as Patient Baseline <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* INTERACTIVE SLIDERS CONTROLS & SIDE-BY-SIDE 3D HEART VIEWER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sliders for Hypothetical Variables (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl space-y-6">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Adjust Hypothetical Variables
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Drag the sliders below to evaluate how model estimates react to clinical modifications:
            </p>
          </div>

          <div className="space-y-5">
            {/* 1. Resting Systolic Blood Pressure */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">Resting Blood Pressure:</span>
                <span className="font-mono font-bold text-emerald-400">{scenarioInput.restingBP} mm Hg</span>
              </div>
              <input
                type="range"
                min={85}
                max={200}
                step={1}
                value={scenarioInput.restingBP}
                onChange={(e) => handleSliderChange('restingBP', Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>85 (Low)</span>
                <span className="text-slate-400">Baseline: {baselineInput.restingBP}</span>
                <span>200 (Stage 3)</span>
              </div>
            </div>

            {/* 2. Serum Total Cholesterol */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">Total Serum Cholesterol:</span>
                <span className="font-mono font-bold text-emerald-400">{scenarioInput.serumCholesterol} mg/dL</span>
              </div>
              <input
                type="range"
                min={110}
                max={380}
                step={2}
                value={scenarioInput.serumCholesterol}
                onChange={(e) => handleSliderChange('serumCholesterol', Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>110 (Desirable)</span>
                <span className="text-slate-400">Baseline: {baselineInput.serumCholesterol}</span>
                <span>380 (Hypercholesterolemia)</span>
              </div>
            </div>

            {/* 3. Peak Exercise Heart Rate (thalach) */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">Peak Exercise HR (thalach):</span>
                <span className="font-mono font-bold text-emerald-400">{scenarioInput.maxHR} bpm</span>
              </div>
              <input
                type="range"
                min={70}
                max={205}
                step={1}
                value={scenarioInput.maxHR}
                onChange={(e) => handleSliderChange('maxHR', Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>70 (Poor Reserve)</span>
                <span className="text-slate-400">Baseline: {baselineInput.maxHR}</span>
                <span>205 (High Reserve)</span>
              </div>
            </div>

            {/* 4. Exercise ST Depression (oldpeak) */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">Exercise ST Depression:</span>
                <span className="font-mono font-bold text-emerald-400">{scenarioInput.stDepression.toFixed(1)} mm</span>
              </div>
              <input
                type="range"
                min={0.0}
                max={5.0}
                step={0.1}
                value={scenarioInput.stDepression}
                onChange={(e) => handleSliderChange('stDepression', Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0.0 mm (Normal)</span>
                <span className="text-slate-400">Baseline: {baselineInput.stDepression}</span>
                <span>5.0 mm (Severe Ischemia)</span>
              </div>
            </div>

            {/* 5. Smoking Status Toggle */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">Smoking Status:</span>
                <span className="font-mono font-bold text-emerald-400 uppercase text-[11px]">{scenarioInput.smokingStatus}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['never', 'former', 'current'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSliderChange('smokingStatus', s)}
                    className={`py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                      scenarioInput.smokingStatus === s
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Exercise Induced Angina Toggle */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 text-xs block">Exertional Angina (exang):</span>
                <span className="text-[10px] text-slate-400">Chest pain during treadmill stress</span>
              </div>
              <button
                type="button"
                onClick={() => handleSliderChange('exerciseInducedAngina', !scenarioInput.exerciseInducedAngina)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  scenarioInput.exerciseInducedAngina
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {scenarioInput.exerciseInducedAngina ? 'Angina Present' : 'Angina Absent (Resolved)'}
              </button>
            </div>
          </div>

          {/* MEDICAL SAFETY CALLOUT */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Hypothetical Disclaimer:</strong> This simulator represents a statistical sensitivity tool. Observed output shifts demonstrate mathematical responsiveness of the model, not a clinical guarantee that lifestyle adjustments will immediately eliminate disease.
            </span>
          </div>
        </div>

        {/* Right Column: Dynamic 3D Viewer updated with Scenario (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              Dynamic 3D Heart Reflecting Scenario Inputs:
            </span>
            <span className="font-mono text-emerald-400">
              Pulsing at {scenarioInput.restingHR} bpm
            </span>
          </div>

          <ThreeHeartViewer
            patientInput={scenarioInput}
            predictionResult={scenarioResult}
            showComparisonOverlay={true}
            comparisonResult={baselineResult}
          />

          {/* DIFFERING FEATURES AUDIT TABLE */}
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">
              Differing Feature Variables Summary
            </h4>
            {differingFeatures.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No variables altered yet. Move the sliders on the left to test hypothetical interventions.
              </p>
            ) : (
              <div className="space-y-2">
                {differingFeatures.map((df, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">{df.label}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {df.oldValue} &rarr; <strong className="text-emerald-400">{df.newValue}</strong>
                      </span>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded capitalize ${
                      df.deltaDirection === 'improved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {df.deltaDirection}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
