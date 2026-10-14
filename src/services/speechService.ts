import { 
  PatientAssessmentInput, 
  PredictionResult, 
  SpokenFieldExtract,
  HeartHealthActionPlan 
} from '../types/cardiac';

/**
 * Checks if browser SpeechRecognition is supported
 */
export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 
    'webkitSpeechRecognition' in window
  );
}

/**
 * Checks if browser SpeechSynthesis is supported
 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Parses a spoken natural language transcript into structured patient assessment fields
 */
export function parseSpokenHealthDetails(transcript: string): {
  extractedFields: SpokenFieldExtract[];
  unmatchedPhrases: string[];
  recognizedTranscript: string;
} {
  const normalized = transcript.toLowerCase();
  const extracted: SpokenFieldExtract[] = [];
  const recognizedTranscript = transcript.trim();

  // 1. AGE: e.g. "age is 58", "age 58 years", "58 years old"
  const ageMatch = normalized.match(/(?:age\s*(?:is|of)?\s*(\d{1,3}))|(?:(\d{1,3})\s*(?:years?\s*old|yo))/i);
  if (ageMatch) {
    const val = parseInt(ageMatch[1] || ageMatch[2], 10);
    if (!isNaN(val)) {
      const isIssue = val < 18 || val > 105;
      extracted.push({
        field: 'age',
        label: 'Age',
        value: val,
        unit: 'years',
        confidence: isIssue ? 0.7 : 0.95,
        validationIssue: isIssue ? 'Age must be between 18 and 105 years.' : undefined
      });
    }
  }

  // 2. BLOOD PRESSURE / SYSTOLIC BP: e.g. "systolic blood pressure is 148", "bp is 148", "blood pressure 148"
  const bpMatch = normalized.match(/(?:(?:systolic\s*)?blood\s*pressure|systolic|bp)(?:\s*(?:is|of))?\s*(\d{2,3})/i);
  if (bpMatch) {
    const val = parseInt(bpMatch[1], 10);
    if (!isNaN(val)) {
      const isIssue = val < 70 || val > 260;
      extracted.push({
        field: 'restingBP',
        label: 'Resting Systolic BP',
        value: val,
        unit: 'mm Hg',
        confidence: isIssue ? 0.7 : 0.95,
        validationIssue: isIssue ? 'Systolic BP must be between 70 and 260 mm Hg.' : undefined
      });
    }
  }

  // 3. TOTAL CHOLESTEROL: e.g. "total cholesterol is 284", "cholesterol 284", "serum cholesterol 284"
  const cholMatch = normalized.match(/(?:(?:total|serum)\s*)?cholesterol(?:\s*(?:is|of))?\s*(\d{2,3})/i);
  if (cholMatch) {
    const val = parseInt(cholMatch[1], 10);
    if (!isNaN(val)) {
      const isIssue = val < 90 || val > 650;
      extracted.push({
        field: 'serumCholesterol',
        label: 'Total Cholesterol',
        value: val,
        unit: 'mg/dL',
        confidence: isIssue ? 0.7 : 0.95,
        validationIssue: isIssue ? 'Cholesterol must be between 90 and 650 mg/dL.' : undefined
      });
    }
  }

  // 4. RESTING HEART RATE: e.g. "resting heart rate is 84", "resting pulse 84", "pulse 72"
  const rhrMatch = normalized.match(/(?:resting\s*(?:heart\s*rate|pulse|hr))(?:\s*(?:is|of))?\s*(\d{2,3})/i)
    || normalized.match(/(?:heart\s*rate|pulse)(?:\s*(?:is|of))?\s*(\d{2,3})/i);
  if (rhrMatch) {
    const val = parseInt(rhrMatch[1], 10);
    if (!isNaN(val)) {
      const isIssue = val < 35 || val > 220;
      extracted.push({
        field: 'restingHR',
        label: 'Resting Heart Rate',
        value: val,
        unit: 'bpm',
        confidence: isIssue ? 0.7 : 0.92,
        validationIssue: isIssue ? 'Resting HR must be between 35 and 220 bpm.' : undefined
      });
    }
  }

  // 5. MAX / PEAK EXERCISE HEART RATE: e.g. "max heart rate 155", "peak heart rate 140", "exercise heart rate 150"
  const maxHrMatch = normalized.match(/(?:(?:maximum|max|peak|exercise)\s*(?:heart\s*rate|hr))(?:\s*(?:is|of))?\s*(\d{2,3})/i);
  if (maxHrMatch) {
    const val = parseInt(maxHrMatch[1], 10);
    if (!isNaN(val)) {
      const isIssue = val < 50 || val > 240;
      extracted.push({
        field: 'maxHR',
        label: 'Peak Exercise HR (thalach)',
        value: val,
        unit: 'bpm',
        confidence: isIssue ? 0.7 : 0.92,
        validationIssue: isIssue ? 'Peak HR must be between 50 and 240 bpm.' : undefined
      });
    }
  }

  // 6. FASTING BLOOD SUGAR: e.g. "blood sugar is 110", "fasting glucose 125", "glucose 95"
  const fbsMatch = normalized.match(/(?:(?:fasting\s*)?(?:blood\s*sugar|glucose|sugar|fbs))(?:\s*(?:is|of))?\s*(\d{2,3})/i);
  if (fbsMatch) {
    const val = parseInt(fbsMatch[1], 10);
    if (!isNaN(val)) {
      const isIssue = val < 40 || val > 500;
      extracted.push({
        field: 'fastingBloodSugar',
        label: 'Fasting Blood Sugar',
        value: val,
        unit: 'mg/dL',
        confidence: isIssue ? 0.7 : 0.90,
        validationIssue: isIssue ? 'Glucose must be between 40 and 500 mg/dL.' : undefined
      });
    }
  }

  // 7. CHEST PAIN TYPE: e.g. "typical angina", "chest pain", "tightness", "no chest pain", "asymptomatic"
  if (normalized.includes('typical angina') || normalized.includes('exertional chest pain') || normalized.includes('chest tightness')) {
    extracted.push({
      field: 'chestPainType',
      label: 'Chest Pain Type',
      value: 'typical_angina',
      unit: 'category',
      confidence: 0.90
    });
  } else if (normalized.includes('atypical angina') || normalized.includes('atypical chest pain')) {
    extracted.push({
      field: 'chestPainType',
      label: 'Chest Pain Type',
      value: 'atypical_angina',
      unit: 'category',
      confidence: 0.88
    });
  } else if (normalized.includes('non anginal') || normalized.includes('non cardiac pain')) {
    extracted.push({
      field: 'chestPainType',
      label: 'Chest Pain Type',
      value: 'non_anginal_pain',
      unit: 'category',
      confidence: 0.88
    });
  } else if (normalized.includes('no chest pain') || normalized.includes('asymptomatic') || normalized.includes('without chest pain')) {
    extracted.push({
      field: 'chestPainType',
      label: 'Chest Pain Type',
      value: 'asymptomatic',
      unit: 'category',
      confidence: 0.92
    });
  }

  // 8. SMOKING STATUS: e.g. "current smoker", "i smoke", "non smoker", "never smoked", "quit smoking", "former smoker"
  if (normalized.includes('non smoker') || normalized.includes('never smoke') || normalized.includes('do not smoke')) {
    extracted.push({
      field: 'smokingStatus',
      label: 'Smoking Status',
      value: 'never',
      unit: 'status',
      confidence: 0.95
    });
  } else if (normalized.includes('former smoker') || normalized.includes('quit smoking') || normalized.includes('used to smoke')) {
    extracted.push({
      field: 'smokingStatus',
      label: 'Smoking Status',
      value: 'former',
      unit: 'status',
      confidence: 0.92
    });
  } else if (normalized.includes('smoker') || normalized.includes('i smoke') || normalized.includes('current smoker')) {
    extracted.push({
      field: 'smokingStatus',
      label: 'Smoking Status',
      value: 'current',
      unit: 'status',
      confidence: 0.92
    });
  }

  // Find unmatched tokens for user transparency
  const unmatchedPhrases: string[] = [];
  if (extracted.length === 0) {
    unmatchedPhrases.push('Could not confidently match clinical measurements. Please specify values like "My age is 58 years, blood pressure is 148, cholesterol is 284".');
  }

  return {
    extractedFields: extracted,
    unmatchedPhrases,
    recognizedTranscript
  };
}

