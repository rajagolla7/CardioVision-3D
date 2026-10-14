import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PatientAssessmentInput, PredictionResult } from '../../types/cardiac';
import { ANATOMICAL_REGIONS } from '../../data/anatomicalRegions';
import { 
  Eye, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Activity, 
  Info, 
  Maximize2, 
  ShieldAlert,
  Flame,
  Camera
} from 'lucide-react';

interface ThreeHeartViewerProps {
  patientInput: PatientAssessmentInput;
  predictionResult?: PredictionResult;
  selectedRegionId?: string | null;
  onSelectRegion?: (regionId: string) => void;
  showComparisonOverlay?: boolean;
  comparisonResult?: PredictionResult | null;
  onSnapshotCapture?: (dataUrl: string) => void;
}

export const ThreeHeartViewer: React.FC<ThreeHeartViewerProps> = ({
  patientInput,
  predictionResult,
  selectedRegionId,
  onSelectRegion,
  showComparisonOverlay,
  comparisonResult,
  onSnapshotCapture
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<'heart' | 'torso'>('heart');
  const [pulseActive, setPulseActive] = useState<boolean>(true);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [cameraView, setCameraView] = useState<'front' | 'back' | 'left' | 'right' | 'top'>('front');
  const [snapshotToast, setSnapshotToast] = useState<boolean>(false);

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const heartGroupRef = useRef<THREE.Group | null>(null);
  const torsoGroupRef = useRef<THREE.Group | null>(null);
  const interactiveMeshesRef = useRef<THREE.Mesh[]>([]);
  const isDraggingRef = useRef<boolean>(false);
  const prevMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const targetCameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const cameraDistanceRef = useRef<number>(viewMode === 'heart' ? 4.3 : 11.2);
  const targetCameraDistanceRef = useRef<number>(viewMode === 'heart' ? 4.3 : 11.2);
  const sphericalRef = useRef<{ theta: number; phi: number }>({ theta: 0, phi: Math.PI / 2 });

  // Risk color calculation
  const getRiskColor = (prob: number) => {
    if (prob < 0.35) return { hex: 0x06b6d4, name: 'Minimal / Low', css: '#06b6d4' }; // Cyan
    if (prob < 0.60) return { hex: 0xf59e0b, name: 'Moderate / Borderline', css: '#f59e0b' }; // Amber
    return { hex: 0xef4444, name: 'Elevated / High', css: '#ef4444' }; // Coral/Red
  };

  const currentRisk = predictionResult ? getRiskColor(predictionResult.predictedProbability) : { hex: 0x06b6d4, name: 'Normal Base', css: '#06b6d4' };
  const comparisonRisk = comparisonResult ? getRiskColor(comparisonResult.predictedProbability) : null;

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // SCENE & CAMERA
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060c18); // Deep Navy medical void

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;
    camera.position.set(0, 0.2, cameraDistanceRef.current);

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    // Clear existing canvas
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);
    canvasRef.current = renderer.domElement;

    // LIGHTS
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.6);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    mainKeyLight.position.set(5, 8, 7);
    scene.add(mainKeyLight);

    const rimCyanLight = new THREE.PointLight(0x06b6d4, 2.5, 20);
    rimCyanLight.position.set(-6, -2, -4);
    scene.add(rimCyanLight);

    const fillBlueLight = new THREE.PointLight(0x3b82f6, 1.8, 15);
    fillBlueLight.position.set(4, -4, 4);
    scene.add(fillBlueLight);

    // MESH GROUPS
    const heartGroup = new THREE.Group();
    heartGroupRef.current = heartGroup;
    scene.add(heartGroup);

    const torsoGroup = new THREE.Group();
    torsoGroupRef.current = torsoGroup;
    scene.add(torsoGroup);

    interactiveMeshesRef.current = [];

    // ==========================================
    // PROCEDURAL ANATOMICAL GEOMETRY BUILDER
    // ==========================================

    // Dynamic Risk Material Colors
    const riskHex = showHeatmap ? currentRisk.hex : 0xbe123c;
    const riskSpecular = showHeatmap ? currentRisk.hex : 0xffffff;

    // 1. LEFT VENTRICLE & APEX (Thick muscular cone/ellipsoid)
    const lvGeo = new THREE.SphereGeometry(1.0, 32, 24);
    lvGeo.scale(0.85, 1.25, 0.85);
    const lvMat = new THREE.MeshPhysicalMaterial({
      color: riskHex,
      emissive: riskHex,
      emissiveIntensity: showHeatmap ? 0.35 : 0.08,
      roughness: 0.35,
      metalness: 0.15,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2
    });
    const lvMesh = new THREE.Mesh(lvGeo, lvMat);
    lvMesh.position.set(-0.25, -0.35, 0.1);
    lvMesh.rotation.set(0.15, 0.1, -0.22);
    lvMesh.userData = { regionId: 'left_ventricle', name: 'Left Ventricle' };
    heartGroup.add(lvMesh);
    interactiveMeshesRef.current.push(lvMesh);

    // 2. RIGHT VENTRICLE (Crescent shaped wrap around LV)
    const rvGeo = new THREE.SphereGeometry(0.85, 28, 20);
    rvGeo.scale(0.9, 1.15, 0.75);
    const rvMat = new THREE.MeshPhysicalMaterial({
      color: riskHex,
      emissive: riskHex,
      emissiveIntensity: showHeatmap ? 0.25 : 0.06,
      roughness: 0.4,
      metalness: 0.1
    });
    const rvMesh = new THREE.Mesh(rvGeo, rvMat);
    rvMesh.position.set(0.48, -0.3, 0.25);
    rvMesh.rotation.set(0.1, -0.15, 0.18);
    rvMesh.userData = { regionId: 'right_ventricle', name: 'Right Ventricle' };
    heartGroup.add(rvMesh);
    interactiveMeshesRef.current.push(rvMesh);

    // 3. LEFT ATRIUM
    const laGeo = new THREE.SphereGeometry(0.65, 24, 20);
    const laMat = new THREE.MeshStandardMaterial({
      color: 0x9f1239,
      roughness: 0.5,
      metalness: 0.1
    });
    const laMesh = new THREE.Mesh(laGeo, laMat);
    laMesh.position.set(-0.4, 0.55, -0.25);
    laMesh.userData = { regionId: 'left_atrium', name: 'Left Atrium' };
    heartGroup.add(laMesh);
    interactiveMeshesRef.current.push(laMesh);

    // 4. RIGHT ATRIUM & AURICLE
    const raGeo = new THREE.SphereGeometry(0.7, 24, 20);
    const raMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a, // Venous deep blue hint
      roughness: 0.5,
      metalness: 0.1
    });
    const raMesh = new THREE.Mesh(raGeo, raMat);
    raMesh.position.set(0.65, 0.45, 0.05);
    raMesh.userData = { regionId: 'right_atrium', name: 'Right Atrium' };
    heartGroup.add(raMesh);
    interactiveMeshesRef.current.push(raMesh);

    // 5. ASCENDING AORTA & AORTIC ARCH
    const aortaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.15, 0.2, 0.1),
      new THREE.Vector3(-0.1, 0.85, 0.15),
      new THREE.Vector3(-0.05, 1.4, 0.0),
      new THREE.Vector3(-0.35, 1.55, -0.3),
      new THREE.Vector3(-0.6, 1.1, -0.5)
    ]);
    const aortaGeo = new THREE.TubeGeometry(aortaCurve, 40, 0.26, 16, false);
    const aortaMat = new THREE.MeshPhysicalMaterial({
      color: 0xdc2626,
      emissive: 0xb91c1c,
      emissiveIntensity: 0.2,
      roughness: 0.25,
      metalness: 0.1,
      clearcoat: 0.8
    });
    const aortaMesh = new THREE.Mesh(aortaGeo, aortaMat);
    aortaMesh.userData = { regionId: 'aorta', name: 'Ascending Aorta & Arch' };
    heartGroup.add(aortaMesh);
    interactiveMeshesRef.current.push(aortaMesh);

    // Aortic Branch Arteries (Brachiocephalic, Carotid, Subclavian)
    const branchCurve1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.05, 1.48, 0.0),
      new THREE.Vector3(0.18, 1.85, 0.05)
    ]);
    const branchCurve2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.2, 1.52, -0.1),
      new THREE.Vector3(-0.18, 1.9, -0.1)
    ]);
    const branchCurve3 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.38, 1.5, -0.25),
      new THREE.Vector3(-0.45, 1.86, -0.28)
    ]);
    [branchCurve1, branchCurve2, branchCurve3].forEach((curve) => {
      const branchGeo = new THREE.TubeGeometry(curve, 12, 0.07, 10, false);
      const branchMesh = new THREE.Mesh(branchGeo, aortaMat);
      heartGroup.add(branchMesh);
    });

    // 6. PULMONARY TRUNK & BIFURCATION
    const pulmonaryCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.2, 0.15, 0.35),
      new THREE.Vector3(0.08, 0.7, 0.32),
      new THREE.Vector3(-0.12, 0.95, 0.15)
    ]);
    const pulmonaryGeo = new THREE.TubeGeometry(pulmonaryCurve, 24, 0.22, 16, false);
    const pulmonaryMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7, // Deoxygenated deep cyan/blue
      roughness: 0.3,
      metalness: 0.1
    });
    const pulmonaryMesh = new THREE.Mesh(pulmonaryGeo, pulmonaryMat);
    pulmonaryMesh.userData = { regionId: 'pulmonary_artery', name: 'Pulmonary Trunk' };
    heartGroup.add(pulmonaryMesh);
    interactiveMeshesRef.current.push(pulmonaryMesh);

    // Left and Right Pulmonary Artery Branches
    const pulmLBranch = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.12, 0.95, 0.15),
      new THREE.Vector3(-0.65, 1.05, -0.15)
    ]);
    const pulmRBranch = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.12, 0.95, 0.15),
      new THREE.Vector3(0.55, 0.85, -0.1)
    ]);
    [pulmLBranch, pulmRBranch].forEach(curve => {
      const bGeo = new THREE.TubeGeometry(curve, 12, 0.12, 10, false);
      const bMesh = new THREE.Mesh(bGeo, pulmonaryMat);
      heartGroup.add(bMesh);
    });

    // 7. SUPERIOR VENA CAVA (SVC)
    const svcCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.68, 1.45, -0.1),
      new THREE.Vector3(0.68, 0.75, -0.05)
    ]);
    const svcGeo = new THREE.TubeGeometry(svcCurve, 16, 0.18, 12, false);
    const svcMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.4
    });
    const svcMesh = new THREE.Mesh(svcGeo, svcMat);
    svcMesh.userData = { regionId: 'right_atrium', name: 'Superior Vena Cava' };
    heartGroup.add(svcMesh);

    // 8. CORONARY ARTERY NETWORK (Signature Detail)
    // A: Left Anterior Descending (LAD) Artery
    const ladCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.2, 0.45, 0.35),
      new THREE.Vector3(-0.15, 0.05, 0.65),
      new THREE.Vector3(-0.08, -0.4, 0.68),
      new THREE.Vector3(-0.18, -0.9, 0.48),
      new THREE.Vector3(-0.25, -1.25, 0.2) // To apex
    ]);
    const ladGeo = new THREE.TubeGeometry(ladCurve, 32, 0.065, 10, false);
    const coronaryMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b, // Gold/Amber artery
      emissive: 0xf59e0b,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      clearcoat: 0.9
    });
    const ladMesh = new THREE.Mesh(ladGeo, coronaryMat);
    ladMesh.userData = { regionId: 'lad', name: 'Left Anterior Descending Artery (LAD)' };
    heartGroup.add(ladMesh);
    interactiveMeshesRef.current.push(ladMesh);

    // LAD Diagonals & Septal branches
    const diag1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.12, -0.15, 0.66),
      new THREE.Vector3(-0.45, -0.35, 0.55)
    ]);
    const diag2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.14, -0.65, 0.58),
      new THREE.Vector3(-0.48, -0.85, 0.38)
    ]);
    [diag1, diag2].forEach(curve => {
      const dGeo = new THREE.TubeGeometry(curve, 10, 0.038, 8, false);
      const dMesh = new THREE.Mesh(dGeo, coronaryMat);
      heartGroup.add(dMesh);
    });

    // B: Right Coronary Artery (RCA)
    const rcaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.25, 0.4, 0.3),
      new THREE.Vector3(0.55, 0.1, 0.45),
      new THREE.Vector3(0.68, -0.3, 0.35),
      new THREE.Vector3(0.55, -0.75, 0.15),
      new THREE.Vector3(0.1, -1.05, -0.1) // Marginal / posterior
    ]);
    const rcaGeo = new THREE.TubeGeometry(rcaCurve, 32, 0.065, 10, false);
    const rcaMesh = new THREE.Mesh(rcaGeo, coronaryMat);
    rcaMesh.userData = { regionId: 'rca', name: 'Right Coronary Artery (RCA)' };
    heartGroup.add(rcaMesh);
    interactiveMeshesRef.current.push(rcaMesh);

    // C: Left Circumflex Artery (LCx)
    const lcxCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.25, 0.42, 0.3),
      new THREE.Vector3(-0.6, 0.25, 0.1),
      new THREE.Vector3(-0.75, -0.1, -0.2),
      new THREE.Vector3(-0.55, -0.5, -0.4)
    ]);
    const lcxGeo = new THREE.TubeGeometry(lcxCurve, 24, 0.055, 10, false);
    const lcxMesh = new THREE.Mesh(lcxGeo, coronaryMat);
    lcxMesh.userData = { regionId: 'lcx', name: 'Left Circumflex Artery (LCx)' };
    heartGroup.add(lcxMesh);
    interactiveMeshesRef.current.push(lcxMesh);

    // ==========================================
    // 9. HIGH-FIDELITY ANATOMICAL HUMAN THORAX
    // ==========================================
    // Full human thoracic cavity with Clavicles, Shoulders, Sternum, 10-rib cage, Lungs, Spine, and Diaphragm

    // 9A. CLAVICLES (Collarbones) - Left and Right
    const clavicleMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.25,
      roughness: 0.3,
      metalness: 0.1,
      clearcoat: 0.8
    });

    const clavicleR = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.18, 2.3, 0.9),
      new THREE.Vector3(1.3, 2.35, 0.7),
      new THREE.Vector3(2.6, 2.2, 0.2),
      new THREE.Vector3(3.2, 2.05, -0.1)
    ]);
    const clavicleL = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.18, 2.3, 0.9),
      new THREE.Vector3(-1.3, 2.35, 0.7),
      new THREE.Vector3(-2.6, 2.2, 0.2),
      new THREE.Vector3(-3.2, 2.05, -0.1)
    ]);
    [clavicleR, clavicleL].forEach(curve => {
      const geo = new THREE.TubeGeometry(curve, 20, 0.09, 10, false);
      torsoGroup.add(new THREE.Mesh(geo, clavicleMat));
    });

    // 9B. STERNUM (Manubrium, Sternal Body, Xiphoid Process)
    const sternumCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 2.25, 0.95),
      new THREE.Vector3(0, 1.7, 1.35),
      new THREE.Vector3(0, 0.4, 1.55),
      new THREE.Vector3(0, -0.9, 1.45),
      new THREE.Vector3(0, -1.4, 1.25)
    ]);
    const sternumGeo = new THREE.TubeGeometry(sternumCurve, 28, 0.13, 10, false);
    const sternumMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.3,
      roughness: 0.25,
      clearcoat: 0.9
    });
    torsoGroup.add(new THREE.Mesh(sternumGeo, sternumMat));

    // Manubrium plate
    const manubriumGeo = new THREE.BoxGeometry(0.8, 0.6, 0.12);
    const manubriumMesh = new THREE.Mesh(manubriumGeo, sternumMat);
    manubriumMesh.position.set(0, 2.0, 1.15);
    torsoGroup.add(manubriumMesh);

    // 9C. FULL 10-RIB BILATERAL ANATOMICAL THORACIC CAGE
    const ribPairs: THREE.Vector3[][] = [
      [new THREE.Vector3(0, 2.2, -0.9), new THREE.Vector3(1.1, 2.1, -0.5), new THREE.Vector3(1.4, 2.0, 0.2), new THREE.Vector3(0.5, 2.05, 0.95)],
      [new THREE.Vector3(0, 1.8, -1.0), new THREE.Vector3(1.6, 1.7, -0.4), new THREE.Vector3(2.0, 1.5, 0.4), new THREE.Vector3(0.6, 1.6, 1.3)],
      [new THREE.Vector3(0, 1.4, -1.1), new THREE.Vector3(2.1, 1.3, -0.4), new THREE.Vector3(2.4, 1.1, 0.5), new THREE.Vector3(0.6, 1.1, 1.45)],
      [new THREE.Vector3(0, 1.0, -1.15), new THREE.Vector3(2.4, 0.85, -0.3), new THREE.Vector3(2.6, 0.65, 0.6), new THREE.Vector3(0.6, 0.6, 1.55)],
      [new THREE.Vector3(0, 0.55, -1.2), new THREE.Vector3(2.6, 0.4, -0.3), new THREE.Vector3(2.7, 0.15, 0.7), new THREE.Vector3(0.5, 0.1, 1.55)],
      [new THREE.Vector3(0, 0.1, -1.2), new THREE.Vector3(2.7, -0.1, -0.25), new THREE.Vector3(2.75, -0.35, 0.7), new THREE.Vector3(0.5, -0.4, 1.5)],
      [new THREE.Vector3(0, -0.35, -1.2), new THREE.Vector3(2.7, -0.55, -0.2), new THREE.Vector3(2.7, -0.85, 0.65), new THREE.Vector3(0.5, -0.9, 1.45)],
      [new THREE.Vector3(0, -0.8, -1.15), new THREE.Vector3(2.6, -1.0, -0.2), new THREE.Vector3(2.5, -1.3, 0.55), new THREE.Vector3(0.6, -1.2, 1.2)],
      [new THREE.Vector3(0, -1.25, -1.1), new THREE.Vector3(2.4, -1.45, -0.2), new THREE.Vector3(2.2, -1.7, 0.45), new THREE.Vector3(0.8, -1.45, 1.0)],
      [new THREE.Vector3(0, -1.7, -1.05), new THREE.Vector3(2.1, -1.85, -0.2), new THREE.Vector3(1.8, -2.05, 0.35), new THREE.Vector3(1.0, -1.7, 0.8)]
    ];

    const ribMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.28,
      roughness: 0.3,
      metalness: 0.15,
      transparent: true,
      opacity: 0.88
    });

    ribPairs.forEach((pts) => {
      const curveR = new THREE.CatmullRomCurve3(pts);
      const geomR = new THREE.TubeGeometry(curveR, 20, 0.045, 8, false);
      torsoGroup.add(new THREE.Mesh(geomR, ribMat));

      const ptsL = pts.map(p => new THREE.Vector3(-p.x, p.y, p.z));
      const curveL = new THREE.CatmullRomCurve3(ptsL);
      const geomL = new THREE.TubeGeometry(curveL, 20, 0.045, 8, false);
      torsoGroup.add(new THREE.Mesh(geomL, ribMat));
    });

    // 9D. THORACIC VERTEBRAL SPINE COLUMN
    const spineMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e3a8a,
      roughness: 0.4,
      metalness: 0.2
    });
    for (let i = 0; i < 12; i++) {
      const yPos = 2.4 - i * 0.38;
      const vertGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.22, 12);
      vertGeo.rotateX(Math.PI / 2);
      const vertMesh = new THREE.Mesh(vertGeo, spineMat);
      vertMesh.position.set(0, yPos, -1.15 + (i > 6 ? 0.1 : 0));
      torsoGroup.add(vertMesh);
    }

    // 9E. TRANSLUCENT LUNG LOBES (LEFT WITH CARDIAC NOTCH & RIGHT)
    const lungMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      transmission: 0.9,
      roughness: 0.45,
      transparent: true,
      opacity: 0.16,
      depthWrite: false
    });

    const rightLungGeo = new THREE.SphereGeometry(1.3, 20, 16);
    rightLungGeo.scale(1.0, 1.8, 0.9);
    const rightLungMesh = new THREE.Mesh(rightLungGeo, lungMat);
    rightLungMesh.position.set(1.65, 0.3, 0.1);
    torsoGroup.add(rightLungMesh);

    const leftLungGeo = new THREE.SphereGeometry(1.2, 20, 16);
    leftLungGeo.scale(0.85, 1.75, 0.85);
    const leftLungMesh = new THREE.Mesh(leftLungGeo, lungMat);
    leftLungMesh.position.set(-1.75, 0.45, 0.05);
    torsoGroup.add(leftLungMesh);

    // 9F. DIAPHRAGM DOME CONTOUR
    const diaphragmCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.6, -2.1, 0.2),
      new THREE.Vector3(-1.2, -1.6, 0.5),
      new THREE.Vector3(0, -1.5, 0.6),
      new THREE.Vector3(1.2, -1.6, 0.5),
      new THREE.Vector3(2.6, -2.1, 0.2)
    ]);
    const diaphragmGeo = new THREE.TubeGeometry(diaphragmCurve, 20, 0.06, 8, false);
    const diaphragmMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.3 });
    torsoGroup.add(new THREE.Mesh(diaphragmGeo, diaphragmMat));

    // 9G. HUMAN SHOULDERS & NECK CONTOUR
    const shoulderCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-3.5, 1.9, -0.2),
      new THREE.Vector3(-2.4, 2.3, 0.1),
      new THREE.Vector3(-0.9, 2.9, 0.2),
      new THREE.Vector3(0, 3.1, 0.2),
      new THREE.Vector3(0.9, 2.9, 0.2),
      new THREE.Vector3(2.4, 2.3, 0.1),
      new THREE.Vector3(3.5, 1.9, -0.2)
    ]);
    const shoulderGeo = new THREE.TubeGeometry(shoulderCurve, 30, 0.07, 8, false);
    torsoGroup.add(new THREE.Mesh(shoulderGeo, diaphragmMat));

    // 9H. OUTER HUMAN TORSO GLASS SILHOUETTE
    const torsoOutlineGeo = new THREE.CylinderGeometry(2.8, 2.2, 6.2, 32, 6, true);
    torsoOutlineGeo.scale(1.25, 1.0, 0.8);
    const torsoOutlineMat = new THREE.MeshPhysicalMaterial({
      color: 0x0c4a6e,
      roughness: 0.15,
      transmission: 0.94,
      transparent: true,
      opacity: 0.15,
      wireframe: true
    });
    const torsoOutlineMesh = new THREE.Mesh(torsoOutlineGeo, torsoOutlineMat);
    torsoOutlineMesh.position.set(0, 0.0, 0);
    torsoGroup.add(torsoOutlineMesh);

    // Initial visibility strictly determined by viewMode
    torsoGroup.visible = (viewMode === 'torso');
    cameraDistanceRef.current = viewMode === 'heart' ? 4.3 : 11.2;
    targetCameraDistanceRef.current = cameraDistanceRef.current;
    cameraTargetRef.current.set(0, viewMode === 'heart' ? 0.1 : -0.3, 0);
    targetCameraTargetRef.current.copy(cameraTargetRef.current);

    // Initially position camera
    updateCameraPosition();

    // ==========================================
    // RAYCASTER FOR INTERACTIVE HOVER / CLICK
    // ==========================================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshesRef.current);

      if (intersects.length > 0) {
        const topHit = intersects[0].object as THREE.Mesh;
        const regId = topHit.userData.regionId;
        setHoveredRegion(regId || null);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setHoveredRegion(null);
        renderer.domElement.style.cursor = 'default';
      }
    };

    const onPointerDown = (e: MouseEvent) => {
      // Check if clicking on an interactive mesh
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshesRef.current);
      if (intersects.length > 0 && onSelectRegion) {
        const regId = intersects[0].object.userData.regionId;
        if (regId) onSelectRegion(regId);
      }

      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    const onDragMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - prevMouseRef.current.x;
      const dy = e.clientY - prevMouseRef.current.y;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };

      sphericalRef.current.theta -= dx * 0.008;
      sphericalRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, sphericalRef.current.phi - dy * 0.008));
      updateCameraPosition();
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
      cameraDistanceRef.current = Math.max(2.5, Math.min(14.0, cameraDistanceRef.current * zoomFactor));
      updateCameraPosition();
    };

    renderer.domElement.addEventListener('mousemove', onPointerMove);
    renderer.domElement.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('mousemove', onDragMove);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // ==========================================
    // ANIMATION & HEARTBEAT PULSATION LOOP
    // ==========================================
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const bpm = patientInput.restingHR || 72;
    const pulseFrequency = (bpm / 60) * Math.PI * 2;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Cardiac systole-diastole pulsation wave
      if (heartGroupRef.current && pulseActive) {
        // Dual-phase pulse equation (sharp systole, relaxed diastole)
        const phase = (elapsedTime * (bpm / 60)) % 1.0;
        let scale = 1.0;
        if (phase < 0.18) {
          scale = 1.0 + Math.sin(phase * Math.PI / 0.18) * 0.07;
        } else if (phase < 0.38) {
          scale = 1.0 + Math.sin((phase - 0.18) * Math.PI / 0.2) * 0.04;
        } else {
          scale = 1.0;
        }
        heartGroupRef.current.scale.set(scale, scale, scale);
      }

      // Gentle rotation when not user-dragging
      if (!isDraggingRef.current && heartGroupRef.current) {
        heartGroupRef.current.rotation.y += 0.0012;
        torsoGroup.rotation.y = heartGroupRef.current.rotation.y;
      }

      // Smooth camera transition (lerp) towards target distance and target lookAt point
      if (Math.abs(cameraDistanceRef.current - targetCameraDistanceRef.current) > 0.01) {
        cameraDistanceRef.current += (targetCameraDistanceRef.current - cameraDistanceRef.current) * 0.1;
        cameraTargetRef.current.lerp(targetCameraTargetRef.current, 0.1);
        updateCameraPosition();
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = newW / newH;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('mousemove', onPointerMove);
        renderer.domElement.removeEventListener('mousedown', onPointerDown);
        renderer.domElement.removeEventListener('wheel', onWheel);
      }
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('mousemove', onDragMove);
      renderer.dispose();
    };
  }, [patientInput, predictionResult?.predictedProbability, showHeatmap, pulseActive]);

  // Update camera coordinates from spherical
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi } = sphericalRef.current;
    const dist = cameraDistanceRef.current;
    const x = dist * Math.sin(phi) * Math.sin(theta);
    const y = dist * Math.cos(phi);
    const z = dist * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(cameraTargetRef.current);
  };

  // Presets
  const setPresetAngle = (view: 'front' | 'back' | 'left' | 'right' | 'top') => {
    setCameraView(view);
    if (!cameraRef.current) return;
    switch (view) {
      case 'front':
        sphericalRef.current = { theta: 0, phi: Math.PI / 2 };
        break;
      case 'back':
        sphericalRef.current = { theta: Math.PI, phi: Math.PI / 2 };
        break;
      case 'left':
        sphericalRef.current = { theta: -Math.PI / 2, phi: Math.PI / 2 };
        break;
      case 'right':
        sphericalRef.current = { theta: Math.PI / 2, phi: Math.PI / 2 };
        break;
      case 'top':
        sphericalRef.current = { theta: 0, phi: 0.15 };
        break;
    }
    updateCameraPosition();
  };

  // Toggle View Mode (Heart focus vs Torso context)
  const toggleViewMode = (mode: 'heart' | 'torso') => {
    setViewMode(mode);
    if (mode === 'heart') {
      targetCameraDistanceRef.current = 4.6;
      targetCameraTargetRef.current.set(0, 0.1, 0);
      if (torsoGroupRef.current) torsoGroupRef.current.visible = false;
    } else {
      targetCameraDistanceRef.current = 10.8;
      targetCameraTargetRef.current.set(0, -0.3, 0);
      if (torsoGroupRef.current) torsoGroupRef.current.visible = true;
    }
  };

  // Zoom & Reset camera actions
  const handleZoomIn = () => {
    targetCameraDistanceRef.current = Math.max(2.2, cameraDistanceRef.current * 0.82);
  };

  const handleZoomOut = () => {
    targetCameraDistanceRef.current = Math.min(13.5, cameraDistanceRef.current * 1.18);
  };

  const handleResetCamera = () => {
    sphericalRef.current = { theta: 0, phi: Math.PI / 2 };
    targetCameraDistanceRef.current = viewMode === 'heart' ? 4.6 : 10.8;
    targetCameraTargetRef.current.set(0, viewMode === 'heart' ? 0.1 : -0.3, 0);
    setCameraView('front');
    updateCameraPosition();
  };

  // Capture snapshot for PDF report
  const handleCaptureSnapshot = () => {
    if (rendererRef.current) {
      const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
      if (onSnapshotCapture) {
        onSnapshotCapture(dataUrl);
      }
      setSnapshotToast(true);
      setTimeout(() => setSnapshotToast(false), 3000);
    }
  };

  // Selected region details
  const activeRegion = selectedRegionId ? ANATOMICAL_REGIONS[selectedRegionId] : hoveredRegion ? ANATOMICAL_REGIONS[hoveredRegion] : null;

  return (
    <div className="relative w-full h-[540px] md:h-[620px] rounded-2xl overflow-hidden border border-sky-900/40 bg-gradient-to-b from-slate-950 via-[#071122] to-slate-950 shadow-2xl flex flex-col">
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* TOP HEADER CONTROLS BAR */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: View Mode Toggle & Status */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex bg-slate-900/85 backdrop-blur-md p-1 rounded-xl border border-sky-500/20 shadow-lg text-xs font-medium">
            <button
              onClick={() => toggleViewMode('heart')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'heart'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Heart Focus
            </button>
            <button
              onClick={() => toggleViewMode('torso')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'torso'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Torso Context
            </button>
          </div>

          {/* Active View Perspective Explanatory Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/85 border border-sky-500/20 text-[11px] text-slate-300 backdrop-blur-md shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            <span className="font-semibold text-sky-300">
              {viewMode === 'heart' ? 'Camera: Magnified Coronaries (LAD/RCA/LCx)' : 'Camera: Thoracic Rib Cage & Cardiopulmonary Context'}
            </span>
          </div>

          {/* Pulse Rhythm Button */}
          <button
            onClick={() => setPulseActive(!pulseActive)}
            title="Toggle cardiac contraction rhythm"
            className={`pointer-events-auto px-2.5 py-1.5 rounded-xl border text-xs font-medium backdrop-blur-md transition-all flex items-center gap-1.5 shadow-lg ${
              pulseActive
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : 'bg-slate-900/80 border-slate-700/60 text-slate-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${pulseActive ? 'bg-rose-500 animate-ping' : 'bg-slate-500'}`} />
            {patientInput.restingHR} BPM
          </button>
        </div>

        {/* Right: Camera Angles & Snapshot */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <div className="bg-slate-900/85 backdrop-blur-md p-1 rounded-xl border border-sky-500/20 shadow-lg flex items-center gap-1 text-xs">
            <button
              onClick={() => setPresetAngle('front')}
              className={`px-2 py-1 rounded-md transition-all ${cameraView === 'front' ? 'bg-sky-500/25 text-sky-300 font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              Anterior
            </button>
            <button
              onClick={() => setPresetAngle('left')}
              className={`px-2 py-1 rounded-md transition-all ${cameraView === 'left' ? 'bg-sky-500/25 text-sky-300 font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              Left (LAD)
            </button>
            <button
              onClick={() => setPresetAngle('right')}
              className={`px-2 py-1 rounded-md transition-all ${cameraView === 'right' ? 'bg-sky-500/25 text-sky-300 font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              Right (RCA)
            </button>
            <button
              onClick={() => setPresetAngle('back')}
              className={`px-2 py-1 rounded-md transition-all ${cameraView === 'back' ? 'bg-sky-500/25 text-sky-300 font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              Posterior
            </button>
          </div>

          {/* Tactile Zoom & Reset Buttons */}
          <div className="bg-slate-900/85 backdrop-blur-md p-1 rounded-xl border border-sky-500/20 shadow-lg flex items-center gap-0.5 text-xs">
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetCamera}
              title="Reset Camera Angle"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleCaptureSnapshot}
            title="Capture 3D Snapshot for Report"
            className="p-2 rounded-xl bg-slate-900/85 border border-sky-500/20 text-slate-300 hover:text-sky-300 hover:border-sky-400/40 backdrop-blur-md shadow-lg transition-all"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SNAPSHOT CAPTURE TOAST */}
      {snapshotToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-sky-500 text-slate-950 px-4 py-1.5 rounded-xl font-bold text-xs shadow-xl animate-fadeIn flex items-center gap-2 pointer-events-none">
          <Camera className="w-3.5 h-3.5" />
          <span>3D Anatomical Snapshot Captured for PDF Report!</span>
        </div>
      )}

      {/* FLOATING RISK HEATMAP LEGEND (ACCESSIBLE & COMPLIANT) */}
      <div className="absolute top-16 left-3 pointer-events-auto max-w-[280px]">
        <div className="bg-slate-950/90 backdrop-blur-md p-3 rounded-xl border border-sky-500/25 shadow-xl text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
              <Flame className="w-3.5 h-3.5 text-sky-400" />
              <span>Statistical Risk Heatmap</span>
            </div>
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className="text-[10px] text-sky-400 hover:underline cursor-pointer"
            >
              {showHeatmap ? 'Hide Glow' : 'Show Glow'}
            </button>
          </div>

          <div className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
            Conceptual Illustrative Overlay (Not Actual Plaque)
          </div>

          {/* Current Category Pill */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 text-[11px]">Estimated Level:</span>
            <span 
              className="font-bold uppercase tracking-wider text-[11px] px-2 py-0.5 rounded"
              style={{ backgroundColor: `${currentRisk.css}22`, color: currentRisk.css, border: `1px solid ${currentRisk.css}55` }}
            >
              {currentRisk.name}
            </span>
          </div>

          {/* Probability Bar */}
          {predictionResult && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Model Output:</span>
                <span className="font-mono text-white font-bold">{(predictionResult.predictedProbability * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden flex">
                <div 
                  className="h-full transition-all duration-700" 
                  style={{ width: `${predictionResult.predictedProbability * 100}%`, backgroundColor: currentRisk.css }} 
                />
              </div>
            </div>
          )}

          {/* Medical Compliance Note */}
          <div className="text-[9px] text-slate-400 leading-tight border-t border-slate-800/80 pt-1.5 space-y-1">
            <div className="flex items-start gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Illustrative Conceptual Overlay:</strong> Color mapping (Cyan: &lt;35% Low, Amber: 35–59% Mod, Red: &ge;60% Elevated) reflects multivariate statistical score from clinical inputs. Does NOT depict actual coronary plaque, stenosis percentage, or mechanical blockages.
              </span>
            </div>
            <div className="flex items-start gap-1 text-sky-300/80">
              <Info className="w-3 h-3 text-sky-400 shrink-0 mt-0.5" />
              <span>Data source: UCI referral cohort benchmark model. Heart Focus &amp; Torso Context adjust 3D camera framing; both reflect the same patient risk calculation.</span>
            </div>
          </div>
        </div>
      </div>

      {/* WHAT-IF COMPARISON OVERLAY CARD (WHEN ACTIVE) */}
      {showComparisonOverlay && comparisonResult && (
        <div className="absolute top-16 right-3 pointer-events-auto max-w-[270px]">
          <div className="bg-slate-950/95 backdrop-blur-md p-3 rounded-xl border border-emerald-500/30 shadow-2xl text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Hypothetical Simulation Mode
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-center pt-1">
              <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400">Baseline</div>
                <div className="font-mono font-bold text-white">
                  {predictionResult ? `${(predictionResult.predictedProbability * 100).toFixed(0)}%` : '--'}
                </div>
              </div>
              <div className="p-1.5 rounded bg-emerald-950/50 border border-emerald-500/40">
                <div className="text-[10px] text-emerald-300">Scenario</div>
                <div className="font-mono font-bold text-emerald-400">
                  {(comparisonResult.predictedProbability * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-300">
              Delta: <span className={comparisonResult.predictedProbability < (predictionResult?.predictedProbability || 0) ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {((comparisonResult.predictedProbability - (predictionResult?.predictedProbability || 0)) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM ANATOMICAL INSPECTOR PANEL */}
      <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
        <div className="bg-slate-950/92 backdrop-blur-md p-3.5 rounded-xl border border-sky-500/25 shadow-2xl pointer-events-auto">
          {activeRegion ? (
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
                  <h4 className="font-bold text-sky-300 text-sm">{activeRegion.name}</h4>
                  <span className="text-[10px] font-mono text-slate-400 italic">({activeRegion.latinName})</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-950 text-sky-300 border border-sky-800/60 uppercase tracking-wider font-semibold">
                  {activeRegion.category}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs pt-1">
                <div className="text-slate-300">
                  <strong className="text-slate-100">Anatomy: </strong>
                  {activeRegion.description}
                </div>
                <div className="text-slate-300">
                  <strong className="text-sky-200">Perfusion Territory: </strong>
                  {activeRegion.supplyTerritory || 'Systemic circulation'}
                </div>
                <div className="text-slate-300 bg-sky-950/40 p-1.5 rounded border border-sky-800/40">
                  <strong className="text-amber-300">Clinical Correlation: </strong>
                  {activeRegion.associatedRiskFactor}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-sky-400" />
                <span>Hover or click any coronary vessel (LAD, RCA, LCx), aortic arch, or ventricular chamber to inspect anatomy and risk correlations.</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Rotate: Left-Click Drag | Zoom: Scroll</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
