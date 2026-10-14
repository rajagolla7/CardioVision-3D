import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  PatientAssessmentInput, 
  BiologicalSex, 
  ChestPainType, 
  RestECGType, 
  STSlopeType, 
  ThalassemiaType,
  SpokenFieldExtract 
} from '../../types/cardiac';
import { SYNTHETIC_PROFILES } from '../../data/syntheticProfiles';
import { computeCardiovascularPrediction } from '../../services/predictionEngine';
import { 
  FileText, 
  RotateCcw, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle, 
  Heart, 
  Activity, 
  FlaskConical, 
  ShieldAlert,
  Save,
  UserCheck,
  UserPlus,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Radio
} from 'lucide-react';
import { 
  isSpeechRecognitionSupported, 
  isSpeechSynthesisSupported, 
  parseSpokenHealthDetails, 
  generateVoiceReadBackScript, 
  SpeechPlayerController 
} from '../../services/speechService';

interface PatientAssessmentFormProps {
  initialInput: PatientAssessmentInput;
  onSubmit: (updatedInput: PatientAssessmentInput) => void;
  onReset: () => void;
  onSelectSyntheticProfile: (profileId: string) => void;
}

export const PatientAssessmentForm: React.FC<PatientAssessmentFormProps> = ({
  initialInput,
  onSubmit,
  onReset,
  onSelectSyntheticProfile
}) => {
  const [formData, setFormData] = useState<PatientAssessmentInput>({ ...initialInput });
  const [activeHelp, setActiveHelp] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Sync state if external initialInput changes (e.g. from demo launch or data lab ingestion)
  useEffect(() => {
    setFormData({ ...initialInput });
  }, [initialInput]);

  // Live calculated prediction based on current input values
  const livePrediction = useMemo(() => {
    try {
      return computeCardiovascularPrediction(formData);
    } catch {
      return null;
    }
  }, [formData]);

  // ==========================================
  // VOICE ENTRY & REVIEW STATE (PARTS 5 & 6)
  // ==========================================
  const [isListening, setIsListening] = useState(false);
  const [listeningTargetField, setListeningTargetField] = useState<keyof PatientAssessmentInput | 'all' | null>(null);
  const [manualTranscriptInput, setManualTranscriptInput] = useState('');
  const [showManualTranscriptModal, setShowManualTranscriptModal] = useState(false);
  const [reviewExtractedData, setReviewExtractedData] = useState<{
    transcript: string;
    fields: SpokenFieldExtract[];
    unmatched: string[];
  } | null>(null);

  // Voice Read-Back & Speech Synthesis state
  const [isPlayingReadBack, setIsPlayingReadBack] = useState(false);
  const [isPausedReadBack, setIsPausedReadBack] = useState(false);
  const [readBackTranscript, setReadBackTranscript] = useState('');
  const [showReadBackDrawer, setShowReadBackDrawer] = useState(false);

  // Guided Assessment state
  const [isGuidedMode, setIsGuidedMode] = useState(false);
  const [guidedStepIndex, setGuidedStepIndex] = useState(0);
  const [guidedAnswerInput, setGuidedAnswerInput] = useState('');

  const speechControllerRef = useRef<SpeechPlayerController | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    speechControllerRef.current = new SpeechPlayerController((state) => {
      setIsPlayingReadBack(state.isSpeaking && !state.isPaused);
      setIsPausedReadBack(state.isPaused);
    });

    return () => {
      speechControllerRef.current?.stop();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  // Initialize Speech Recognition
  const startSpeechRecognition = (target: keyof PatientAssessmentInput | 'all' = 'all') => {
    if (!isSpeechRecognitionSupported()) {
      setShowManualTranscriptModal(true);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognitionRef.current = recognition;
      setListeningTargetField(target);
      setIsListening(true);

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        setListeningTargetField(null);
        handleProcessSpokenTranscript(transcript, target);
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
        setListeningTargetField(null);
        // Fallback to manual text modal on error
        setShowManualTranscriptModal(true);
      };

      recognition.onend = () => {
        setIsListening(false);
        setListeningTargetField(null);
      };

      recognition.start();
    } catch (e) {
      console.warn('Failed to start SpeechRecognition:', e);
      setIsListening(false);
      setListeningTargetField(null);
      setShowManualTranscriptModal(true);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
    setListeningTargetField(null);
  };

  // Process a recognized spoken transcript (or user-submitted text from modal)
  const handleProcessSpokenTranscript = (transcript: string, target: keyof PatientAssessmentInput | 'all') => {
    if (!transcript.trim()) return;

    if (target !== 'all') {
      // Single field targeted speech
      const numericVal = parseInt(transcript.replace(/\D/g, ''), 10);
      if (!isNaN(numericVal)) {
        handleChange(target as any, numericVal);
        setSaveSuccessNotice(true);
        setTimeout(() => setSaveSuccessNotice(false), 2500);
        return;
      }
    }

    // Multi-field natural parsing
    const parsed = parseSpokenHealthDetails(transcript);
    setReviewExtractedData({
      transcript: parsed.recognizedTranscript,
      fields: parsed.extractedFields,
      unmatched: parsed.unmatchedPhrases
    });
  };

  // User explicitly confirms applying extracted values to the form
  const handleConfirmApplyExtracted = () => {
    if (!reviewExtractedData) return;

    setFormData(prev => {
      const updated = { ...prev };
      reviewExtractedData.fields.forEach(f => {
        (updated as any)[f.field] = f.value;
        if (f.field === 'fastingBloodSugar' && typeof f.value === 'number') {
          updated.fastingBloodSugarOver120 = f.value > 120;
        }
      });
      return updated;
    });

    setReviewExtractedData(null);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  // Voice Read-Back (PART 6)
  const handleStartVoiceReadBack = () => {
    const script = generateVoiceReadBackScript(formData);
    setReadBackTranscript(script);
    setShowReadBackDrawer(true);
    speechControllerRef.current?.speak(script);
  };

  const handlePauseVoiceReadBack = () => {
    speechControllerRef.current?.pause();
  };

  const handleResumeVoiceReadBack = () => {
    speechControllerRef.current?.resume();
  };

  const handleStopVoiceReadBack = () => {
    speechControllerRef.current?.stop();
    setIsPlayingReadBack(false);
    setIsPausedReadBack(false);
  };

  const handleReplayVoiceReadBack = () => {
    speechControllerRef.current?.replay();
  };

  // Guided Assessment Workflow
  const guidedQuestions = [
    { field: 'age', question: 'What is your age in years?', unit: 'years', placeholder: 'e.g. 58' },
    { field: 'restingBP', question: 'What is your resting systolic blood pressure in millimetres of mercury?', unit: 'mm Hg', placeholder: 'e.g. 148' },
    { field: 'serumCholesterol', question: 'What is your serum total cholesterol in milligrams per decilitre?', unit: 'mg/dL', placeholder: 'e.g. 284' },
    { field: 'restingHR', question: 'What is your resting heart rate in beats per minute?', unit: 'bpm', placeholder: 'e.g. 84' },
    { field: 'maxHR', question: 'What is your peak exercise heart rate achieved on a treadmill?', unit: 'bpm', placeholder: 'e.g. 155' }
  ];

  const handleStartGuidedMode = () => {
    setIsGuidedMode(true);
    setGuidedStepIndex(0);
    setGuidedAnswerInput('');
    const firstQ = guidedQuestions[0].question;
    speechControllerRef.current?.speak(firstQ);
  };

  const handleNextGuidedStep = () => {
    const currentQ = guidedQuestions[guidedStepIndex];
    const val = parseInt(guidedAnswerInput.replace(/\D/g, ''), 10);
    if (!isNaN(val)) {
      handleChange(currentQ.field as any, val);
    }

    if (guidedStepIndex < guidedQuestions.length - 1) {
      const nextIndex = guidedStepIndex + 1;
      setGuidedStepIndex(nextIndex);
      setGuidedAnswerInput('');
      const nextQ = guidedQuestions[nextIndex].question;
      speechControllerRef.current?.speak(nextQ);
    } else {
      setIsGuidedMode(false);
      setSaveSuccessNotice(true);
      speechControllerRef.current?.speak('All guided measurements have been recorded into your assessment form. Please review and calculate your risk.');
      setTimeout(() => setSaveSuccessNotice(false), 3500);
    }
  };

  // Range and format validations
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (formData.age < 18 || formData.age > 105) {
      errors.age = 'Age must be between 18 and 105 years.';
    }
    if (formData.restingBP < 70 || formData.restingBP > 260) {
      errors.restingBP = 'Resting blood pressure must be between 70 and 260 mm Hg.';
    }
    if (formData.restingHR < 35 || formData.restingHR > 220) {
      errors.restingHR = 'Resting heart rate must be between 35 and 220 bpm.';
    }
    if (formData.maxHR < 50 || formData.maxHR > 240) {
      errors.maxHR = 'Maximum exercise heart rate must be between 50 and 240 bpm.';
    }
    if (formData.serumCholesterol < 90 || formData.serumCholesterol > 650) {
      errors.serumCholesterol = 'Total cholesterol must be between 90 and 650 mg/dL.';
    }
    if (formData.fastingBloodSugar < 40 || formData.fastingBloodSugar > 500) {
      errors.fastingBloodSugar = 'Fasting glucose must be between 40 and 500 mg/dL.';
    }
    if (formData.stDepression < 0 || formData.stDepression > 8.0) {
      errors.stDepression = 'ST depression must be between 0.0 and 8.0 mm.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = <K extends keyof PatientAssessmentInput>(field: K, value: PatientAssessmentInput[K]) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'fastingBloodSugar' && typeof value === 'number') {
        updated.fastingBloodSugarOver120 = value > 120;
      }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3000);
    }
  };

  const explanations: Record<string, string> = {
    age: 'Age is a non-modifiable cardiovascular determinant reflecting cumulative lifetime vascular shear and atherogenic risk.',
    sex: 'Biological sex influences baseline coronary artery diameter and typical symptom presentation (Cleveland dataset standard). An option to decline is provided.',
    restingBP: 'Resting systolic blood pressure (mm Hg). Values above 130 indicate hypertension, increasing vascular resistance and cardiac work.',
    restingHR: 'Resting pulse in beats per minute, driving the 3D heart animation rhythm and reflecting autonomic tone.',
    maxHR: 'Peak heart rate achieved on Bruce treadmill protocol (thalach). High chronotropic response correlates strongly with lower cardiovascular risk.',
    serumCholesterol: 'Total serum cholesterol in mg/dL. Primary circulating substrate for atherosclerotic plaque development in coronary vessels.',
    fastingBloodSugar: 'Fasting venous plasma glucose. Values over 120 mg/dL (fbs=1 in UCI dataset) indicate metabolic dysfunction or diabetes.',
    chestPainType: 'Clinical symptom characterization: Typical angina (exertional retrosternal pressure relieved by rest), atypical angina, non-anginal chest discomfort, or asymptomatic.',
    stDepression: 'Millimeters of horizontal or downsloping ST-segment depression induced by exercise compared to resting baseline (oldpeak). Critical marker of subendocardial ischemia.',
    stSlope: 'The slope of the peak exercise ST-segment: Upsloping (typically normal), Flat, or Downsloping (strongly associated with multi-vessel disease).',
    restingECG: 'Baseline 12-lead electrocardiogram: Normal, ST-T wave abnormalities (inversion/elevation >0.05 mV), or Left Ventricular Hypertrophy (LVH).',
    numMajorVesselsColored: 'Number of major coronary arteries (0-3) opacified by fluoroscopy with luminal narrowing >50% (ca parameter).',
    thalassemia: 'Thallium-201 nuclear perfusion stress scintigraphy: Normal uptake, Fixed defect (previous infarct/scar), or Reversible defect (viable ischemic myocardium).'
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* HEADER & SYNTHETIC PRESET BAR */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-sky-500/25">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
                <FileText className="w-5 h-5" />
              </span>
              <h2 className="text-2xl font-extrabold text-white">Clinical Assessment Module</h2>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                formData.isSyntheticDemo 
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40' 
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
              }`}>
                {formData.isSyntheticDemo ? 'Synthetic Demo Mode' : 'Custom Patient Mode'}
              </span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
              Provide physiological vitals, lipid measurements, and exercise stress findings. Use manual form entry, spoken voice dictation, or the step-by-step guided voice assistant.
            </p>
          </div>

          {/* Preset Demonstration Profile Loader */}
          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-sky-500/20 space-y-2.5 sm:min-w-[340px]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Preset Demonstration Profile:
              </label>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    id: `CUSTOM-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    isSyntheticDemo: false,
                    profileName: 'Custom Patient Assessment (User-Provided)',
                    age: 50,
                    sex: 'male',
                    restingBP: 125,
                    restingHR: 72,
                    maxHR: 155,
                    serumCholesterol: 210,
                    hdlCholesterol: 50,
                    ldlCholesterol: 130,
                    fastingBloodSugar: 100,
                    fastingBloodSugarOver120: false,
                    chestPainType: 'non_anginal_pain',
                    exerciseInducedAngina: false,
                    stDepression: 0.5,
                    stSlope: 'upsloping',
                    restingECG: 'normal',
                    numMajorVesselsColored: 0,
                    thalassemia: 'normal',
                    smokingStatus: 'never',
                    diabetesDiagnosed: false,
                    familyHistoryCAD: false,
                    notes: 'User-provided clinical measurements entered manually.'
                  });
                }}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-bold underline flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3 h-3" />
                Start Custom
              </button>
            </div>
            <select
              value={formData.id}
              onChange={(e) => {
                const selected = SYNTHETIC_PROFILES.find(p => p.id === e.target.value);
                if (selected) {
                  setFormData({ ...selected });
                  onSelectSyntheticProfile(selected.id);
                }
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
            >
              {SYNTHETIC_PROFILES.map(p => (
                <option key={p.id} value={p.id}>
                  {p.profileName}
                </option>
              ))}
              {!formData.isSyntheticDemo && (
                <option value={formData.id}>
                  {formData.profileName || 'Active Custom Assessment'}
                </option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================
          VOICE ASSISTANT & GUIDED REVIEW PANEL (PARTS 5 & 6)
          ======================================================== */}
      <section className="glass-panel p-6 sm:p-7 rounded-3xl border border-sky-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
              <Mic className="w-4 h-4 text-sky-400" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Voice Assistant: Spoken Data Entry &amp; Spoken Review
              </h3>
              <p className="text-xs text-slate-400">
                Dictate clinical measurements by voice or review saved parameters through natural speech read-back.
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 w-fit">
            Web Speech Active
          </span>
        </div>

        {/* PRIMARY VOICE ACTION CONTROLS */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 1. Speak My Health Details Button */}
          <button
            type="button"
            onClick={() => isListening ? stopSpeechRecognition() : startSpeechRecognition('all')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs shadow-lg transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/30'
                : 'bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 shadow-sky-500/20'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>Listening... Click to Stop</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>Speak My Health Details</span>
              </>
            )}
          </button>

          {/* 2. Review My Details by Voice Button */}
          <button
            type="button"
            onClick={isPlayingReadBack ? handlePauseVoiceReadBack : isPausedReadBack ? handleResumeVoiceReadBack : handleStartVoiceReadBack}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-sky-500/30 text-sky-200 hover:text-white font-semibold text-xs transition-all cursor-pointer"
          >
            {isPlayingReadBack ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Spoken Review</span>
              </>
            ) : isPausedReadBack ? (
              <>
                <Play className="w-4 h-4" />
                <span>Resume Spoken Review</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-sky-400" />
                <span>Review My Details by Voice</span>
              </>
            )}
          </button>

          {/* 3. Guided Assessment Mode Button */}
          <button
            type="button"
            onClick={handleStartGuidedMode}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-indigo-500/30 text-indigo-300 hover:text-white font-semibold text-xs transition-all cursor-pointer"
          >
            <Radio className="w-4 h-4 text-indigo-400" />
            <span>Step-by-Step Guided Assistant</span>
          </button>

          {/* Audio Stop & Replay buttons if speech is active */}
          {(isPlayingReadBack || isPausedReadBack) && (
            <button
              type="button"
              onClick={handleStopVoiceReadBack}
              title="Stop Speech"
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            >
              <VolumeX className="w-4 h-4" />
            </button>
          )}

          {readBackTranscript && !isPlayingReadBack && !isPausedReadBack && (
            <button
              type="button"
              onClick={handleReplayVoiceReadBack}
              title="Replay Voice Summary"
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Manual Text Fallback Toggle */}
          <button
            type="button"
            onClick={() => setShowManualTranscriptModal(true)}
            className="text-xs text-slate-400 hover:text-sky-300 underline font-medium ml-auto cursor-pointer"
          >
            Manual Spoken-Text Fallback
          </button>
        </div>

        {/* HINT EXAMPLE BOX */}
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>Spoken Input Example: </strong>
            <span className="italic text-slate-200">
              "My age is 58 years, my systolic blood pressure is 148, my total cholesterol is 284, and my resting heart rate is 84."
            </span>
          </div>
        </div>

        {/* LIVE LISTENING ACTIVE PULSE */}
        {isListening && (
          <div className="p-4 rounded-2xl bg-sky-950/60 border border-sky-500/40 flex items-center justify-between text-xs animate-fadeIn">
            <div className="flex items-center gap-3 text-sky-200 font-bold">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <span>Microphone listening... Speak your age, blood pressure, cholesterol, or heart rate.</span>
            </div>
            <button
              type="button"
              onClick={stopSpeechRecognition}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-[11px] cursor-pointer"
            >
              Finish Speaking
            </button>
          </div>
        )}

        {/* VOICE READ-BACK CAPTION DRAWER */}
        {showReadBackDrawer && readBackTranscript && (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-sky-500/30 text-xs space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-sky-300 font-bold">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4" />
                Spoken Form Verification Script
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {isPlayingReadBack ? 'Speaking...' : isPausedReadBack ? 'Paused' : 'Playback Finished'}
              </span>
            </div>
            <p className="text-slate-200 text-[11px] leading-relaxed italic bg-slate-950 p-3 rounded-xl border border-slate-800">
              "{readBackTranscript}"
            </p>
          </div>
        )}

        {/* STEP-BY-STEP GUIDED WORKFLOW MODAL / BOX */}
        {isGuidedMode && (
          <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 text-xs space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between text-indigo-300 font-bold">
              <span className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-indigo-400" />
                Guided Assessment Step {guidedStepIndex + 1} of {guidedQuestions.length}
              </span>
              <button
                type="button"
                onClick={() => setIsGuidedMode(false)}
                className="text-slate-400 hover:text-white text-[11px] underline cursor-pointer"
              >
                Exit Guided Mode
              </button>
            </div>

            <p className="text-white text-sm font-semibold">
              {guidedQuestions[guidedStepIndex].question}
            </p>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={guidedAnswerInput}
                onChange={(e) => setGuidedAnswerInput(e.target.value)}
                placeholder={guidedQuestions[guidedStepIndex].placeholder}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={() => startSpeechRecognition(guidedQuestions[guidedStepIndex].field as any)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 cursor-pointer"
                title="Speak answer"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Speak</span>
              </button>
              <button
                type="button"
                onClick={handleNextGuidedStep}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
              >
                <span>Confirm &amp; Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* EXTRACTED DATA REVIEW & CONFIRMATION MODAL / DRAWER (CRITICAL USER VERIFICATION REQUIREMENT) */}
        {reviewExtractedData && (
          <div className="p-5 rounded-2xl bg-sky-950/40 border-2 border-sky-400/50 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Review Recognized Spoken Measurements Before Applying</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-900 text-sky-200">
                User Confirmation Required
              </span>
            </div>

            <div className="text-xs text-slate-300 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block font-mono text-[10px] mb-1">RECOGNIZED TRANSCRIPT:</span>
              <span className="italic font-medium text-white">"{reviewExtractedData.transcript}"</span>
            </div>

            {/* Extracted Fields Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-400 font-mono text-[11px]">
                  <tr>
                    <th className="p-2">Target Field</th>
                    <th className="p-2">Extracted Value</th>
                    <th className="p-2">Unit</th>
                    <th className="p-2">Status / Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/50">
                  {reviewExtractedData.fields.map((f, i) => (
                    <tr key={i}>
                      <td className="p-2 font-semibold text-white">{f.label}</td>
                      <td className="p-2 font-mono font-bold text-sky-300">{String(f.value)}</td>
                      <td className="p-2 text-slate-400">{f.unit}</td>
                      <td className="p-2">
                        {f.validationIssue ? (
                          <span className="inline-flex items-center gap-1 text-rose-300 text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            {f.validationIssue}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-300 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Ready to apply
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {reviewExtractedData.fields.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400 italic">
                        No clear numerical measurements recognized. Please try speaking clearly or use the manual text fallback.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-amber-300/90">
              * Notice: Clicking confirm will update only the recognized fields. Existing form fields will not be cleared. Prediction is not executed until you submit the form.
            </p>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setReviewExtractedData(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reviewExtractedData.fields.length === 0}
                onClick={handleConfirmApplyExtracted}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm &amp; Apply Spoken Details</span>
              </button>
            </div>
          </div>
        )}

        {/* MANUAL TRANSCRIPT FALLBACK MODAL */}
        {showManualTranscriptModal && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span>Manual Dictation / Text Transcription Fallback</span>
              <button
                type="button"
                onClick={() => setShowManualTranscriptModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] text-slate-300">
              Paste or type your spoken health details below (e.g. "My age is 58 years, systolic blood pressure is 148, total cholesterol is 284, resting heart rate is 84"):
            </p>
            <textarea
              rows={3}
              value={manualTranscriptInput}
              onChange={(e) => setManualTranscriptInput(e.target.value)}
              placeholder="Type or paste spoken sentence here..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-400"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowManualTranscriptModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleProcessSpokenTranscript(manualTranscriptInput, 'all');
                  setShowManualTranscriptModal(false);
                  setManualTranscriptInput('');
                }}
                className="px-4 py-1.5 rounded-lg bg-sky-500 text-slate-950 font-bold text-xs"
              >
                Extract Values
              </button>
            </div>
          </div>
        )}
      </section>

      {/* SUCCESS / ERROR NOTICES */}
      {saveSuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3 animate-fadeIn">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Patient assessment inputs recalculated! Prediction model and 3D Heart Explorer updated with revised physiological variables.</span>
        </div>
      )}

      {Object.keys(validationErrors).length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs space-y-1 animate-fadeIn">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>Please address the following measurement validation warnings:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-2 text-rose-200">
            {Object.values(validationErrors).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* MAIN FORM CONTAINER */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* GROUP 1: PERSONAL INFORMATION */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <h3 className="font-bold text-white text-base">1. Personal Information</h3>
            </div>
            <span className="text-[11px] text-slate-400">Demographic factors</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Age */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300 flex items-center gap-1">
                  Age <span className="text-rose-400">*</span>
                  <button type="button" onClick={() => setActiveHelp(activeHelp === 'age' ? null : 'age')}>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-sky-400" />
                  </button>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => startSpeechRecognition('age')}
                    title="Speak age"
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400"
                  >
                    <Mic className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-slate-400 text-[11px]">years</span>
                </div>
              </div>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
                className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none ${
                  validationErrors.age ? 'border-rose-500' : 'border-slate-700 focus:border-sky-400'
                }`}
                min={18}
                max={105}
                required
              />
              {activeHelp === 'age' && (
                <p className="text-[11px] text-sky-300 bg-sky-950/60 p-2 rounded-lg border border-sky-800/40">{explanations.age}</p>
              )}
            </div>

            {/* Biological Sex */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300 flex items-center gap-1">
                  Biological Sex <span className="text-rose-400">*</span>
                  <button type="button" onClick={() => setActiveHelp(activeHelp === 'sex' ? null : 'sex')}>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-sky-400" />
                  </button>
                </label>
                <span className="font-mono text-slate-400 text-[11px]">Standardized</span>
              </div>
              <select
                value={formData.sex}
                onChange={(e) => handleChange('sex', e.target.value as BiologicalSex)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400"
              >
                <option value="male">Male (Standardized 1)</option>
                <option value="female">Female (Standardized 0)</option>
                <option value="decline">Prefer not to disclose (Imputed)</option>
              </select>
              {activeHelp === 'sex' && (
                <p className="text-[11px] text-sky-300 bg-sky-950/60 p-2 rounded-lg border border-sky-800/40">{explanations.sex}</p>
              )}
            </div>

            {/* Smoking Status */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300">Smoking Status</label>
                <span className="font-mono text-slate-400 text-[11px]">Lifestyle</span>
              </div>
              <select
                value={formData.smokingStatus}
                onChange={(e) => handleChange('smokingStatus', e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400"
              >
                <option value="never">Non-smoker (Never)</option>
                <option value="former">Former Smoker</option>
                <option value="current">Current Smoker</option>
              </select>
            </div>
          </div>
        </div>

        {/* GROUP 2: VITAL SIGNS */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <h3 className="font-bold text-white text-base">2. Vital Signs &amp; Hemodynamics</h3>
            </div>
            <span className="text-[11px] text-slate-400">Cardiovascular measurements</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Resting Blood Pressure */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300 flex items-center gap-1">
                  Resting Systolic BP <span className="text-rose-400">*</span>
                  <button type="button" onClick={() => setActiveHelp(activeHelp === 'restingBP' ? null : 'restingBP')}>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-sky-400" />
                  </button>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => startSpeechRecognition('restingBP')}
                    title="Speak resting BP"
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400"
                  >
                    <Mic className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-slate-400 text-[11px]">mm Hg</span>
                </div>
              </div>
              <input
                type="number"
                value={formData.restingBP}
                onChange={(e) => handleChange('restingBP', parseInt(e.target.value) || 0)}
                className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none ${
                  validationErrors.restingBP ? 'border-rose-500' : 'border-slate-700 focus:border-sky-400'
                }`}
                min={70}
                max={260}
                required
              />
              {activeHelp === 'restingBP' && (
                <p className="text-[11px] text-sky-300 bg-sky-950/60 p-2 rounded-lg border border-sky-800/40">{explanations.restingBP}</p>
              )}
            </div>

            {/* Resting Heart Rate */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300 flex items-center gap-1">
                  Resting Heart Rate <span className="text-rose-400">*</span>
                  <button type="button" onClick={() => setActiveHelp(activeHelp === 'restingHR' ? null : 'restingHR')}>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-sky-400" />
                  </button>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => startSpeechRecognition('restingHR')}
                    title="Speak resting HR"
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400"
                  >
                    <Mic className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-slate-400 text-[11px]">bpm</span>
                </div>
              </div>
              <input
                type="number"
                value={formData.restingHR}
                onChange={(e) => handleChange('restingHR', parseInt(e.target.value) || 0)}
                className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none ${
                  validationErrors.restingHR ? 'border-rose-500' : 'border-slate-700 focus:border-sky-400'
                }`}
                min={35}
                max={220}
                required
              />
              {activeHelp === 'restingHR' && (
                <p className="text-[11px] text-sky-300 bg-sky-950/60 p-2 rounded-lg border border-sky-800/40">{explanations.restingHR}</p>
              )}
            </div>

            {/* Peak Exercise HR */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300 flex items-center gap-1">
                  Peak Exercise HR (thalach) <span className="text-rose-400">*</span>
                  <button type="button" onClick={() => setActiveHelp(activeHelp === 'maxHR' ? null : 'maxHR')}>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-sky-400" />
                  </button>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => startSpeechRecognition('maxHR')}
                    title="Speak peak HR"
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400"
                  >
                    <Mic className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-slate-400 text-[11px]">bpm</span>
                </div>
              </div>
              <input
                type="number"
                value={formData.maxHR}
                onChange={(e) => handleChange('maxHR', parseInt(e.target.value) || 0)}
                className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none ${
                  validationErrors.maxHR ? 'border-rose-500' : 'border-slate-700 focus:border-sky-400'
                }`}
                min={50}
                max={240}
                required
              />
              {activeHelp === 'maxHR' && (
                <p className="text-[11px] text-sky-300 bg-sky-950/60 p-2 rounded-lg border border-sky-800/40">{explanations.maxHR}</p>
              )}
            </div>
          </div>
        </div>

        {/* GROUP 3: LABORATORY & METABOLIC RESULTS */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <h3 className="font-bold text-white text-base">3. Laboratory &amp; Metabolic Markers</h3>
            </div>
            <span className="text-[11px] text-slate-400">Lipid and glycemic profiles</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Serum Total Cholesterol */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300 flex items-center gap-1">
                  Total Cholesterol <span className="text-rose-400">*</span>
                  <button type="button" onClick={() => setActiveHelp(activeHelp === 'serumCholesterol' ? null : 'serumCholesterol')}>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-sky-400" />
                  </button>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => startSpeechRecognition('serumCholesterol')}
                    title="Speak cholesterol"
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400"
                  >
                    <Mic className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-slate-400 text-[11px]">mg/dL</span>
                </div>
              </div>
              <input
                type="number"
                value={formData.serumCholesterol}
                onChange={(e) => handleChange('serumCholesterol', parseInt(e.target.value) || 0)}
                className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none ${
                  validationErrors.serumCholesterol ? 'border-rose-500' : 'border-slate-700 focus:border-sky-400'
                }`}
                min={90}
                max={650}
                required
              />
              {activeHelp === 'serumCholesterol' && (
                <p className="text-[11px] text-sky-300 bg-sky-950/60 p-2 rounded-lg border border-sky-800/40">{explanations.serumCholesterol}</p>
              )}
            </div>

            {/* Fasting Blood Glucose */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300 flex items-center gap-1">
                  Fasting Glucose <span className="text-rose-400">*</span>
                  <button type="button" onClick={() => setActiveHelp(activeHelp === 'fastingBloodSugar' ? null : 'fastingBloodSugar')}>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-sky-400" />
                  </button>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => startSpeechRecognition('fastingBloodSugar')}
                    title="Speak fasting glucose"
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400"
                  >
                    <Mic className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-slate-400 text-[11px]">mg/dL</span>
                </div>
              </div>
              <input
                type="number"
                value={formData.fastingBloodSugar}
                onChange={(e) => handleChange('fastingBloodSugar', parseInt(e.target.value) || 0)}
                className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none ${
                  validationErrors.fastingBloodSugar ? 'border-rose-500' : 'border-slate-700 focus:border-sky-400'
                }`}
                min={40}
                max={500}
                required
              />
              {activeHelp === 'fastingBloodSugar' && (
                <p className="text-[11px] text-sky-300 bg-sky-950/60 p-2 rounded-lg border border-sky-800/40">{explanations.fastingBloodSugar}</p>
              )}
            </div>

            {/* HDL Cholesterol (optional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300">HDL Cholesterol</label>
                <span className="font-mono text-slate-400 text-[11px]">mg/dL</span>
              </div>
              <input
                type="number"
                value={formData.hdlCholesterol || ''}
                onChange={(e) => handleChange('hdlCholesterol', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Optional"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400"
              />
            </div>

            {/* LDL Cholesterol (optional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300">LDL Cholesterol</label>
                <span className="font-mono text-slate-400 text-[11px]">mg/dL</span>
              </div>
              <input
                type="number"
                value={formData.ldlCholesterol || ''}
                onChange={(e) => handleChange('ldlCholesterol', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Optional"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>
        </div>

        {/* GROUP 4: CLINICAL & EXERCISE STRESS FINDINGS */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <h3 className="font-bold text-white text-base">4. Clinical Symptoms &amp; Diagnostic Findings</h3>
            </div>
            <span className="text-[11px] text-slate-400">Stress testing and catheterization criteria</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Chest Pain Classification */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300 flex items-center gap-1">
                  Chest Pain Presentation <span className="text-rose-400">*</span>
                  <button type="button" onClick={() => setActiveHelp(activeHelp === 'chestPainType' ? null : 'chestPainType')}>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-sky-400" />
                  </button>
                </label>
                <span className="font-mono text-slate-400 text-[11px]">Diamond-Forrester</span>
              </div>
              <select
                value={formData.chestPainType}
                onChange={(e) => handleChange('chestPainType', e.target.value as ChestPainType)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400"
              >
                <option value="typical_angina">Typical Angina (Exertional)</option>
                <option value="atypical_angina">Atypical Angina</option>
                <option value="non_anginal_pain">Non-anginal Chest Pain</option>
                <option value="asymptomatic">Asymptomatic</option>
              </select>
              {activeHelp === 'chestPainType' && (
                <p className="text-[11px] text-sky-300 bg-sky-950/60 p-2 rounded-lg border border-sky-800/40">{explanations.chestPainType}</p>
              )}
            </div>

            {/* Exercise ST Depression */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300 flex items-center gap-1">
                  Exercise ST Depression (oldpeak) <span className="text-rose-400">*</span>
                  <button type="button" onClick={() => setActiveHelp(activeHelp === 'stDepression' ? null : 'stDepression')}>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-sky-400" />
                  </button>
                </label>
                <span className="font-mono text-slate-400 text-[11px]">mm</span>
              </div>
              <input
                type="number"
                step="0.1"
                value={formData.stDepression}
                onChange={(e) => handleChange('stDepression', parseFloat(e.target.value) || 0)}
                className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none ${
                  validationErrors.stDepression ? 'border-rose-500' : 'border-slate-700 focus:border-sky-400'
                }`}
                min={0.0}
                max={8.0}
                required
              />
              {activeHelp === 'stDepression' && (
                <p className="text-[11px] text-sky-300 bg-sky-950/60 p-2 rounded-lg border border-sky-800/40">{explanations.stDepression}</p>
              )}
            </div>

            {/* ST Slope */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300 flex items-center gap-1">
                  ST-Segment Slope <span className="text-rose-400">*</span>
                  <button type="button" onClick={() => setActiveHelp(activeHelp === 'stSlope' ? null : 'stSlope')}>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-sky-400" />
                  </button>
                </label>
                <span className="font-mono text-slate-400 text-[11px]">ECG Dynamics</span>
              </div>
              <select
                value={formData.stSlope}
                onChange={(e) => handleChange('stSlope', e.target.value as STSlopeType)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400"
              >
                <option value="upsloping">Upsloping (Normal / 1)</option>
                <option value="flat">Flat (Equivocal / 2)</option>
                <option value="downsloping">Downsloping (Ischemia / 3)</option>
              </select>
              {activeHelp === 'stSlope' && (
                <p className="text-[11px] text-sky-300 bg-sky-950/60 p-2 rounded-lg border border-sky-800/40">{explanations.stSlope}</p>
              )}
            </div>

            {/* Resting ECG */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300 flex items-center gap-1">
                  Resting 12-Lead ECG <span className="text-rose-400">*</span>
                  <button type="button" onClick={() => setActiveHelp(activeHelp === 'restingECG' ? null : 'restingECG')}>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-sky-400" />
                  </button>
                </label>
                <span className="font-mono text-slate-400 text-[11px]">Baseline</span>
              </div>
              <select
                value={formData.restingECG}
                onChange={(e) => handleChange('restingECG', e.target.value as RestECGType)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400"
              >
                <option value="normal">Normal (0)</option>
                <option value="st_t_abnormality">ST-T Wave Abnormality (1)</option>
                <option value="lv_hypertrophy">Left Ventricular Hypertrophy (2)</option>
              </select>
              {activeHelp === 'restingECG' && (
                <p className="text-[11px] text-sky-300 bg-sky-950/60 p-2 rounded-lg border border-sky-800/40">{explanations.restingECG}</p>
              )}
            </div>

            {/* Number of Major Vessels by Fluoroscopy */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300 flex items-center gap-1">
                  Fluoroscopy Vessels (ca) <span className="text-rose-400">*</span>
                  <button type="button" onClick={() => setActiveHelp(activeHelp === 'numMajorVesselsColored' ? null : 'numMajorVesselsColored')}>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-sky-400" />
                  </button>
                </label>
                <span className="font-mono text-slate-400 text-[11px]">0 to 3 scale</span>
              </div>
              <select
                value={formData.numMajorVesselsColored}
                onChange={(e) => handleChange('numMajorVesselsColored', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400"
              >
                <option value={0}>0 Major Vessels</option>
                <option value={1}>1 Major Vessel</option>
                <option value={2}>2 Major Vessels</option>
                <option value={3}>3 Major Vessels</option>
              </select>
              {activeHelp === 'numMajorVesselsColored' && (
                <p className="text-[11px] text-sky-300 bg-sky-950/60 p-2 rounded-lg border border-sky-800/40">{explanations.numMajorVesselsColored}</p>
              )}
            </div>

            {/* Thallium Stress Scintigraphy */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300 flex items-center gap-1">
                  Thallium Stress Scan (thal) <span className="text-rose-400">*</span>
                  <button type="button" onClick={() => setActiveHelp(activeHelp === 'thalassemia' ? null : 'thalassemia')}>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-sky-400" />
                  </button>
                </label>
                <span className="font-mono text-slate-400 text-[11px]">Nuclear Perfusion</span>
              </div>
              <select
                value={formData.thalassemia}
                onChange={(e) => handleChange('thalassemia', e.target.value as ThalassemiaType)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400"
              >
                <option value="normal">Normal (3)</option>
                <option value="fixed_defect">Fixed Defect / Scar (6)</option>
                <option value="reversible_defect">Reversible Defect / Ischemia (7)</option>
              </select>
              {activeHelp === 'thalassemia' && (
                <p className="text-[11px] text-sky-300 bg-sky-950/60 p-2 rounded-lg border border-sky-800/40">{explanations.thalassemia}</p>
              )}
            </div>
          </div>

          {/* Exercise Angina Checkbox */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <input
              type="checkbox"
              id="exangCheck"
              checked={formData.exerciseInducedAngina}
              onChange={(e) => handleChange('exerciseInducedAngina', e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-sky-500 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="exangCheck" className="text-xs text-slate-300 cursor-pointer">
              <strong className="text-white">Exercise Induced Angina (exang): </strong>
              Patient experiences chest discomfort directly triggered by physical exertion during treadmill stress test.
            </label>
          </div>
        </div>

        {/* LIVE PREDICTION PREVIEW CARD */}
        {livePrediction && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-sky-950/30 to-slate-900/90 border border-sky-500/30 shadow-xl shadow-sky-950/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Calculated Model Prediction</span>
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                    livePrediction.riskCategory === 'elevated'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : livePrediction.riskCategory === 'moderate'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {livePrediction.riskCategory.toUpperCase()} RISK TIER
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline gap-4">
                  <div>
                    <span className="text-3xl font-black text-white font-mono tracking-tight">{livePrediction.calibratedScore.toFixed(1)}%</span>
                    <span className="text-[11px] text-slate-300 ml-1.5 font-medium">Model Classification Score</span>
                  </div>

                  {livePrediction.prognosticRisk && (
                    <div className="flex items-center gap-3 pl-3 border-l border-slate-700">
                      <div>
                        <span className="text-xl font-bold text-rose-300 font-mono">{livePrediction.prognosticRisk.tenYearRiskPercent}%</span>
                        <span className="text-[10px] text-slate-400 block">10-Yr Hard Event Risk</span>
                      </div>
                      <div>
                        <span className="text-xl font-bold text-amber-300 font-mono">{livePrediction.prognosticRisk.lifetimeRiskPercent}%</span>
                        <span className="text-[10px] text-slate-400 block">Lifetime Risk</span>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 max-w-2xl leading-relaxed">
                  Includes validated <strong>ACC/AHA 10-Year Heart Attack &amp; Stroke Probability</strong> plus historical catheterization classification score. Clicking will open your full cardiovascular dashboard.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="submit"
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-sky-400 via-cyan-400 to-sky-300 hover:from-sky-300 hover:to-cyan-200 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-sky-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <span>See Predicted Risk &amp; Assessment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACTION BUTTONS BAR */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Reset Assessment to Defaults</span>
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 font-extrabold text-sm shadow-xl shadow-sky-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Save className="w-4 h-4 fill-slate-950" />
            <span>Calculate Cardiovascular Risk &amp; See Results</span>
          </button>
        </div>
      </form>
    </div>
  );
};