/**
 * Generates the spoken read-back script from current form data (Part 6)
 */
export function generateVoiceReadBackScript(input: PatientAssessmentInput): string {
  const parts: string[] = [];
  parts.push(`I have recorded your age as ${input.age} years.`);
  parts.push(`Systolic blood pressure as ${input.restingBP} millimetres of mercury.`);
  parts.push(`Total cholesterol as ${input.serumCholesterol} milligrams per decilitre.`);
  parts.push(`Resting heart rate as ${input.restingHR} beats per minute.`);
  
  if (input.maxHR) {
    parts.push(`Peak exercise heart rate as ${input.maxHR} beats per minute.`);
  }
  if (input.fastingBloodSugar) {
    parts.push(`Fasting blood sugar as ${input.fastingBloodSugar} milligrams per decilitre.`);
  }

  const cpName = input.chestPainType.replace(/_/g, ' ');
  parts.push(`Chest pain presentation recorded as ${cpName}.`);
  parts.push(`Smoking status recorded as ${input.smokingStatus}.`);

  parts.push(`Would you like to confirm these details, or edit any measurements before calculating the assessment?`);

  return parts.join(' ');
}

/**
 * Generates the complete spoken assessment results and recommendations script (Part 7)
 */
export function generateVoiceResultsScript(
  input: PatientAssessmentInput,
  result: PredictionResult,
  actionPlan: HeartHealthActionPlan
): string {
  const probPercent = (result.predictedProbability * 100).toFixed(1);
  const tier = result.riskCategory.toUpperCase();

  const lines: string[] = [];

  // 1. Exact predicted outcome and label
  lines.push(`Here is your CardioVision cardiovascular assessment summary.`);
  lines.push(`Your model classification score is ${probPercent} percent, which places you in the ${tier} likelihood tier.`);
  lines.push(`This score reflects the statistical presence of significant angiographic coronary artery disease narrowing over 50 percent, based on the historical catheterization referral dataset.`);

  // 2. What it means and does NOT mean
  lines.push(`What this classification score means: it indicates how closely your clinical markers resemble referral patients with confirmed coronary narrowing.`);
  
  if (result.prognosticRisk) {
    lines.push(`Based on validated American College of Cardiology Pooled Cohort Equations, your estimated individual 10-year probability of experiencing a heart attack or stroke is ${result.prognosticRisk.tenYearRiskPercent} percent, which falls in the ${result.prognosticRisk.tenYearRiskTier} category. The optimal benchmark for your age is ${result.prognosticRisk.optimalTenYearRiskPercent} percent. Your estimated lifetime cardiovascular risk is ${result.prognosticRisk.lifetimeRiskPercent} percent.`);
  }

  // 3. Key clinical inputs
  lines.push(`Your primary recorded factors include a resting systolic blood pressure of ${input.restingBP} millimetres of mercury, serum total cholesterol of ${input.serumCholesterol} milligrams per decilitre, and a peak exercise heart rate of ${input.maxHR} beats per minute.`);

  // 4. Urgent care check if applicable
  if (actionPlan.urgentMedicalAlert?.hasUrgentSymptom) {
    lines.push(`Important safety notice: You have reported symptoms of exertional chest pain or significant ST changes. Please consult a physician or cardiologist for prompt evaluation before engaging in vigorous exercise.`);
  }

  // 5. Diet & Indian food context
  lines.push(`From your personalized action plan: For nutrition, prioritize dietary fiber from vegetables, whole grains, and protein-rich lentils like moong or masoor dal, while reducing excess salt, saturated fats, and deep-fried foods.`);

  // 6. Activity & Lifestyle
  if (!actionPlan.urgentMedicalAlert?.hasUrgentSymptom) {
    lines.push(`For physical activity, begin with gradual, comfortable walking for 15 to 20 minutes daily, and reduce prolonged sitting.`);
  }

  lines.push(`Ensure 7 to 9 hours of restorative sleep, manage stress through daily relaxation, and discuss these findings, including potential coronary calcium or CT imaging, with your healthcare provider.`);
  lines.push(`Remember, CardioVision is an educational research prototype and not a substitute for clinical medical care.`);

  return lines.join(' ');
}

