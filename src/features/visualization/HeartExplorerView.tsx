import React, { useState } from 'react';
import { 
  PatientAssessmentInput, 
  PredictionResult, 
  WhatIfComparison 
} from '../../types/cardiac';
import { ThreeHeartViewer } from './ThreeHeartViewer';
import { ANATOMICAL_REGIONS } from '../../data/anatomicalRegions';
import { 
  Layers, 
  Heart, 
  Activity, 
  Info, 
  ShieldAlert, 
  Sliders, 
  TrendingUp, 
  Eye, 
  Flame,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { compareWhatIfScenarios } from '../../services/predictionEngine';

interface HeartExplorerViewProps {
  patientInput: PatientAssessmentInput;
  predictionResult: PredictionResult;
  onSnapshotCapture?: (dataUrl: string) => void;
  onNavigateToSimulator: () => void;
}

export const HeartExplorerView: React.FC<HeartExplorerViewProps> = ({
  patientInput,
  predictionResult,
  onSnapshotCapture,
  onNavigateToSimulator
}) => {
  const [selectedRegionId, setSelectedRegionId] = useState<string>('lad');
  const [quickWhatIfEnabled, setQuickWhatIfEnabled] = useState<boolean>(false);
  const [hypotheticalBP, setHypotheticalBP] = useState<number>(patientInput.restingBP);
  const [hypotheticalChol, setHypotheticalChol] = useState<number>(patientInput.serumCholesterol);

  // Compute live what-if comparison if quick simulator toggle is active
  const comparison: WhatIfComparison | null = quickWhatIfEnabled ? compareWhatIfScenarios(
    patientInput,
    {
      ...patientInput,
      restingBP: hypotheticalBP,
      serumCholesterol: hypotheticalChol
    }
  ) : null;

  const activeRegion = ANATOMICAL_REGIONS[selectedRegionId] || ANATOMICAL_REGIONS.lad;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER SECTION */}
      <div className="glass-panel p-6 rounded-3xl border border-sky-500/25">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
                <Layers className="w-5 h-5" />
              </span>
              <h2 className="text-2xl font-extrabold text-white">3D Cardiovascular Risk Explorer</h2>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-3xl">
              Anatomical Three.js digital twin rendering human cardiac chambers, great vessels, and coronary arteries (LAD, RCA, LCx). Visualizes estimated statistical risk distribution across vascular territories.
            </p>
          </div>

          {/* Quick Toggle for What-If Simulation Overlay */}
          <div className="flex items-center gap-3 bg-slate-900/90 p-2.5 rounded-2xl border border-sky-500/20 shrink-0">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Quick What-If Overlay
            </span>
            <button
              onClick={() => {
                setQuickWhatIfEnabled(!quickWhatIfEnabled);
                if (!quickWhatIfEnabled) {
                  setHypotheticalBP(120);
                  setHypotheticalChol(190);
                }
              }}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                quickWhatIfEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  quickWhatIfEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* MAIN 3D WORKSPACE: 3D VIEWER + SIDEBAR INSPECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive 3D Canvas (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <ThreeHeartViewer
            patientInput={patientInput}
            predictionResult={predictionResult}
            selectedRegionId={selectedRegionId}
            onSelectRegion={(id) => setSelectedRegionId(id)}
            showComparisonOverlay={quickWhatIfEnabled}
            comparisonResult={comparison?.scenarioResult}
            onSnapshotCapture={onSnapshotCapture}
          />

          {/* QUICK WHAT-IF SLIDERS (WHEN ENABLED) */}
          {quickWhatIfEnabled && (
            <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h4 className="font-bold text-emerald-300 text-sm">Hypothetical Scenario Adjustments</h4>
                </div>
                <button
                  onClick={onNavigateToSimulator}
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                >
                  Open Full Simulator <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Hypothetical Systolic BP:</span>
                    <span className="font-mono font-bold text-emerald-400">{hypotheticalBP} mm Hg</span>
                  </div>
                  <input
                    type="range"
                    min={90}
                    max={200}
                    step={1}
                    value={hypotheticalBP}
                    onChange={(e) => setHypotheticalBP(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>90 (Optimal)</span>
                    <span>Baseline: {patientInput.restingBP}</span>
                    <span>200 (Severe)</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Hypothetical Total Cholesterol:</span>
                    <span className="font-mono font-bold text-emerald-400">{hypotheticalChol} mg/dL</span>
                  </div>
                  <input
                    type="range"
                    min={120}
                    max={360}
                    step={2}
                    value={hypotheticalChol}
                    onChange={(e) => setHypotheticalChol(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>120 (Favorable)</span>
                    <span>Baseline: {patientInput.serumCholesterol}</span>
                    <span>360 (High)</span>
                  </div>
                </div>
              </div>

              {comparison && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-xs text-emerald-200 flex items-center justify-between">
                  <span>
                    Scenario Risk: <strong className="text-white font-mono font-bold">{(comparison.scenarioResult.predictedProbability * 100).toFixed(1)}%</strong>
                    {' '}(Category: <strong className="uppercase">{comparison.scenarioResult.riskCategory}</strong>)
                  </span>
                  <span className="font-mono font-bold">
                    Net Delta: {((comparison.scenarioResult.predictedProbability - predictionResult.predictedProbability) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* SCIENTIFIC SAFETY DISCLAIMER BANNER */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-400 text-xs flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-slate-200">Medical Accuracy & Visualization Protocol: </strong>
              <span>
                Ordinary clinical risk factors (cholesterol, blood pressure, glucose) estimate statistical probability; they do not diagnose mechanical lesions, calcified stenosis, or specific coronary plaque locations. The heat highlights on coronary arteries and myocardial walls represent estimated risk mapping for patient education and are not an invasive angiogram.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Anatomical Structure Selector & Clinical Info (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Select Anatomical Structures */}
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              Select Anatomical Structure
            </h3>
            <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-1">
              {Object.values(ANATOMICAL_REGIONS).map((reg) => {
                const isSelected = selectedRegionId === reg.id;
                return (
                  <button
                    key={reg.id}
                    onClick={() => setSelectedRegionId(reg.id)}
                    className={`px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-400/50 shadow-md shadow-sky-500/10'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'
                    }`}
                  >
                    <span className="truncate">{reg.name}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 shrink-0 ml-2">
                      {reg.category}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Structure Detailed Medical Card */}
          <div className="glass-panel p-5 rounded-2xl space-y-4 border border-sky-500/20">
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center gap-1.5 text-sky-400 text-xs font-semibold">
                <Info className="w-3.5 h-3.5" />
                <span>Selected Structure Breakdown</span>
              </div>
              <h4 className="text-base font-extrabold text-white mt-1">{activeRegion.name}</h4>
              <p className="text-[11px] font-mono text-slate-400 italic">{activeRegion.latinName}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <strong className="text-slate-200 block mb-0.5">Anatomical Description:</strong>
                <p className="text-slate-300 leading-relaxed">{activeRegion.description}</p>
              </div>

              <div>
                <strong className="text-sky-300 block mb-0.5">Clinical Significance:</strong>
                <p className="text-slate-300 leading-relaxed">{activeRegion.clinicalSignificance}</p>
              </div>

              <div>
                <strong className="text-cyan-300 block mb-0.5">Perfusion / Supply Territory:</strong>
                <p className="text-slate-300 leading-relaxed">{activeRegion.supplyTerritory || 'Systemic cardiovascular system'}</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <strong className="text-amber-300 block mb-0.5">Associated Risk Correlation:</strong>
                <p className="text-slate-300 leading-relaxed text-[11px]">{activeRegion.associatedRiskFactor}</p>
              </div>
            </div>
          </div>

          {/* Connected Patient Factors for this Territory */}
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <span>Contributing Factors in Patient</span>
            </div>
            <div className="space-y-2">
              {predictionResult.featureContributions.slice(0, 3).map((fc, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-200 block">{fc.label}</span>
                    <span className="text-[11px] text-slate-400">Current: {fc.patientValue}</span>
                  </div>
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                    fc.impact === 'elevating' ? 'bg-rose-500/20 text-rose-300' : 'bg-cyan-500/20 text-cyan-300'
                  }`}>
                    {fc.impact}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
