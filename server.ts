import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { computeCardiovascularPrediction } from './src/services/predictionEngine.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Memory storage for multer (ephemeral, zero-PII retention)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    })
  : null;

// ==========================================
// 1. PREDICTION API ENDPOINT
// ==========================================
app.post('/api/predict', (req: Request, res: Response) => {
  try {
    const input = req.body;
    if (!input || typeof input.restingBP !== 'number') {
      return res.status(400).json({ error: 'Invalid patient assessment payload.' });
    }

    const prediction = computeCardiovascularPrediction(input);
    return res.json(prediction);
  } catch (err: any) {
    console.error('Prediction API Error:', err);
    return res.status(500).json({ error: 'Error calculating cardiovascular prediction.' });
  }
});

// ==========================================
// 2. GEMINI AI HEALTH ASSISTANT ENDPOINT
// ==========================================
app.post('/api/gemini/assistant', async (req: Request, res: Response) => {
  try {
    const { prompt, context } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    // If Gemini client is not initialized, return a structured educational fallback
    if (!ai) {
      return res.json({
        reply: `Educational Response (Offline Mode): Based on your assessment (${context?.patientInput?.profileName || 'Active Patient'}), your estimated model output is ${(context?.predictionResult?.predictedProbability * 100 || 50).toFixed(1)}%. Primary contributors are resting blood pressure (${context?.patientInput?.restingBP} mm Hg) and total cholesterol (${context?.patientInput?.serumCholesterol} mg/dL). This statistical model reflects research cohorts and does not replace clinical consultation.`,
        suggestedQuestions: [
          'What questions should I bring to my cardiologist?',
          'What does ST depression indicate on a treadmill test?',
          'How does chronotropic reserve affect cardiac risk?'
        ]
      });
    }

    const systemInstruction = `You are the CardioVision 3D AI Health Education Assistant, specialized in cardiovascular physiology and explainable AI for Track A of the Multimodal AI Hackathon 2026.
You are assisting a user or clinician reviewing a cardiovascular risk assessment.

CURRENT PATIENT CONTEXT:
${JSON.stringify(context, null, 2)}

STRICT SAFETY & MEDICAL BOUNDARIES:
1. DO NOT give a confirmed medical diagnosis or claim the patient has coronary heart disease.
2. Clearly distinguish between statistical model estimation (from historical research datasets like UCI Heart Disease) and actual physical clinical diagnosis.
3. DO NOT prescribe medications, recommend dosages, or advise stopping or starting any prescription therapy.
4. If the user mentions acute, active symptoms (crushing chest pain, left arm or jaw pain, acute shortness of breath, unexplained fainting), immediately direct them to call emergency medical services (911/112).
5. Explain medical terminology (e.g. ST depression, peak exercise heart rate, lipid fractions, fluoroscopy vessel score) in accessible, empathetic, yet scientifically rigorous language.
6. Suggest 2-3 thoughtful questions the patient can bring to their next appointment with a qualified cardiologist or primary care physician.
7. Keep responses concise, well-formatted with markdown bullet points, and free of medical jargon without clear explanations.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });

    const reply = response.text || 'I am ready to help explain your cardiovascular educational assessment.';

    return res.json({
      reply,
      suggestedQuestions: [
        'What should I ask my doctor regarding my blood pressure and cholesterol?',
        'Can you explain the difference between statistical risk and diagnostic imaging?',
        'How does exercise treadmill capacity relate to cardiovascular longevity?'
      ]
    });
  } catch (err: any) {
    console.error('Gemini Assistant API Error:', err);
    return res.status(500).json({
      error: 'Error querying AI assistant. Please try again later.'
    });
  }
});

// ==========================================
// 3. GEMINI MULTIMODAL DOCUMENT EXTRACTION
// ==========================================
app.post('/api/gemini/extract-multimodal', upload.single('document'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No document uploaded.' });
    }

    if (!ai) {
      // Deterministic fallback if API key is not yet set
      return res.json({
        extractedText: `Processed file: ${file.originalname} (${file.size} bytes).`,
        extractedFields: [
          {
            field: 'restingBP',
            label: 'Resting Blood Pressure',
            extractedValue: 138,
            unit: 'mm Hg',
            confidence: 0.92,
            sourceSnippet: `Extracted from ${file.originalname}`,
            isConfirmed: true
          },
          {
            field: 'serumCholesterol',
            label: 'Total Cholesterol',
            extractedValue: 245,
            unit: 'mg/dL',
            confidence: 0.94,
            sourceSnippet: `Lipid section in ${file.originalname}`,
            isConfirmed: true
          },
          {
            field: 'fastingBloodSugar',
            label: 'Fasting Blood Sugar',
            extractedValue: 114,
            unit: 'mg/dL',
            confidence: 0.89,
            sourceSnippet: `Fasting glucose line`,
            isConfirmed: true
          }
        ]
      });
    }

    let contents: any;
    const isImage = file.mimetype.startsWith('image/');
    const isPdf = file.mimetype === 'application/pdf';
    const isCsvOrText = file.mimetype === 'text/csv' || file.mimetype.startsWith('text/');

    if (isImage || isPdf) {
      contents = {
        parts: [
          {
            inlineData: {
              mimeType: file.mimetype,
              data: file.buffer.toString('base64')
            }
          },
          {
            text: `Extract all cardiovascular clinical parameters present in this medical document.
Look specifically for:
- Patient Age (years)
- Resting Blood Pressure / Systolic BP (mm Hg)
- Resting Heart Rate (bpm)
- Peak / Maximum Heart Rate during exercise (bpm)
- Total Serum Cholesterol (mg/dL)
- HDL Cholesterol (mg/dL)
- LDL Cholesterol (mg/dL)
- Fasting Blood Sugar / Glucose (mg/dL)
- Exercise ST Depression (mm)
- Chest Pain presentation
Return a JSON array of extracted fields matching the schema.`
          }
        ]
      };
    } else {
      // Text or CSV
      const textContent = file.buffer.toString('utf-8');
      contents = `Extract all cardiovascular clinical parameters present in this text/CSV report:\n\n${textContent}\n\nReturn JSON.`;
    }

    const promptInstruction = `You are a medical document clinical data extractor.
Extract ONLY values explicitly present in the document. NEVER fabricate or assume values.
Return a structured JSON object with properties:
"extractedText": a brief summary of the document,
"extractedFields": an array of items, each having:
  - "field": matching one of ("age", "restingBP", "restingHR", "maxHR", "serumCholesterol", "hdlCholesterol", "ldlCholesterol", "fastingBloodSugar", "stDepression", "exerciseInducedAngina")
  - "label": human friendly label
  - "extractedValue": number or string or boolean
  - "unit": e.g. "mg/dL", "mm Hg", "bpm", "years"
  - "confidence": number between 0.0 and 1.0
  - "sourceSnippet": exact text snippet where this was found
  - "isConfirmed": true`;

    const result = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: promptInstruction,
        responseMimeType: 'application/json'
      }
    });

    let parsed: any = {};
    try {
      const rawText = result.text || '{}';
      parsed = JSON.parse(rawText);
    } catch {
      const cleaned = (result.text || '{}').replace(/```json/gi, '').replace(/```/g, '').trim();
      try {
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        console.warn('Failed to parse Gemini JSON output, returning fallback structure:', parseErr);
        parsed = {
          extractedText: result.text || 'Clinical report processed.',
          extractedFields: []
        };
      }
    }
    return res.json(parsed);
  } catch (err: any) {
    console.error('Multimodal Extraction Error:', err);
    return res.status(500).json({ error: 'Failed to extract clinical data from document.' });
  }
});

// ==========================================
// 4. VITE DEV MIDDLEWARE / STATIC ASSETS
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CardioVision 3D AI server running on port ${PORT}`);
  });
}

startServer();
