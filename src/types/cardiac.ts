/**
 * Core Types for CardioVision 3D AI
 * Multimodal Cardiovascular Risk Platform
 */

export type BiologicalSex = 'male' | 'female' | 'decline';

export type ChestPainType = 
  | 'typical_angina'      // 1 in UCI: Typical angina
  | 'atypical_angina'     // 2 in UCI: Atypical angina
  | 'non_anginal_pain'    // 3 in UCI: Non-anginal pain
  | 'asymptomatic';       // 4 in UCI: Asymptomatic

export type RestECGType = 
  | 'normal'              // 0 in UCI
  | 'st_t_abnormality'    // 1 in UCI: ST-T wave wave inversion or ST elevation/depression > 0.05 mV
  | 'lv_hypertrophy';     // 2 in UCI: Left ventricular hypertrophy by Estes' criteria

export type STSlopeType = 
  | 'upsloping'           // 1 in UCI
  | 'flat'                // 2 in UCI
  | 'downsloping';        // 3 in UCI

export type ThalassemiaType = 
  | 'normal'              // 3 in UCI
  | 'fixed_defect'        // 6 in UCI
  | 'reversible_defect';  // 7 in UCI

export interface PatientAssessmentInput {
  id: string;
  timestamp: string;
  isSyntheticDemo: boolean;
  profileName?: string;

  // Personal Information
  age: number;                           // years (20 - 95)
  sex: BiologicalSex;                    // male / female / decline

  // Vital Signs
  restingBP: number;                     // mm Hg (80 - 220)
  restingHR: number;                     // bpm (40 - 180)
  maxHR: number;                         // bpm (thalach: 60 - 220)

  // Laboratory Results
  serumCholesterol: number;              // mg/dL (100 - 600)
  hdlCholesterol?: number;               // mg/dL (20 - 100) optional
  ldlCholesterol?: number;               // mg/dL (40 - 300) optional
  fastingBloodSugar: number;             // mg/dL or > 120 indicator (60 - 350)
  fastingBloodSugarOver120: boolean;     // FBS > 120 mg/dl (1 / 0)

  // Clinical & Exercise Findings (UCI dataset features)
  chestPainType: ChestPainType;
  exerciseInducedAngina: boolean;        // exang (1 / 0)
  stDepression: number;                  // oldpeak (0.0 - 6.5 mm)
  stSlope: STSlopeType;                  // slope
  restingECG: RestECGType;               // restecg
  numMajorVesselsColored: number;        // ca (0 - 3)
  thalassemia: ThalassemiaType;          // thal

  // Lifestyle & Contextual Factors
  smokingStatus: 'never' | 'former' | 'current';
  cigarettesPerDay?: number;
  diabetesDiagnosed: boolean;
  familyHistoryCAD: boolean;
  notes?: string;
}

export type RiskCategory = 'low' | 'moderate' | 'elevated';

export interface FeatureContribution {
  feature: string;
  label: string;
  patientValue: string | number;
  unit: string;
  normalRange: string;
  clinicalReferenceRange: string;
  weight: number;          // Relative coefficient (standardized log-odds contribution)
  oddsRatioEstimate?: number; // e^(weight)
  impact: 'protective' | 'neutral' | 'elevating';
  plainEnglishDescription: string;
  description: string;
}

export interface PredictionResult {
  modelName: string;
  modelVersion: string;
  datasetOrigin: string;
  targetDefinition: string;            // Precise target description (>50% angiographic stenosis)
  predictedProbability: number;         // Model sigmoid score (0.00 to 1.00)
  riskCategory: RiskCategory;
  confidenceInterval?: [number, number] | null;  // Null because parametric covariance matrix is not stored
  confidenceIntervalNote: string;      // Explicit explanation that pseudo-intervals are omitted
  isCalibratedProbability: boolean;    // False: uncalibrated classification score on clinical referral cohort
  predictionHorizon: string;           // Cross-sectional disease status at catheterization; not 10-year prospective risk
  predictedClass: 0 | 1;               // 0 = low likelihood, 1 = presence in dataset target
  calibratedScore: number;             // 0 - 100 scale

  featureContributions: FeatureContribution[];
  
  // Model benchmark metadata
  modelMetrics: {
    rocAuc: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    logLoss: number;
  };

