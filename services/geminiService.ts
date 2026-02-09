import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { ResponseMode } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("ERRO CRÍTICO: Variável API_KEY não definida no ambiente de build.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

const cleanOutput = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/[\$\*\_\#]/g, '')
    .trim();
};

export const solveFromImage = async (
  base64Image: string, 
  thinking: boolean = true, 
  mode: ResponseMode = ResponseMode.EXPLAINED
): Promise<string> => {
  const ai = getAI();
  if (!ai) throw new Error("Configuração de API ausente.");

  // Usando o modelo Flash por ser mais compatível e rápido para visão computacional
  const modelName = 'gemini-3-flash-preview';
  
  const prompt = mode === ResponseMode.SIMPLE 
    ? "Resolva o cálculo da imagem. Dê apenas o resultado final. Não use símbolos como *, $, # ou markdown." 
    : "Resolva o cálculo da imagem. Explique o passo a passo de forma muito breve (máximo 3 linhas). Não use símbolos markdown.";

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
        temperature: 0.2,
      }
    });

    return cleanOutput(response.text || "Não foi possível extrair o texto da resposta.");
  } catch (error: any) {
    console.error("Erro na API Gemini (Visão):", error);
    throw error;
  }
};

export const chatWithProfessor = async (
  message: string, 
  mode: ResponseMode = ResponseMode.EXPLAINED
): Promise<string> => {
  const ai = getAI();
  if (!ai) throw new Error("Configuração de API ausente.");

  const instruction = mode === ResponseMode.SIMPLE 
    ? 'Você é um professor direto. Dê apenas o resultado sem explicações ou símbolos.' 
    : 'Você é um professor de exatas. Resolva e explique brevemente sem usar símbolos especiais.';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction: instruction,
        temperature: 0.4
      }
    });

    return cleanOutput(response.text || "Erro na resposta do chat.");
  } catch (error: any) {
    console.error("Erro na API Gemini (Chat):", error);
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
    console.error("Erro ao gerar áudio:", error);
    return null;
  }
};