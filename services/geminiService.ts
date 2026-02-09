
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { ResponseMode } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

const cleanOutput = (text: string): string => {
  if (!text) return "";
  return text.replace(/[\$\*\_\#]/g, '').trim();
};

export const solveFromImage = async (
  base64Image: string, 
  thinking: boolean = true, 
  mode: ResponseMode = ResponseMode.EXPLAINED
): Promise<string> => {
  const ai = getAI();
  if (!ai) throw new Error("API Config missing.");

  const modelName = 'gemini-3-flash-preview';
  
  const prompt = mode === ResponseMode.SIMPLE 
    ? "Solve the math problem in the image. Give ONLY the final result. No symbols or markdown. Translate result to local language if applicable." 
    : "Solve the math problem. Explain step-by-step briefly (max 3 lines). No markdown. Answer in the same language as the UI.";

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: prompt }
        ]
      },
      config: { temperature: 0.2 }
    });

    return cleanOutput(response.text || "Error");
  } catch (error: any) {
    console.error("Gemini Vision Error:", error);
    throw error;
  }
};

export const chatWithProfessor = async (
  message: string, 
  mode: ResponseMode = ResponseMode.EXPLAINED
): Promise<string> => {
  const ai = getAI();
  if (!ai) throw new Error("API Config missing.");

  const instruction = mode === ResponseMode.SIMPLE 
    ? 'You are a direct math professor. Give ONLY the result without explanation.' 
    : 'You are a STEM professor. Solve and explain briefly without markdown symbols. Respond in the user\'s language.';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction: instruction,
        temperature: 0.4
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