  // Dual Baseline Model Benchmark (Logistic Regression vs Random Forest)
  baselineComparison?: {
    logisticRegression: {
      name: string;
      probability: number;
      rocAuc: number;
      accuracy: number;
      precision: number;
      recall: number;
      f1Score: number;
      brierScore: number;
    };
    randomForest: {
      name: string;
      probability: number;
      rocAuc: number;
      accuracy: number;
      precision: number;
      recall: number;
      f1Score: number;
      brierScore: number;
    };
    modelConcordance: string;
  };

  warnings: string[];
  medicalDisclaimer: string;

  // Clinically Validated 10-Year & Lifetime Heart Attack / ASCVD Event Risk (ACC/AHA Guidelines)
  prognosticRisk?: ClinicalPrognosticRisk;
}

export interface ClinicalPrognosticRisk {
  // 10-Year Hard ASCVD Event Risk (ACC/AHA Pooled Cohort Equations)
  tenYearRiskPercent: number;          // e.g. 14.8%
  tenYearRiskTier: 'Low (<5%)' | 'Borderline (5%–7.4%)' | 'Intermediate (7.5%–19.9%)' | 'High (≥20%)';
  tenYearOutcomeDefinition: string;    // "10-year risk of experiencing a first hard cardiovascular event: nonfatal myocardial infarction (heart attack), coronary heart disease death, or fatal/nonfatal stroke."
  
  // Lifetime ASCVD Event Risk (ACC/AHA Prevention Guidelines)
  lifetimeRiskPercent: number;         // e.g. 39% or 50%
  lifetimeRiskTier: 'Optimal / Low (<20%)' | 'Elevated (≥39% or Major Risk Factor Burden)';
  lifetimeOutcomeDefinition: string;   // "Cumulative lifetime probability of developing symptomatic atherosclerotic cardiovascular disease or experiencing a heart attack/stroke."

  // Optimal Risk Comparison
  optimalTenYearRiskPercent: number;   // Expected 10-year risk with optimal risk factors (BP < 120, total chol < 170, non-smoker)
  optimalLifetimeRiskPercent: number;  // Expected lifetime risk with optimal profile (5% for men, 8% for women)
  
  // Validated calculation details
  guidelineSource: string;             // "ACC/AHA 2013/2019 Pooled Cohort Equations & Lifetime Cardiovascular Risk Matrix"
  keyDrivers: string[];                // Primary factors elevating 10-year / lifetime risk
}

export interface WhatIfComparison {
  baselineInput: PatientAssessmentInput;
  baselineResult: PredictionResult;
  scenarioInput: PatientAssessmentInput;
  scenarioResult: PredictionResult;
  deltaProbability: number;
  deltaCategoryChanged: boolean;
  differingFeatures: Array<{
    feature: string;
    label: string;
    oldValue: string | number;
    newValue: string | number;
    deltaDirection: 'improved' | 'worsened' | 'neutral';
  }>;
}

export interface AnatomicalRegionInfo {
  id: string;
  name: string;
  latinName: string;
  category: 'vessel' | 'chamber' | 'valve' | 'electrical';
  description: string;
  clinicalSignificance: string;
  supplyTerritory?: string;
  associatedRiskFactor: string;
  coronaryTerritory?: 'LAD' | 'RCA' | 'LCx' | 'General';
}

export interface ExtractedClinicalData {
  field: keyof PatientAssessmentInput | string;
  label: string;
  extractedValue: number | string | boolean;
  unit: string;
  confidence: number; // 0.0 - 1.0
  sourceSnippet: string;
  isConfirmed: boolean;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestedQuestions?: string[];
  isEmergencyAlert?: boolean;
}

export type ThemeMode = 'dark' | 'bright';

export interface ActionPlanRecommendation {
  id: string;
  category: 'diet' | 'activity' | 'lifestyle' | 'clinical_questions';
  title: string;
  whyRelevant: string;
  actionableStep: string;
  type: 'educational' | 'professional_advice' | 'urgent_clinical';
  indianDietContext?: string;
}

export interface HeartHealthActionPlan {
  dietSuggestions: ActionPlanRecommendation[];
  physicalActivitySuggestions: ActionPlanRecommendation[];
  lifestyleSuggestions: ActionPlanRecommendation[];
  doctorDiscussionQuestions: string[];
  urgentMedicalAlert?: {
    hasUrgentSymptom: boolean;
    symptomSummary: string;
    guidance: string;
  };
  disclaimer: string;
}

export interface SpokenFieldExtract {
  field: keyof PatientAssessmentInput;
  label: string;
  value: string | number | boolean;
  unit: string;
  confidence: number;
  isAmbiguous?: boolean;
  validationIssue?: string;
}

