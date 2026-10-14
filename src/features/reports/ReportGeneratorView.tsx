import React, { useState } from 'react';
import { 
  PatientAssessmentInput, 
  PredictionResult 
} from '../../types/cardiac';
import { 
  FileText, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Layers, 
  HelpCircle, 
  ShieldAlert, 
  Utensils, 
  Stethoscope, 
  Flame, 
  AlertOctagon,
  Info
} from 'lucide-react';
import jsPDF from 'jspdf';
import { generateHeartHealthActionPlan } from '../../services/recommendationEngine';

interface ReportGeneratorViewProps {
  patientInput: PatientAssessmentInput;
  predictionResult: PredictionResult;
  snapshotDataUrl?: string | null;
}

export const ReportGeneratorView: React.FC<ReportGeneratorViewProps> = ({
  patientInput,
  predictionResult,
  snapshotDataUrl
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const reportId = `CV-REPORT-${patientInput.id || '2026-DEMO'}`;
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const actionPlan = generateHeartHealthActionPlan(patientInput, predictionResult);
  const probPercent = (predictionResult.predictedProbability * 100).toFixed(1);

  const handleDownloadPDF = () => {
    setIsGenerating(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const primaryColor = [14, 116, 144]; // Deep cyan
      const darkColor = [15, 23, 42];      // Slate 900
      const mutedColor = [100, 116, 139];  // Slate 500
      const amberColor = [217, 119, 6];    // Amber 600
      const roseColor = [225, 29, 72];     // Rose 600
      const emeraldColor = [5, 150, 105];  // Emerald 600

      // ==========================================
      // PAGE 1: SECTIONS 1, 2, 3
      // ==========================================

      // HEADER BANNER
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 30, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text('CardioVision 3D AI — Cardiovascular Health Assessment Report', 15, 12);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(56, 189, 248);
      doc.text('Track A: Multimodal Cardiovascular Risk Visualization & Prediction (Hackathon 2026)', 15, 18);

      doc.setFontSize(7.5);
      doc.setTextColor(203, 213, 225);
      const demoLabel = patientInput.isSyntheticDemo ? ' [DEMO DATA]' : '';
      doc.text(`Report ID: ${reportId}${demoLabel}   |   Date: ${currentDate}   |   Page 1 of 3`, 15, 24);

      // SECTION 1: ASSESSMENT SUMMARY
      let y = 37;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, y, 180, 22, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, y, 180, 22, 2, 2, 'D');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('1. ASSESSMENT SUMMARY', 18, y + 6);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      doc.text(`Patient Profile: ${patientInput.profileName || 'Active Patient Profile'}   |   Provenance: ${patientInput.isSyntheticDemo ? 'DEMO DATA (Synthetic Benchmark)' : 'Confirmed Clinical Ingestion'}`, 18, y + 11.5);
      doc.text(`Evaluation Framework: CardioVision 3D AI (Track A)   |   Reference Standard: Historical Catheterization Cohort`, 18, y + 16.5);

      // SECTION 2: PREDICTED OUTCOME & RESULT INTERPRETATION
      y += 26;
      doc.setFillColor(240, 249, 255);
      doc.roundedRect(15, y, 180, 52, 2, 2, 'F');
      doc.setDrawColor(186, 230, 253);
      doc.roundedRect(15, y, 180, 52, 2, 2, 'D');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('2. PREDICTED OUTCOME & RESULT INTERPRETATION', 18, y + 6);

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`${probPercent}%`, 18, y + 18);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const tierColor = predictionResult.riskCategory === 'elevated' ? roseColor : predictionResult.riskCategory === 'moderate' ? amberColor : primaryColor;
      doc.setTextColor(tierColor[0], tierColor[1], tierColor[2]);
      doc.text(`Stratification Tier: ${predictionResult.riskCategory.toUpperCase()} LIKELIHOOD`, 54, y + 14);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('Target Definition:', 54, y + 19);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      doc.text('Presence of angiographic CAD (>50% vessel diameter narrowing in major coronary arteries).', 80, y + 19);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('Output Nature:', 54, y + 24);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      doc.text('Uncalibrated statistical classification score on referral cohort (NOT an individual disease probability).', 76, y + 24);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(
        'What This Result Means: Quantifies statistical resemblance of patient markers to historical referral patients with verified coronary disease upon cardiac catheterization.',
        18,
        y + 32,
        { maxWidth: 174 }
      );
      doc.text(
        'What This Result Does NOT Mean: This model score is an uncalibrated classification score on historical data, NOT a standalone personal diagnosis.',
        18,
        y + 37,
        { maxWidth: 174 }
      );
      if (predictionResult.prognosticRisk) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(roseColor[0], roseColor[1], roseColor[2]);
        doc.text(
          `* ACC/AHA Validated Event Probability: 10-Year Hard Event Risk = ${predictionResult.prognosticRisk.tenYearRiskPercent}% (${predictionResult.prognosticRisk.tenYearRiskTier}; Optimal = ${predictionResult.prognosticRisk.optimalTenYearRiskPercent}%) | Lifetime Risk = ${predictionResult.prognosticRisk.lifetimeRiskPercent}% (${predictionResult.prognosticRisk.lifetimeRiskTier}).`,
          18,
          y + 43,
          { maxWidth: 174 }
        );
      }
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      doc.text(
        '* 95% Confidence Interval omitted per statistical audit: individual prediction variance requires empirical covariance matrix (X^T W X)^-1 to prevent false precision.',
        18,
        y + 50
      );

      // SECTION 3: PATIENT CLINICAL INPUTS AND UNITS
      y += 60;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('3. PATIENT CLINICAL INPUTS & MEASUREMENT UNITS', 15, y);

      y += 4;
      doc.setFillColor(241, 245, 249);
      doc.rect(15, y, 180, 6, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      doc.text('Clinical Parameter', 18, y + 4.2);
      doc.text('Submitted Value & Unit', 82, y + 4.2);
      doc.text('Clinical Reference Guideline', 132, y + 4.2);

      const tableRows = [
        ['Age & Biological Sex', `${patientInput.age} years / ${patientInput.sex}`, 'Demographic baseline'],
        ['Resting Systolic Blood Pressure', `${patientInput.restingBP} mm Hg`, '< 120 mm Hg (2017 ACC/AHA)'],
        ['Resting Heart Rate', `${patientInput.restingHR} bpm`, '60 – 100 bpm normal resting'],
        ['Peak Exercise Heart Rate (thalach)', `${patientInput.maxHR} bpm`, `Target: ~${Math.round(220 - patientInput.age)} bpm peak reserve`],
        ['Serum Total Cholesterol', `${patientInput.serumCholesterol} mg/dL`, '< 200 mg/dL Desirable Range'],
        ['Fasting Blood Sugar', `${patientInput.fastingBloodSugar} mg/dL`, '< 100 mg/dL Normal Fasting (<126 mg/dL)'],
        ['Chest Pain Classification', patientInput.chestPainType.replace(/_/g, ' '), 'Asymptomatic / Non-anginal'],
        ['Exercise ST Depression (oldpeak)', `${patientInput.stDepression.toFixed(1)} mm (Slope: ${patientInput.stSlope})`, '< 0.5 mm during peak treadmill exertion'],
        ['Fluoroscopy Major Vessels (ca)', `${patientInput.numMajorVesselsColored} major vessels (0–3 scale)`, '0 vessels opacified with stenosis'],
        ['Thallium Scintigraphy (thal)', patientInput.thalassemia.replace(/_/g, ' '), 'Normal myocardial radiotracer uptake'],
        ['Exercise-Induced Angina', patientInput.exerciseInducedAngina ? 'Present' : 'Absent', 'Absent during exercise testing'],
        ['Smoking & Diabetes Status', `${patientInput.smokingStatus} / ${patientInput.diabetesDiagnosed ? 'Diabetic' : 'Non-diabetic'}`, 'Non-smoker / Non-diabetic status']
      ];

      y += 6;
      tableRows.forEach((r, idx) => {
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, y, 180, 5.2, 'F');
        }
        doc.setFontSize(7.2);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.text(r[0], 18, y + 3.8);
        doc.setFont('helvetica', 'bold');
        doc.text(r[1], 82, y + 3.8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text(r[2], 132, y + 3.8);
        y += 5.2;
      });

      // PAGE 1 FOOTNOTE
      doc.setFontSize(7);
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      doc.text('Continued on Page 2: Relevant Health Factors, Prediction Explanation & Personalized Action Plan', 15, 285);

      // ==========================================
      // PAGE 2: SECTIONS 4, 5, 6
      // ==========================================
      doc.addPage();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('CardioVision 3D AI — Health Factors, Attribution & Action Plan', 15, 10);
      doc.setFontSize(7.5);
      doc.setTextColor(56, 189, 248);
      doc.text(`Report ID: ${reportId}${demoLabel}   |   Page 2 of 3`, 15, 14.5);

      // SECTION 4: RELEVANT CARDIOVASCULAR HEALTH FACTORS
      y = 24;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('4. RELEVANT CARDIOVASCULAR HEALTH FACTORS', 15, y);

      y += 4;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, y, 180, 36, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, y, 180, 36, 2, 2, 'D');

      doc.setFontSize(7.2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(`• Blood Pressure: Resting systolic BP of ${patientInput.restingBP} mm Hg contributes chronic mechanical shear stress to the vascular endothelium.`, 18, y + 6, { maxWidth: 174 });
      doc.text(`• Serum Lipids: Total cholesterol of ${patientInput.serumCholesterol} mg/dL reflects circulating atherogenic lipoprotein particle abundance.`, 18, y + 12, { maxWidth: 174 });
      doc.text(`• Metabolic & Smoking Status: Fasting glucose ${patientInput.fastingBloodSugar} mg/dL, smoking status: ${patientInput.smokingStatus}. Glycation and oxidant stress accelerate vascular aging.`, 18, y + 18, { maxWidth: 174 });
      doc.text(`• Exercise Capacity: Peak heart rate ${patientInput.maxHR} bpm and ST-depression ${patientInput.stDepression.toFixed(1)} mm reflect chronotropic reserve and electrical myocardial perfusion response.`, 18, y + 24, { maxWidth: 174 });
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      doc.text(`* General clinical context: Statistical associations do not imply that a single factor independently caused this risk estimate.`, 18, y + 31, { maxWidth: 174 });

      // SECTION 5: EXPLANATION OF THE PREDICTION
      y += 42;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('5. EXPLANATION OF THE PREDICTION (FEATURE ATTRIBUTION)', 15, y);

      y += 4;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, y, 180, 48, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, y, 180, 48, 2, 2, 'D');

      let factorY = y + 5;
      predictionResult.featureContributions.slice(0, 4).forEach((fc) => {
        const isElev = fc.weight > 0;
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(isElev ? roseColor[0] : emeraldColor[0], isElev ? roseColor[1] : emeraldColor[1], isElev ? roseColor[2] : emeraldColor[2]);
        doc.text(`• ${fc.label}: ${fc.patientValue} (${isElev ? '+' : ''}${fc.weight} log-odds | ${fc.impact})`, 18, factorY);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.text(`${fc.plainEnglishDescription}`, 18, factorY + 4, { maxWidth: 172 });

        factorY += 10.5;
      });

      // SECTION 6: PERSONALIZED HEART-HEALTHY ACTION PLAN
      y += 54;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('6. PERSONALIZED HEART-HEALTHY ACTION PLAN', 15, y);

      y += 4;
      doc.setFillColor(240, 253, 244); // Light emerald
      doc.roundedRect(15, y, 180, 130, 2, 2, 'F');
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(15, y, 180, 130, 2, 2, 'D');

      let planY = y + 5;

      // Urgent Warning if applicable
      if (actionPlan.urgentMedicalAlert?.hasUrgentSymptom) {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(roseColor[0], roseColor[1], roseColor[2]);
        doc.text('! URGENT CLINICAL SYMPTOM NOTICE:', 18, planY);
        doc.setFont('helvetica', 'normal');
        doc.text(actionPlan.urgentMedicalAlert.guidance, 18, planY + 4, { maxWidth: 172 });
        planY += 12;
      }

      // A. Diet
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('A. Food and Diet Suggestions (Including Familiar Indian Meals):', 18, planY);
      planY += 4.5;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('• Soluble Fiber & Whole Grains: Emphasize home-cooked lentils (moong, masoor dal), rajma, chickpeas, and oats/millets.', 22, planY, { maxWidth: 170 });
      planY += 4;
      doc.text('• Healthy Unsaturated Fats: Choose measured nuts (almonds, walnuts) and mustard/groundnut oil; strictly avoid trans fats/vanaspati.', 22, planY, { maxWidth: 170 });
      planY += 4;
      doc.text(`• Sodium & Sugars: Limit added salt (${patientInput.restingBP >= 130 ? '<1,500 mg/day' : '<2,300 mg/day'}) and minimize deep-fried snacks (samosas, pakoras) and sugary sweets.`, 22, planY, { maxWidth: 170 });

      // B. Physical Activity
      planY += 7;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('B. Physical Activity Suggestions:', 18, planY);
      planY += 4.5;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      if (actionPlan.urgentMedicalAlert?.hasUrgentSymptom) {
        doc.text('• Clearance Required: Obtain cardiologist evaluation before beginning physical conditioning due to reported exertional symptoms.', 22, planY, { maxWidth: 170 });
      } else {
        doc.text('• Gradual Aerobic Routine: Begin with comfortable 15–20 min brisk walking 4–5 days weekly; avoid sudden unconditioned strain.', 22, planY, { maxWidth: 170 });
        planY += 4;
        doc.text('• Interrupt Sedentary Time: Stand and stretch for 2 minutes every 45–60 minutes during desk work.', 22, planY, { maxWidth: 170 });
      }

      // C. Lifestyle
      planY += 7;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('C. Lifestyle & Preventive Habits:', 18, planY);
      planY += 4.5;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      if (patientInput.smokingStatus === 'current') {
        doc.text('• Smoking Cessation: Discuss evidence-based nicotine replacement and behavioral support with your physician.', 22, planY, { maxWidth: 170 });
        planY += 4;
      }
      doc.text('• Sleep Hygiene: Maintain 7–9 hours of regular, restorative sleep to regulate nocturnal autonomic tone.', 22, planY, { maxWidth: 170 });
      planY += 4;
      doc.text('• Stress & Tracking: Practice daily relaxation (deep breathing/yoga) and keep a home blood pressure log.', 22, planY, { maxWidth: 170 });

      // D. Questions for Doctor
      planY += 7;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('D. Questions for Your Healthcare Professional:', 18, planY);
      planY += 4.5;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      actionPlan.doctorDiscussionQuestions.slice(0, 3).forEach((q) => {
        doc.text(`• ${q}`, 22, planY, { maxWidth: 170 });
        planY += 4.5;
      });

      doc.setFont('helvetica', 'italic');
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      doc.text('* Educational guidance only. Does not constitute a clinical prescription or therapy adjustment.', 18, planY + 3);

      // ==========================================
      // PAGE 3: SECTIONS 7 & 8
      // ==========================================
      doc.addPage();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('CardioVision 3D AI — Digital Twin Snapshot, Limitations & Disclaimer', 15, 10);
      doc.setFontSize(7.5);
      doc.setTextColor(56, 189, 248);
      doc.text(`Report ID: ${reportId}${demoLabel}   |   Page 3 of 3`, 15, 14.5);

      // SECTION 7: INTERACTIVE 3D VISUALIZATION SNAPSHOT AND LEGEND
      y = 24;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('7. INTERACTIVE 3D VISUALIZATION SNAPSHOT & LEGEND', 15, y);

      y += 4;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, y, 180, 72, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, y, 180, 72, 2, 2, 'D');

      if (snapshotDataUrl) {
        doc.addImage(snapshotDataUrl, 'PNG', 18, y + 5, 80, 60);
      } else {
        doc.setFillColor(15, 23, 42);
        doc.roundedRect(18, y + 5, 80, 60, 2, 2, 'F');
        doc.setFontSize(8.5);
        doc.setTextColor(56, 189, 248);
        doc.text('[3D Heart Explorer Digital Twin]', 22, y + 30);
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text('Coronary Branches: LAD, RCA, LCx', 23, y + 36);
        doc.text('360° Real-Time Three.js Spatial Heatmap', 21, y + 42);
      }

      // Legend sidebar on right of 3D image
      let legY = y + 8;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('Anatomical Legend & Territories:', 104, legY);

      legY += 5;
      doc.setFontSize(7.2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      doc.text('• LAD: Left Anterior Descending (Anterior wall)', 104, legY);
      doc.text('• RCA: Right Coronary Artery (Inferior wall)', 104, legY + 4);
      doc.text('• LCx: Left Circumflex Artery (Lateral myocardium)', 104, legY + 8);

      legY += 15;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('Color Risk Mapping (Statistical Likelihood):', 104, legY);

      legY += 5;
      doc.setFontSize(7.2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(14, 116, 144);
      doc.text('■ Cyan: Low / Minimal Likelihood (< 35%)', 104, legY);
      doc.setTextColor(217, 119, 6);
      doc.text('■ Amber: Moderate / Borderline Likelihood (35% – 59%)', 104, legY + 4);
      doc.setTextColor(225, 29, 72);
      doc.text('■ Red: Elevated / High Likelihood (≥ 60%)', 104, legY + 8);

      legY += 15;
      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('* Conceptual Illustrative Overlay:', 104, legY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      doc.text('Derived from statistical patient covariates.', 104, legY + 3.5);
      doc.text('Does NOT depict actual anatomical plaque,', 104, legY + 7);
      doc.text('stenosis, or verified coronary blockages.', 104, legY + 10.5);

      // SECTION 8: LIMITATIONS & MEDICAL DISCLAIMER
      y += 80;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('8. MODEL LIMITATIONS & MEDICAL DISCLAIMER', 15, y);

      y += 4;
      doc.setFillColor(254, 252, 232); // Subtle amber/yellow
      doc.roundedRect(15, y, 180, 26, 2, 2, 'F');
      doc.setDrawColor(254, 240, 138);
      doc.roundedRect(15, y, 180, 26, 2, 2, 'D');

      doc.setFontSize(7.2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('• Population Bias: Model reflects historical referral cohorts referred for cardiac catheterization; not calibrated to asymptomatic general populations.', 18, y + 5, { maxWidth: 174 });
      doc.text('• Missing Modern Biomarkers: Does not incorporate high-sensitivity Troponin, Lp(a), Coronary Calcium score, or genetic markers.', 18, y + 11, { maxWidth: 174 });
      doc.text('• Observational Attribution: Feature weights represent multivariable statistical associations, not isolated biological causes.', 18, y + 17, { maxWidth: 174 });

      // Medical Disclaimer Box
      y += 31;
      doc.setFillColor(255, 241, 242); // Subtle rose/red
      doc.roundedRect(15, y, 180, 28, 2, 2, 'F');
      doc.setDrawColor(254, 205, 211);
      doc.roundedRect(15, y, 180, 28, 2, 2, 'D');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(roseColor[0], roseColor[1], roseColor[2]);
      doc.text('MANDATORY MEDICAL & RESEARCH SAFETY PROTOCOL DISCLAIMER', 18, y + 5);

      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(
        'CardioVision 3D AI was developed for Track A of the Multimodal AI Hackathon 2026. This report presents mathematical estimations for educational and scientific research exploration only. It is not a certified diagnostic medical device, coronary angiogram, or clinical health record. Do not begin, alter, or discontinue any cardiovascular therapy or medication without direct consultation with a qualified board-certified physician or cardiologist. In case of acute chest discomfort or shortness of breath, call emergency medical services immediately.',
        18,
        y + 10,
        { maxWidth: 174 }
      );

      // SAVE DOCUMENT
      doc.save(`CardioVision_Report_${reportId}.pdf`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Error generating PDF report:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* HEADER & ACTION BUTTONS */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-sky-500/25">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
                <FileText className="w-5 h-5" />
              </span>
              <h2 className="text-2xl font-extrabold text-white">Cardiovascular Summary Report</h2>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl">
              Preview and export a downloadable clinical-grade PDF report strictly structured into 8 audited sections: summary, predicted outcome, clinical inputs, relevant health factors, prediction explanation, personalized action plan, 3D visualization legend, and limitations/safety disclaimers.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 font-extrabold text-xs shadow-xl shadow-sky-500/25 transition-all hover:scale-105 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Building 3-Page PDF...' : 'Download Audited PDF Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>CardioVision 3-Page PDF report downloaded successfully to your computer!</span>
        </div>
      )}

      {/* DOCUMENT PREVIEW CONTAINER (MATCHES EXACT 8-SECTION AUDIT) */}
      <div className="bg-slate-950 p-4 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl max-w-4xl mx-auto space-y-6 text-slate-200">
        
        {/* DOCUMENT TOP BANNER */}
        <div className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sky-400 font-extrabold text-lg">CardioVision 3D AI</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">
                Track A Audited Report
              </span>
              {patientInput.isSyntheticDemo && (
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  DEMO DATA
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">Multi-Parametric Coronary Risk Stratification &bull; 8-Section Architecture</p>
          </div>
          <div className="text-right text-xs font-mono text-slate-400 space-y-0.5">
            <div>Report ID: <strong className="text-white">{reportId}</strong></div>
            <div>Date: {currentDate}</div>
            <div>Format: <span className="text-emerald-400 font-semibold">3-Page PDF Export Ready</span></div>
          </div>
        </div>

        {/* SECTION 1: ASSESSMENT SUMMARY */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider">
              1. Assessment Summary
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              {patientInput.isSyntheticDemo ? 'DEMO DATA (Synthetic Profile)' : 'Custom Patient Assessment'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
            <div>
              <span className="text-slate-400 text-[11px] block">Patient Profile</span>
              <strong className="text-white">{patientInput.profileName || 'Active Patient'}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Demographics</span>
              <strong className="text-white">{patientInput.age} yrs &bull; {patientInput.sex}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Model Version</span>
              <strong className="text-white">{predictionResult.modelVersion}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Training Cohort</span>
              <strong className="text-white">UCI Heart Disease Merged</strong>
            </div>
          </div>
        </div>

        {/* SECTION 2: PREDICTED OUTCOME & RESULT INTERPRETATION */}
        <div className="p-5 rounded-2xl bg-sky-950/20 border border-sky-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider">
              2. Predicted Outcome &amp; Result Interpretation
            </h4>
            <span className={`text-xs px-2.5 py-0.5 rounded font-mono font-bold uppercase ${
              predictionResult.riskCategory === 'elevated' ? 'bg-rose-500/20 text-rose-300' : 'bg-cyan-500/20 text-cyan-300'
            }`}>
              Tier: {predictionResult.riskCategory} Likelihood
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-4">
            <div className="text-4xl font-extrabold text-white font-mono">{probPercent}%</div>
            <div className="text-xs text-slate-300 space-y-1">
              <div><strong>Target: </strong> {predictionResult.targetDefinition}</div>
              <div><strong>Interpretation: </strong> Uncalibrated classification score on catheterization referral cohort.</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-800">
            <div className="text-slate-300 text-[11px]">
              <strong className="text-sky-300">What It Means: </strong> Indicates clinical marker similarity to catheterization patients with verified coronary stenosis.
            </div>
            <div className="text-slate-300 text-[11px]">
              <strong className="text-rose-300">What It Does NOT Mean: </strong> Does not independently constitute a personal clinical diagnosis without physician evaluation.
            </div>
          </div>
        </div>

        {/* SECTION 2B: ACC/AHA CLINICAL PROGNOSTIC RISK (10-YEAR & LIFETIME) */}
        {predictionResult.prognosticRisk && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-900/60 to-sky-950/40 border border-sky-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-400" />
                Clinically Validated 10-Year &amp; Lifetime Heart Attack Risk (ACC/AHA)
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-400/30 font-semibold">
                Prospective Hard Event Model
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">10-Year Hard Event Risk:</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    predictionResult.prognosticRisk.tenYearRiskPercent >= 20 ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {predictionResult.prognosticRisk.tenYearRiskTier}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white font-mono">{predictionResult.prognosticRisk.tenYearRiskPercent}%</span>
                  <span className="text-[11px] text-slate-400">Optimal: {predictionResult.prognosticRisk.optimalTenYearRiskPercent}%</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  {predictionResult.prognosticRisk.tenYearOutcomeDefinition}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Lifetime Cardiovascular Risk:</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    predictionResult.prognosticRisk.lifetimeRiskPercent >= 39 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {predictionResult.prognosticRisk.lifetimeRiskTier}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white font-mono">{predictionResult.prognosticRisk.lifetimeRiskPercent}%</span>
                  <span className="text-[11px] text-slate-400">Optimal: {predictionResult.prognosticRisk.optimalLifetimeRiskPercent}%</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  {predictionResult.prognosticRisk.lifetimeOutcomeDefinition}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: PATIENT CLINICAL INPUTS & UNITS */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider">
            3. Patient Clinical Inputs and Units
          </h4>
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900 text-slate-400 font-mono text-[11px]">
                <tr>
                  <th className="p-2.5">Parameter</th>
                  <th className="p-2.5">Observed Value</th>
                  <th className="p-2.5">Unit</th>
                  <th className="p-2.5">Clinical Reference Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                <tr>
                  <td className="p-2.5 text-slate-200">Resting Systolic Blood Pressure</td>
                  <td className="p-2.5 font-mono font-bold text-white">{patientInput.restingBP}</td>
                  <td className="p-2.5 text-slate-400">mm Hg</td>
                  <td className="p-2.5 text-slate-400">&lt; 120 mm Hg (Normal per ACC/AHA)</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-200">Resting Heart Rate</td>
                  <td className="p-2.5 font-mono font-bold text-white">{patientInput.restingHR}</td>
                  <td className="p-2.5 text-slate-400">bpm</td>
                  <td className="p-2.5 text-slate-400">60 – 100 bpm normal resting</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-200">Serum Total Cholesterol</td>
                  <td className="p-2.5 font-mono font-bold text-white">{patientInput.serumCholesterol}</td>
                  <td className="p-2.5 text-slate-400">mg/dL</td>
                  <td className="p-2.5 text-slate-400">&lt; 200 mg/dL Desirable Range</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-200">Fasting Blood Glucose</td>
                  <td className="p-2.5 font-mono font-bold text-white">{patientInput.fastingBloodSugar}</td>
                  <td className="p-2.5 text-slate-400">mg/dL</td>
                  <td className="p-2.5 text-slate-400">&lt; 100 mg/dL Normal Fasting</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-200">Peak Exercise Heart Rate (thalach)</td>
                  <td className="p-2.5 font-mono font-bold text-white">{patientInput.maxHR}</td>
                  <td className="p-2.5 text-slate-400">bpm</td>
                  <td className="p-2.5 text-slate-400">~{Math.round(220 - patientInput.age)} bpm age-predicted peak</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-200">Exercise ST Depression (oldpeak)</td>
                  <td className="p-2.5 font-mono font-bold text-white">{patientInput.stDepression.toFixed(1)}</td>
                  <td className="p-2.5 text-slate-400">mm</td>
                  <td className="p-2.5 text-slate-400">&lt; 0.5 mm during peak exertion</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 4: RELEVANT CARDIOVASCULAR HEALTH FACTORS */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider">
            4. Relevant Cardiovascular Health Factors
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <strong className="text-white block mb-1">Hemodynamic &amp; Arterial Shear</strong>
              Systolic BP of {patientInput.restingBP} mm Hg increases afterload and vascular endothelial mechanical stress.
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <strong className="text-white block mb-1">Lipid Profile &amp; Atherogenesis</strong>
              Total cholesterol of {patientInput.serumCholesterol} mg/dL correlates with circulating atherogenic lipoprotein burden.
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <strong className="text-white block mb-1">Exertional Myocardial Perfusion</strong>
              ST-depression of {patientInput.stDepression.toFixed(1)} mm provides an electrical readout of subendocardial oxygen supply.
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <strong className="text-white block mb-1">Lifestyle &amp; Metabolic Modifiers</strong>
              Smoking status ({patientInput.smokingStatus}) and fasting glucose ({patientInput.fastingBloodSugar} mg/dL) modulate systemic vascular oxidative health.
            </div>
          </div>
        </div>

        {/* SECTION 5: EXPLANATION OF THE PREDICTION */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider">
            5. Explanation of the Prediction (Attribution Weights)
          </h4>
          <div className="space-y-2">
            {predictionResult.featureContributions.slice(0, 4).map((fc, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <span className="font-bold text-white">{fc.label}</span>: {fc.patientValue}
                  <span className="text-[11px] text-slate-400 block">{fc.plainEnglishDescription}</span>
                </div>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                  fc.weight > 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-cyan-500/20 text-cyan-300'
                }`}>
                  {fc.weight > 0 ? `+${fc.weight}` : fc.weight} log-odds ({fc.impact})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 6: PERSONALIZED HEART-HEALTHY ACTION PLAN */}
        <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-4">
          <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
            6. Personalized Heart-Healthy Action Plan
          </h4>

          {actionPlan.urgentMedicalAlert?.hasUrgentSymptom && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
              <strong>URGENT SYMPTOM ADVISORY: </strong> {actionPlan.urgentMedicalAlert.guidance}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <strong className="text-sky-300 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5" /> Food &amp; Diet (Including Indian Meals)
              </strong>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Prioritize dietary fiber via lentils (moong, masoor dal), rajma, chickpeas, fresh vegetables (bhindi, palak, methi), and whole wheat/millets. Limit sodium, vanaspati, and deep-fried items.
              </p>
            </div>

            <div className="space-y-1.5">
              <strong className="text-emerald-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Physical Activity Suggestions
              </strong>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Start with gradual, comfortable walking (15–20 minutes daily) and break up prolonged sitting. Seek cardiologist clearance before vigorous exercise if exertional discomfort occurs.
              </p>
            </div>

            <div className="space-y-1.5">
              <strong className="text-amber-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" /> Lifestyle Suggestions
              </strong>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Ensure 7–9 hours of sleep, practice daily relaxation techniques, prioritize smoking cessation support where applicable, and maintain home blood pressure records.
              </p>
            </div>

            <div className="space-y-1.5">
              <strong className="text-indigo-300 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5" /> Follow-Up Doctor Questions
              </strong>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Ask your physician: "Based on my BP of {patientInput.restingBP} mm Hg and cholesterol of {patientInput.serumCholesterol} mg/dL, should I undergo a Coronary Calcium (CAC) scan or CCTA?"
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 7: INTERACTIVE 3D VISUALIZATION SNAPSHOT & LEGEND */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider">
            7. Interactive 3D Visualization Snapshot and Legend
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-5 h-44 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center p-2">
              {snapshotDataUrl ? (
                <img src={snapshotDataUrl} alt="3D Heart Snapshot" className="max-h-full max-w-full object-contain rounded-lg" />
              ) : (
                <div className="text-center space-y-1 text-slate-400 text-xs">
                  <Layers className="w-8 h-8 text-sky-400 mx-auto" />
                  <div className="text-slate-200 font-bold">3D Anatomical Twin</div>
                  <div className="text-[10px]">LAD, RCA, LCx Coronary Branches</div>
                </div>
              )}
            </div>
            <div className="sm:col-span-7 space-y-2 text-xs text-slate-300">
              <div className="font-bold text-white">Vascular Territories &amp; Color Legend:</div>
              <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
                <span className="p-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-center">Cyan: Low (&lt;35%)</span>
                <span className="p-1 rounded bg-amber-950 text-amber-300 border border-amber-800 text-center">Amber: Mod (35-59%)</span>
                <span className="p-1 rounded bg-rose-950 text-rose-300 border border-rose-800 text-center">Red: Elev (&ge;60%)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                <strong>Conceptual Illustrative Overlay: </strong> Color heatmap reflects statistical model projections onto anatomical coronary territories. It does <em>NOT</em> depict actual patient plaque, stenosis, or verified arterial blockages.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 8: LIMITATIONS & MEDICAL DISCLAIMER */}
        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2">
          <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
            8. Limitations and Medical Disclaimer
          </h4>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            <strong>Model Limitations: </strong> Trained on historical referral cohorts referred for catheterization; uncalibrated for general screening. Modern biomarkers (hs-cTn, CAC, Lp(a)) are not included.
          </p>
          <p className="text-[10px] text-slate-400 leading-relaxed border-t border-rose-900/60 pt-2">
            <strong>Mandatory Medical Disclaimer: </strong> CardioVision 3D AI is an educational research prototype built for Track A of the Multimodal AI Hackathon 2026. This assessment does NOT constitute medical diagnosis or advice. Do NOT alter medications or therapy without consulting a physician. In case of acute chest pain, seek emergency medical care immediately.
          </p>
        </div>

      </div>
    </div>
  );
};
