import React, { useState, useRef, useEffect } from 'react';
import { 
  PatientAssessmentInput, 
  PredictionResult, 
  AssistantMessage 
} from '../../types/cardiac';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  AlertTriangle, 
  User, 
  RefreshCcw, 
  PhoneCall, 
  HelpCircle,
  CheckCircle2,
  Stethoscope,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { 
  isSpeechRecognitionSupported, 
  SpeechPlayerController 
} from '../../services/speechService';

interface AiHealthAssistantProps {
  patientInput: PatientAssessmentInput;
  predictionResult: PredictionResult;
}

export const AiHealthAssistant: React.FC<AiHealthAssistantProps> = ({
  patientInput,
  predictionResult
}) => {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Hello! I am CardioVision AI's Health Education Assistant. I can help explain your statistical model estimates, clarify cardiovascular terms (such as ST depression, chronotropic reserve, or lipid ratios), and suggest informed questions to discuss with your physician.\n\nCurrently reviewing: **${patientInput.profileName || 'Active Patient Profile'}** with an estimated model score of **${(predictionResult.predictedProbability * 100).toFixed(1)}% (${predictionResult.riskCategory} risk tier)**.\n\nHow can I help explain this data today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedQuestions: [
        'What does my ST depression measurement mean?',
        'Why does peak exercise heart rate lower my risk estimate?',
        'What is the difference between this model and a clinical diagnosis?',
        'What questions should I ask my cardiologist about these results?'
      ]
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const speechPlayerRef = useRef<SpeechPlayerController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    speechPlayerRef.current = new SpeechPlayerController((state) => {
      if (!state.isSpeaking) {
        setSpeakingMessageId(null);
      }
    });

    return () => {
      speechPlayerRef.current?.stop();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const handleToggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      alert('Speech recognition is not supported in this browser. Please type your question.');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognitionRef.current = recognition;
      setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputPrompt(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleToggleSpeakMessage = (msgId: string, content: string) => {
    if (speakingMessageId === msgId) {
      speechPlayerRef.current?.stop();
      setSpeakingMessageId(null);
    } else {
      speechPlayerRef.current?.stop();
      setSpeakingMessageId(msgId);
      // Clean markdown tags for natural speech
      const plainText = content.replace(/[*_#`[\]]/g, '').replace(/https?:\/\/\S+/g, '');
      speechPlayerRef.current?.speak(plainText);
    }
  };

  // Urgent symptom check client-side filter
  const detectEmergencyKeywords = (text: string): boolean => {
    const keywords = ['crushing chest pain', 'chest pressure right now', 'shortness of breath at rest', 'radiating to jaw', 'left arm pain', 'fainting', 'passed out', 'emergency', 'heart attack right now'];
    return keywords.some(k => text.toLowerCase().includes(k));
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || isLoading) return;

    const isEmergency = detectEmergencyKeywords(text);

    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputPrompt('');
    setIsLoading(true);

    if (isEmergency) {
      setTimeout(() => {
        const emergencyReply: AssistantMessage = {
          id: `emergency-${Date.now()}`,
          role: 'assistant',
          isEmergencyAlert: true,
          content: `🚨 **URGENT MEDICAL NOTICE**: You described acute symptoms that may indicate an active cardiovascular emergency (such as myocardial infarction or unstable angina).\n\n**DO NOT RELY ON THIS COMPUTER MODEL.** Please call emergency services (**911 in the US/Canada**, **112 in Europe**, or your local emergency number) immediately or proceed to the nearest emergency department. Have someone assist you and do not drive yourself.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedQuestions: [
            'What are the typical signs of an acute cardiac emergency?',
            'What should someone do while waiting for emergency services?'
          ]
        };
        setMessages(prev => [...prev, emergencyReply]);
        setIsLoading(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          context: {
            patientInput,
            predictionResult: {
              predictedProbability: predictionResult.predictedProbability,
              riskCategory: predictionResult.riskCategory,
              calibratedScore: predictionResult.calibratedScore,
              featureContributions: predictionResult.featureContributions.slice(0, 5),
              modelName: predictionResult.modelName
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: AssistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'I am ready to assist with your educational questions.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedQuestions: data.suggestedQuestions || [
          'Can you break down my top contributing factors?',
          'What lifestyle habits support coronary arterial elasticity?',
          'What are the dataset limitations of this model?'
        ]
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.warn('Gemini server call failed, using intelligent educational fallback response:', err);
      // Clean educational fallback
      const fallbackReply: AssistantMessage = {
        id: `assistant-fallback-${Date.now()}`,
        role: 'assistant',
        content: generateEducationalFallback(text, patientInput, predictionResult),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedQuestions: [
          'What questions should I bring to my next physical examination?',
          'How does blood pressure affect arterial wall shear stress?'
        ]
      };
      setMessages(prev => [...prev, fallbackReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateEducationalFallback = (
    prompt: string,
    input: PatientAssessmentInput,
    res: PredictionResult
  ): string => {
    const p = prompt.toLowerCase();
    if (p.includes('st depression') || p.includes('oldpeak')) {
      return `**Exercise ST Depression (${input.stDepression} mm):**\nDuring a treadmill stress test, your ECG records the electrical activity of the heart muscle. When heart muscle experiences relative oxygen insufficiency under physical exertion, the ST segment on the ECG often depresses below the baseline. In the UCI model, values greater than 1.0 mm are weighted towards higher probability of coronary flow limitation.`;
    }
    if (p.includes('heart rate') || p.includes('thalach') || p.includes('peak')) {
      return `**Peak Exercise Heart Rate (${input.maxHR} bpm):**\nIn treadmill testing, the maximum heart rate achieved reflects 'chronotropic reserve' and overall cardiopulmonary fitness. In cardiovascular risk models like the UCI dataset, higher peak exercise heart rates correlate with lower mortality and lower probability of significant obstructive coronary disease.`;
    }
    if (p.includes('doctor') || p.includes('physician') || p.includes('questions')) {
      return `**Recommended Questions for Your Healthcare Provider:**\n1. *"Given my resting systolic blood pressure (${input.restingBP} mm Hg) and cholesterol (${input.serumCholesterol} mg/dL), what is my clinical 10-year ASCVD risk?"*\n2. *"Would an imaging study such as a Coronary Artery Calcium (CAC) scan provide clearer diagnostic clarity?"*\n3. *"What target LDL or non-HDL cholesterol level should we aim for based on modern guidelines?"*`;
    }
    return `**Educational Insight on Your Assessment:**\nYour current statistical estimate is **${(res.predictedProbability * 100).toFixed(1)}%**, placing you in the **${res.riskCategory}** model tier. The primary factors influencing this calculation are your resting systolic blood pressure (${input.restingBP} mm Hg), serum cholesterol (${input.serumCholesterol} mg/dL), and treadmill exercise response. This estimate is an educational tool based on historical research cohorts, not a clinical diagnosis or treatment prescription.`;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER */}
      <div className="glass-panel p-6 rounded-3xl border border-sky-500/25">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
                <Bot className="w-5 h-5" />
              </span>
              <h2 className="text-2xl font-extrabold text-white">AI Health Education Assistant</h2>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl">
              Server-side conversational agent powered by Gemini 3.8 Flash. Explains model terminology, contextualizes feature contributions, and suggests meaningful discussions for your next clinical appointment.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/90 px-3.5 py-2 rounded-2xl border border-slate-800 shrink-0">
            <Stethoscope className="w-4 h-4 text-emerald-400" />
            <span>Strict Medical Safety Protocols Active</span>
          </div>
        </div>
      </div>

      {/* EMERGENCY SYMPTOMS WARNING BANNER */}
      <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PhoneCall className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
          <div>
            <strong className="text-white">Emergency Triage Notice: </strong>
            <span>If you are experiencing severe chest pain, radiating arm/jaw discomfort, sudden shortness of breath, or dizziness, call emergency medical services immediately. Do not rely on risk assessment tools for acute symptoms.</span>
          </div>
        </div>
      </div>

      {/* CHAT CONTAINER */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-sky-500/20 flex flex-col h-[560px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}>
                <div className={`flex items-start gap-2.5 max-w-[85%] sm:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : msg.isEmergencyAlert
                      ? 'bg-rose-500 text-white font-bold animate-pulse'
                      : 'bg-slate-800 text-sky-400 border border-sky-500/30'
                  }`}>
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-lg ${
                    isUser
                      ? 'bg-sky-500 text-slate-950 font-medium rounded-tr-none'
                      : msg.isEmergencyAlert
                      ? 'bg-rose-950/80 text-rose-100 border border-rose-500/60 rounded-tl-none'
                      : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    
                    {isUser ? (
                      <span className="block text-[10px] mt-2 font-mono text-slate-900/70 text-right">
                        {msg.timestamp}
                      </span>
                    ) : (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60">
                        <span className="text-[10px] font-mono text-slate-500">
                          {msg.timestamp}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleSpeakMessage(msg.id, msg.content)}
                          className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                            speakingMessageId === msg.id
                              ? 'bg-sky-500/20 text-sky-300 font-semibold'
                              : 'text-slate-400 hover:text-sky-300'
                          }`}
                        >
                          {speakingMessageId === msg.id ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                              <span>Stop Voice</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Suggested Questions Pills */}
                {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && !isUser && (
                  <div className="flex flex-wrap gap-1.5 pl-10 max-w-[85%]">
                    {msg.suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(q)}
                        className="text-[11px] px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-sky-950/70 text-sky-300 hover:text-white border border-sky-500/20 hover:border-sky-400/40 transition-all text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-sky-400 bg-slate-900/80 p-3 rounded-2xl w-fit border border-slate-800">
              <Sparkles className="w-4 h-4 animate-spin text-sky-400" />
              <span>CardioVision AI is reviewing clinical documentation...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={isListening ? "Listening... speak now" : "Ask about your cholesterol, ST depression, or what to discuss with your doctor..."}
              className={`flex-1 bg-slate-900 border rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                isListening ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-slate-700 focus:border-sky-400'
              }`}
            />

            {/* Mic Speech Input Button */}
            <button
              type="button"
              onClick={handleToggleVoiceInput}
              title={isListening ? 'Stop listening' : 'Speak your question'}
              className={`p-3 rounded-2xl border transition-all shrink-0 cursor-pointer flex items-center justify-center ${
                isListening
                  ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 animate-pulse'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-sky-400 hover:border-sky-500/40'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-sky-500/25 hover:scale-105 disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
          <p className="text-[10px] text-slate-500 text-center mt-2">
            CardioVision AI provides health education only. Never discontinue or adjust prescription therapies without clinical supervision.
          </p>
        </div>
      </div>
    </div>
  );
};
