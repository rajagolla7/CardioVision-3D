/**
 * CardioVision 3D AI
 * Multimodal Cardiovascular Risk Platform
 * Track A: Cardiovascular Risk Visualization & Prediction
 * Multimodal AI Hackathon 2026
 */

import React, { useState, useMemo } from 'react';
import { PatientAssessmentInput, PredictionResult, ThemeMode } from './types/cardiac';
import { SYNTHETIC_PROFILES, DEFAULT_ASSESSMENT_INPUT } from './data/syntheticProfiles';
import { computeCardiovascularPrediction } from './services/predictionEngine';
import { Navigation, NavigationTab } from './components/Navigation';
import { OverviewDashboard } from './features/overview/OverviewDashboard';
import { PatientAssessmentForm } from './features/assessment/PatientAssessmentForm';
import { HeartExplorerView } from './features/visualization/HeartExplorerView';
import { RiskIntelligenceView } from './features/explainability/RiskIntelligenceView';
import { WhatIfSimulator } from './features/simulator/WhatIfSimulator';
import { HealthDataLab } from './features/datalab/HealthDataLab';
import { AiHealthAssistant } from './features/assistant/AiHealthAssistant';
import { ReportGeneratorView } from './features/reports/ReportGeneratorView';
import { AboutSafetyView } from './features/about/AboutSafetyView';
import { 
  Heart, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  Layers, 
  Bot, 
  FileText, 
  Sliders, 
  Activity,
  ArrowUpRight
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('overview');
  const [patientInput, setPatientInput] = useState<PatientAssessmentInput>(DEFAULT_ASSESSMENT_INPUT);
  const [snapshotDataUrl, setSnapshotDataUrl] = useState<string | null>(null);
  const [demoBannerActive, setDemoBannerActive] = useState<boolean>(false);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cardiovision_theme');
      if (saved === 'bright' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  const handleToggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'bright' : 'dark';
      if (typeof window !== 'undefined') {
        localStorage.setItem('cardiovision_theme', next);
      }
      return next;
    });
  };

  // Compute live prediction whenever patientInput changes
  const predictionResult: PredictionResult = useMemo(() => {
    return computeCardiovascularPrediction(patientInput);
  }, [patientInput]);

  // Launch Demo Assessment (Hackathon Requirement)
  const handleLaunchDemoAssessment = () => {
    // Select the prominent elevated benchmark profile
    const demoProfile = SYNTHETIC_PROFILES[0];
    setPatientInput({ ...demoProfile });
    setCurrentTab('explorer');
    setDemoBannerActive(true);
    setTimeout(() => setDemoBannerActive(false), 5000);
  };

  const handleSelectSyntheticProfile = (profileId: string) => {
    const profile = SYNTHETIC_PROFILES.find(p => p.id === profileId);
    if (profile) {
      setPatientInput({ ...profile });
    }
  };

  const handleResetAssessment = () => {
    setPatientInput({ ...DEFAULT_ASSESSMENT_INPUT });
  };

  const handleApplyExtractedData = (extracted: Partial<PatientAssessmentInput>) => {
    setPatientInput(prev => ({
      ...prev,
      ...extracted,
      isSyntheticDemo: false,
      profileName: 'Extracted Clinical Report (Verified Ingestion)',
      timestamp: new Date().toISOString()
    }));
  };

  const handleApplyScenarioAsBaseline = (scenario: PatientAssessmentInput) => {
    setPatientInput({
      ...scenario,
      id: `PATIENT-${Date.now()}`,
      isSyntheticDemo: false,
      profileName: 'Applied What-If Scenario (Simulated Target)'
    });
    setCurrentTab('overview');
  };

  return (
    <div className={`min-h-screen ${theme === 'bright' ? 'theme-bright bg-slate-50 text-slate-900' : 'theme-dark bg-[#060c18] text-slate-100'} flex flex-col selection:bg-sky-500 selection:text-slate-950 transition-colors duration-300`}>
      {/* Top Navigation */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onLaunchDemo={handleLaunchDemoAssessment}
        currentRiskCategory={predictionResult.riskCategory}
        isSyntheticDemo={patientInput.isSyntheticDemo}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* DEMO LAUNCH CELEBRATION TOAST */}
      {demoBannerActive && (
        <div className="fixed top-20 right-4 z-50 bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-fadeIn">
          <Sparkles className="w-5 h-5 fill-slate-950 animate-spin" />
          <div className="text-xs font-bold">
            <div>Demo Assessment Initialized!</div>
            <div className="text-[11px] font-medium opacity-90">
              Loaded Marcus Vance (58M Elevated Risk) &bull; Switched to 3D Heart Explorer
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'overview' && (
          <OverviewDashboard
            patientInput={patientInput}
            predictionResult={predictionResult}
            onNavigate={(tab) => setCurrentTab(tab)}
            onSelectSyntheticProfile={handleSelectSyntheticProfile}
            onLaunchDemo={handleLaunchDemoAssessment}
            onUpdatePatientInput={(updated) => setPatientInput(updated)}
          />
        )}

        {currentTab === 'assessment' && (
          <PatientAssessmentForm
            initialInput={patientInput}
            onSubmit={(updated) => {
              setPatientInput(updated);
              setCurrentTab('overview');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onReset={handleResetAssessment}
            onSelectSyntheticProfile={handleSelectSyntheticProfile}
          />
        )}

        {currentTab === 'explorer' && (
          <HeartExplorerView
            patientInput={patientInput}
            predictionResult={predictionResult}
            onSnapshotCapture={(dataUrl) => setSnapshotDataUrl(dataUrl)}
            onNavigateToSimulator={() => setCurrentTab('simulator')}
          />
        )}

        {currentTab === 'intelligence' && (
          <RiskIntelligenceView
            predictionResult={predictionResult}
            patientInput={patientInput}
          />
        )}

        {currentTab === 'simulator' && (
          <WhatIfSimulator
            baselineInput={patientInput}
            baselineResult={predictionResult}
            onApplyScenarioAsBaseline={handleApplyScenarioAsBaseline}
          />
        )}

        {currentTab === 'datalab' && (
          <HealthDataLab
            onApplyExtractedData={handleApplyExtractedData}
            onNavigateToAssessment={() => setCurrentTab('assessment')}
          />
        )}

        {currentTab === 'assistant' && (
          <AiHealthAssistant
            patientInput={patientInput}
            predictionResult={predictionResult}
          />
        )}

        {currentTab === 'reports' && (
          <ReportGeneratorView
            patientInput={patientInput}
            predictionResult={predictionResult}
            snapshotDataUrl={snapshotDataUrl}
          />
        )}

        {currentTab === 'about' && (
          <AboutSafetyView />
        )}
      </main>

      {/* FOOTER */}
      <footer className="mt-16 border-t border-slate-900 bg-[#050a14] py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500/30" />
              <span className="font-bold text-white text-sm">CardioVision 3D AI</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                Track A Hackathon 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Multimodal Cardiovascular Risk Visualization, Machine Learning Stratification &amp; 3D Human Anatomy.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <button onClick={() => setCurrentTab('overview')} className="hover:text-sky-300">Overview</button>
            <button onClick={() => setCurrentTab('explorer')} className="hover:text-sky-300">3D Explorer</button>
            <button onClick={() => setCurrentTab('intelligence')} className="hover:text-sky-300">Explainable AI</button>
            <button onClick={() => setCurrentTab('assistant')} className="hover:text-sky-300">AI Assistant</button>
            <button onClick={() => setCurrentTab('reports')} className="hover:text-sky-300">Reports</button>
            <button onClick={() => setCurrentTab('about')} className="hover:text-sky-300">About &amp; Safety</button>
          </div>

          <div className="text-[10px] text-slate-400 text-center md:text-right max-w-xs">
            Research and educational visualization system. Not a diagnostic medical device. Emergency symptoms must be evaluated at an emergency medical center.
          </div>
        </div>
      </footer>
    </div>
  );
}
