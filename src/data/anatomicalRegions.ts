import { AnatomicalRegionInfo } from '../types/cardiac';

export const ANATOMICAL_REGIONS: Record<string, AnatomicalRegionInfo> = {
  lad: {
    id: 'lad',
    name: 'Left Anterior Descending Artery (LAD)',
    latinName: 'Ramus interventricularis anterior arteriae coronariae sinistrae',
    category: 'vessel',
    coronaryTerritory: 'LAD',
    description: 'The anterior interventricular branch of the left coronary artery, often termed the "widowmaker" due to the high mortality associated with proximal occlusions.',
    clinicalSignificance: 'Supplies approximately 45-55% of the left ventricular myocardium, including the anterolateral wall, apex, and anterior two-thirds of the interventricular septum.',
    supplyTerritory: 'Anterior Left Ventricle, Ventricular Septum, Cardiac Apex',
    associatedRiskFactor: 'Elevated LDL/Total Cholesterol and high systolic arterial shear stress accelerate fibroatheromatous plaque accumulation in this high-flow vessel.'
  },
  rca: {
    id: 'rca',
    name: 'Right Coronary Artery (RCA)',
    latinName: 'Arteria coronaria dextra',
    category: 'vessel',
    coronaryTerritory: 'RCA',
    description: 'Arises from the right aortic sinus of Valsalva and runs along the right atrioventricular coronary groove toward the crux of the heart.',
    clinicalSignificance: 'Supplies the right atrium, right ventricle, Sinoatrial (SA) node in ~60% of individuals, and Atrioventricular (AV) node in ~90% (right-dominant circulation).',
    supplyTerritory: 'Right Ventricle, Inferior Left Ventricle, Sinoatrial & AV Nodes',
    associatedRiskFactor: 'Compromised peak chronotropic response (low maximum exercise heart rate) and inferior ST changes often correlate with RCA territory perfusion abnormalities.'
  },
  lcx: {
    id: 'lcx',
    name: 'Left Circumflex Artery (LCx)',
    latinName: 'Ramus circumflexus arteriae coronariae sinistrae',
    category: 'vessel',
    coronaryTerritory: 'LCx',
    description: 'Branches from the Left Main coronary artery and winds around the left margin of the heart in the atrioventricular groove.',
    clinicalSignificance: 'Supplies the lateral and posterolateral walls of the left ventricle and, in left-dominant systems, the inferior wall and AV node.',
    supplyTerritory: 'Lateral Left Ventricular Myocardium, Left Atrium',
    associatedRiskFactor: 'Microvascular dysfunction associated with chronic diabetes and systemic hypertension.'
  },
  aorta: {
    id: 'aorta',
    name: 'Ascending Aorta & Aortic Arch',
    latinName: 'Aorta ascendens et Arcus aortae',
    category: 'vessel',
    coronaryTerritory: 'General',
    description: 'The primary systemic artery originating from the left ventricle, branching into brachiocephalic, left common carotid, and left subclavian arteries.',
    clinicalSignificance: 'High compliance vessel buffering pulsatile cardiac output (Windkessel effect). Elevated resting pressure leads to arterial stiffness and ventricular remodeling.',
    supplyTerritory: 'Systemic Circulation and Coronary Ostia',
    associatedRiskFactor: 'Elevated resting blood pressure directly increases aortic wall tension, promoting vascular calcification and left ventricular hypertrophy.'
  },
  pulmonary_artery: {
    id: 'pulmonary_artery',
    name: 'Pulmonary Trunk & Arteries',
    latinName: 'Truncus pulmonalis',
    category: 'vessel',
    coronaryTerritory: 'General',
    description: 'Carries deoxygenated blood from the right ventricle to the pulmonary capillary beds for alveolar gas exchange.',
    clinicalSignificance: 'Low-pressure vascular system; elevated resistance indicates pulmonary vascular or left-sided heart failure (elevated wedge pressure).',
    supplyTerritory: 'Pulmonary Alveolar Capillary Bed',
    associatedRiskFactor: 'Impaired functional cardiopulmonary reserve during treadmill stress testing.'
  },
  left_ventricle: {
    id: 'left_ventricle',
    name: 'Left Ventricle',
    latinName: 'Ventriculus sinister cordis',
    category: 'chamber',
    coronaryTerritory: 'LAD',
    description: 'The thickest muscular chamber of the heart, responsible for pumping oxygenated blood throughout the entire systemic circulation.',
    clinicalSignificance: 'Susceptible to concentric hypertrophy in sustained hypertension and subendocardial ischemia during exertional mismatch (manifested as ST depression).',
    supplyTerritory: 'Systemic End-Organs and Brain',
    associatedRiskFactor: 'ST depression (oldpeak) on ECG directly reflects exertional subendocardial ischemia in the thick left ventricular myocardium.'
  },
  right_ventricle: {
    id: 'right_ventricle',
    name: 'Right Ventricle',
    latinName: 'Ventriculus dexter cordis',
    category: 'chamber',
    coronaryTerritory: 'RCA',
    description: 'Crescent-shaped anterior cardiac chamber pumping venous return blood through the pulmonary valve into pulmonary circulation.',
    clinicalSignificance: 'Thin-walled, volume-load responsive chamber perfused primarily via the marginal branches of the Right Coronary Artery.',
    supplyTerritory: 'Pulmonary Vasculature',
    associatedRiskFactor: 'Resting ECG abnormalities and rhythm disturbances.'
  },
  left_atrium: {
    id: 'left_atrium',
    name: 'Left Atrium',
    latinName: 'Atrium sinistrum cordis',
    category: 'chamber',
    coronaryTerritory: 'General',
    description: 'Posterior chamber receiving oxygen-rich blood from four pulmonary veins, contributing active "atrial kick" to late ventricular filling.',
    clinicalSignificance: 'Enlargement in diastolic dysfunction and chronic hypertension predisposes to atrial fibrillation and thromboembolic risk.',
    supplyTerritory: 'Left Ventricle (via Mitral Valve)',
    associatedRiskFactor: 'Chronic elevated left ventricular filling pressures.'
  },
  right_atrium: {
    id: 'right_atrium',
    name: 'Right Atrium & Vena Cava',
    latinName: 'Atrium dextrum et Venae cavae',
    category: 'chamber',
    coronaryTerritory: 'RCA',
    description: 'Receives systemic venous return from Superior Vena Cava (SVC) and Inferior Vena Cava (IVC); houses the primary pacemaking Sinoatrial (SA) node.',
    clinicalSignificance: 'Central venous pressure monitoring location; SA nodal disease leads to chronotropic incompetence.',
    supplyTerritory: 'Right Ventricle (via Tricuspid Valve)',
    associatedRiskFactor: 'Resting bradycardia or chronotropic incompetence during exercise.'
  }
};
