import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { ResponseMode, Language } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

const cleanOutput = (text: string): string => {
  if (!text) return "";
  return text.replace(/[\$\*\_\#]/g, '').trim();
};

const getLanguageName = (lang: Language): string => {
  switch (lang) {
    case Language.EN: return "English";
    case Language.ES: return "Spanish";
    default: return "Portuguese (Brazil)";
  }
};

export const solveFromImage = async (
  base64Image: string, 
  thinking: boolean = true, 
  mode: ResponseMode = ResponseMode.EXPLAINED,
  language: Language = Language.PT
): Promise<string> => {
  const ai = getAI();
  if (!ai) throw new Error("API Config missing.");

  // Utilizando o modelo Flash Lite para velocidade absoluta em cálculos diretos
  const modelName = 'gemini-flash-lite-latest';
  const langName = getLanguageName(language);
  
  const prompt = mode === ResponseMode.SIMPLE 
    ? `Direct Result ONLY. Language: ${langName}.` 
    : `Short step-by-step (max 2 lines). Language: ${langName}.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: prompt }
        ]
      },
      config: { 
        temperature: 0.0,
        topP: 0.1,
        topK: 1
      }
    });

    return cleanOutput(response.text || "Error");
  } catch (error: any) {
    console.error("Gemini Vision Error:", error);
    throw error;
  }
};

export const chatWithProfessor = async (
  message: string, 
  mode: ResponseMode = ResponseMode.EXPLAINED,
  language: Language = Language.PT
): Promise<string> => {
  const ai = getAI();
  if (!ai) throw new Error("API Config missing.");

  const langName = getLanguageName(language);
  const instruction = mode === ResponseMode.SIMPLE 
    ? `Direct math engine. ONLY result. Answer in ${langName}.` 
    : `STEM professor. Brief solve. Answer in ${langName}.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: message,
      config: {
        systemInstruction: instruction,
        temperature: 0.1
      }
    });

    return cleanOutput(response.text || "Error");
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string): Promise<Uint8Array | null> => {
  try {
    const ai = getAI();
    if (!ai) return null;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
    return null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};