/**
 * Web Speech Synthesis Controller
 */
export class SpeechPlayerController {
  private utterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private isPaused = false;
  private onStateChange?: (state: { isSpeaking: boolean; isPaused: boolean; text: string }) => void;
  private currentText = '';

  constructor(onStateChange?: (state: { isSpeaking: boolean; isPaused: boolean; text: string }) => void) {
    this.onStateChange = onStateChange;
  }

  public speak(text: string): void {
    if (!isSpeechSynthesisSupported()) {
      console.warn('SpeechSynthesis is not supported in this browser.');
      return;
    }

    // Stop any existing speech
    this.stop();

    this.currentText = text;
    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.rate = 1.0;
    this.utterance.pitch = 1.0;

    // Prefer an English voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (preferredVoice) {
      this.utterance.voice = preferredVoice;
    }

    this.utterance.onstart = () => {
      this.isSpeaking = true;
      this.isPaused = false;
      this.notify();
    };

    this.utterance.onpause = () => {
      this.isPaused = true;
      this.notify();
    };

    this.utterance.onresume = () => {
      this.isPaused = false;
      this.notify();
    };

    this.utterance.onend = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.notify();
    };

    this.utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      this.isSpeaking = false;
      this.isPaused = false;
      this.notify();
    };

    window.speechSynthesis.speak(this.utterance);
  }

  public pause(): void {
    if (isSpeechSynthesisSupported() && this.isSpeaking && !this.isPaused) {
      window.speechSynthesis.pause();
      this.isPaused = true;
      this.notify();
    }
  }

  public resume(): void {
    if (isSpeechSynthesisSupported() && this.isPaused) {
      window.speechSynthesis.resume();
      this.isPaused = false;
      this.notify();
    }
  }

  public stop(): void {
    if (isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.isPaused = false;
      this.notify();
    }
  }

  public replay(): void {
    if (this.currentText) {
      this.speak(this.currentText);
    }
  }

  private notify(): void {
    if (this.onStateChange) {
      this.onStateChange({
        isSpeaking: this.isSpeaking,
        isPaused: this.isPaused,
        text: this.currentText
      });
    }
  }
}
