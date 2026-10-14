import { 
  PatientAssessmentInput, 
  PredictionResult, 
  HeartHealthActionPlan, 
  ActionPlanRecommendation 
} from '../types/cardiac';

/**
 * Generates personalized cardiovascular lifestyle and dietary educational recommendations
 * based on confirmed patient clinical inputs and model findings.
 */
export function generateHeartHealthActionPlan(
  input: PatientAssessmentInput,
  prediction: PredictionResult
): HeartHealthActionPlan {
  const isHypertensive = input.restingBP >= 130;
  const isHighCholesterol = input.serumCholesterol >= 200;
  const isDiabeticOrHighGlucose = input.diabetesDiagnosed || input.fastingBloodSugarOver120 || input.fastingBloodSugar >= 126;
  const isSmoker = input.smokingStatus === 'current';
  const hasExerciseSymptoms = input.exerciseInducedAngina || input.stDepression >= 1.5;
  const hasChestPain = input.chestPainType === 'typical_angina';

  // Urgent medical alert check for severe symptoms
  let urgentMedicalAlert: HeartHealthActionPlan['urgentMedicalAlert'] = undefined;
  if (hasChestPain || (hasExerciseSymptoms && input.stDepression >= 2.0)) {
    urgentMedicalAlert = {
      hasUrgentSymptom: true,
      symptomSummary: hasChestPain 
        ? 'Reported typical exertional substernal chest discomfort (angina).'
        : 'Reported exertional angina and pronounced exercise ST depression (≥2.0 mm).',
      guidance: 'PRIORITY MEDICAL ADVISEMENT: Do not initiate vigorous exercise or unguided physical stress. Immediate in-person clinical evaluation by a physician or cardiologist is strongly advised before starting any physical conditioning.'
    };
  }

  // A. FOOD & DIET SUGGESTIONS
  const dietSuggestions: ActionPlanRecommendation[] = [
    {
      id: 'diet-fiber-veg',
      category: 'diet',
      title: 'Emphasize High-Fiber Vegetables, Legumes, and Whole Grains',
      whyRelevant: `Soluble fiber binds bile acids in the gut to reduce circulating LDL cholesterol and modulates postprandial glucose absorption.`,
      actionableStep: 'Incorporate at least 25–30g of dietary fiber daily through vegetables, whole grains (oats, barley), and legumes.',
      type: 'educational',
      indianDietContext: 'Familiar Indian options: Home-cooked lentils and dals (moong, masoor, chana dal), rajma, chickpeas, seasonal vegetables (bhindi, palak, methi, lauki, tori), and whole wheat rotis or millets (jowar, bajra, ragi) without excessive added oil.'
    },
    {
      id: 'diet-fats',
      category: 'diet',
      title: 'Choose Heart-Healthy Unsaturated Fats Over Saturated/Trans Fats',
      whyRelevant: `Replacing saturated fats (butter, ghee in excess, palm oil) with mono- and polyunsaturated fats lowers serum total and LDL cholesterol.`,
      actionableStep: 'Include a modest handful (about 25–30g) of unsalted nuts (almonds, walnuts) and seeds daily. Use cold-pressed oils in measured portions.',
      type: 'educational',
      indianDietContext: 'Use measured quantities of mustard, sesame, or groundnut oil for cooking; strictly avoid vanaspati, repeated reheating of frying oils, and deep-fried savory snacks (samosas, namkeen, bhujia).'
    },
    {
      id: 'diet-sodium',
      category: 'diet',
      title: isHypertensive 
        ? 'Reduce Dietary Sodium (<1,500 mg/day for Blood Pressure Control)'
        : 'Moderate Sodium Intake (<2,300 mg/day for Vascular Health)',
      whyRelevant: `Observed systolic pressure is ${input.restingBP} mm Hg. Excess dietary sodium leads to fluid retention and elevated systemic vascular resistance.`,
      actionableStep: 'Limit added salt during cooking, avoid processed canned goods, and use fresh herbs, lemon juice, or spices for seasoning.',
      type: isHypertensive ? 'professional_advice' : 'educational',
      indianDietContext: 'Minimize high-sodium accompaniments such as commercial pickles (achars), papads, salted chaat items, and packaged instant masalas.'
    },
    {
      id: 'diet-sugars-portions',
      category: 'diet',
      title: isDiabeticOrHighGlucose
        ? 'Strict Carbohydrate Quality & Added Sugar Restriction'
        : 'Limit Sugary Drinks & Ultra-Processed Foods',
      whyRelevant: `Fasting blood glucose is recorded at ${input.fastingBloodSugar} mg/dL. Refined sugars drive hyperinsulinemia, hepatic de novo lipogenesis, and triglyceride spikes.`,
      actionableStep: 'Replace sugar-sweetened beverages with water, green tea, or unsweetened infusions; maintain consistent portion sizes across regular meal times.',
      type: isDiabeticOrHighGlucose ? 'professional_advice' : 'educational',
      indianDietContext: 'Limit traditional sweets (mithai, halwa, jalebi) and white refined flours (maida). Pair rotis with fiber-rich sabzi and a bowl of curd or salad to blunt glucose surges.'
    }
  ];

  // B. PHYSICAL ACTIVITY SUGGESTIONS
  const physicalActivitySuggestions: ActionPlanRecommendation[] = [];

  if (urgentMedicalAlert?.hasUrgentSymptom) {
    physicalActivitySuggestions.push({
      id: 'activity-caution',
      category: 'activity',
      title: 'Clinical Exercise Clearance Required Before Strenuous Activity',
      whyRelevant: `Due to reported typical chest pain or exercise ST-segment depression (${input.stDepression.toFixed(1)} mm), vigorous exercise could trigger coronary ischemia.`,
      actionableStep: 'Consult your cardiologist or physician for an individualized exercise prescription (such as a supervised cardiac rehabilitation protocol) before starting any fitness program.',
      type: 'urgent_clinical'
    });
    physicalActivitySuggestions.push({
      id: 'activity-gentle-walk',
      category: 'activity',
      title: 'Gentle, Symptom-Free Walking (If Medically Approved)',
      whyRelevant: 'Gentle movement helps prevent vascular deconditioning while minimizing cardiac workload.',
      actionableStep: 'Engage only in short, light, flat-surface strolls (5–10 minutes) at a comfortable conversation pace. Stop immediately if any chest tightness, shortness of breath, or dizziness occurs.',
      type: 'professional_advice'
    });
  } else {
    physicalActivitySuggestions.push({
      id: 'activity-gradual-walk',
      category: 'activity',
      title: 'Gradual Aerobic Conditioning: 150 Minutes of Moderate Walking Weekly',
      whyRelevant: `Aerobic exercise stimulates vascular endothelial nitric oxide production, improves myocardial efficiency, and enhances chronotropic reserve (current peak HR: ${input.maxHR} bpm).`,
      actionableStep: 'Start with 15–20 minutes of comfortable, brisk walking 4–5 days a week, gradually building towards 30 minutes daily as tolerated.',
      type: 'educational'
    });
    physicalActivitySuggestions.push({
      id: 'activity-sedentary',
      category: 'activity',
      title: 'Interrupt Prolonged Sitting Throughout the Day',
      whyRelevant: 'Prolonged sitting impairs peripheral vascular circulation and reduces postprandial glucose clearance.',
      actionableStep: 'Stand, stretch, or take a 2-minute stroll every 45–60 minutes during desk work or television viewing.',
      type: 'educational'
    });
  }

  // C. LIFESTYLE SUGGESTIONS
  const lifestyleSuggestions: ActionPlanRecommendation[] = [];

  if (isSmoker) {
    lifestyleSuggestions.push({
      id: 'life-smoking',
      category: 'lifestyle',
      title: 'Prioritize Structured Smoking Cessation Support',
      whyRelevant: 'Combustion products introduce nicotine and carbon monoxide, promoting endothelial injury, platelet reactivity, and coronary spasm.',
      actionableStep: 'Speak to your healthcare professional about nicotine replacement options, behavioral counseling, and evidence-based cessation pathways.',
      type: 'professional_advice'
    });
  }

  lifestyleSuggestions.push({
    id: 'life-sleep',
    category: 'lifestyle',
    title: 'Maintain 7 to 9 Hours of Restorative Nightly Sleep',
    whyRelevant: 'Disrupted or insufficient sleep elevates sympathetic nervous tone, overnight cortisol, and nocturnal systolic blood pressure.',
    actionableStep: 'Establish a regular bedtime schedule, avoid bright screens 1 hour prior to bed, and maintain a quiet, dark, well-ventilated sleeping environment.',
    type: 'educational'
  });

  lifestyleSuggestions.push({
    id: 'life-stress',
    category: 'lifestyle',
    title: 'Daily Stress Management & Parasympathetic Activation',
    whyRelevant: 'Chronic psychological stress stimulates neurohumoral pathways that exacerbate vascular inflammation and arterial stiffness.',
    actionableStep: 'Practice 10–15 minutes of slow diaphragmatic breathing (4-7-8 method), light yoga, or meditation daily.',
    type: 'educational'
  });

  lifestyleSuggestions.push({
    id: 'life-monitoring',
    category: 'lifestyle',
    title: 'Routine Blood Pressure & Metabolic Follow-Up',
    whyRelevant: `Resting BP is ${input.restingBP} mm Hg and cholesterol is ${input.serumCholesterol} mg/dL. Tracking trends identifies therapeutic response.`,
    actionableStep: 'Log home blood pressure readings in the morning and evening for 7 days before clinical visits. Schedule repeat fasting lipid and HbA1c testing as recommended by your physician.',
    type: 'professional_advice'
  });

  // D. QUESTIONS FOR A HEALTHCARE PROFESSIONAL
  const doctorDiscussionQuestions: string[] = [
    `"Based on my resting systolic blood pressure (${input.restingBP} mm Hg) and total cholesterol (${input.serumCholesterol} mg/dL), what are my target numbers and is medication indicated?"`,
    `"Do my exercise treadmill findings (peak HR ${input.maxHR} bpm, ST depression ${input.stDepression.toFixed(1)} mm) suggest that I should undergo a Coronary CT Angiogram (CCTA) or Coronary Artery Calcium (CAC) scan?"`,
    `"What safe aerobic exercise target heart rate range would you recommend for my physical conditioning?"`,
    input.diabetesDiagnosed || input.fastingBloodSugarOver120 
      ? `"How does my fasting blood glucose (${input.fastingBloodSugar} mg/dL) affect my overall vascular risk, and should we evaluate my HbA1c?"`
      : `"Would an expanded lipoprotein panel, including ApoB or Lp(a), be helpful in clarifying my cardiovascular risk profile?"`
  ];

  return {
    dietSuggestions,
    physicalActivitySuggestions,
    lifestyleSuggestions,
    doctorDiscussionQuestions,
    urgentMedicalAlert,
    disclaimer: 'EDUCATIONAL GUIDANCE ONLY: These personalized suggestions are for cardiovascular health education and risk factor literacy. They do not constitute a medical prescription, dosage adjustment, or clinical treatment plan. Always consult a qualified physician or cardiologist for individualized medical care.'
  };
}
