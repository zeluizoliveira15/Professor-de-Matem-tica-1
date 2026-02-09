
export interface Solution {
  id: string;
  timestamp: number;
  question?: string;
  answer: string;
  image?: string;
  type: 'math' | 'physics' | 'chemistry' | 'general';
}

export enum AppMode {
  CAMERA = 'CAMERA',
  CHAT = 'CHAT',
  VOICE = 'VOICE',
  HISTORY = 'HISTORY'
}

export enum ResponseMode {
  SIMPLE = 'SIMPLE',
  EXPLAINED = 'EXPLAINED'
}

export enum Language {
  PT = 'PT',
  EN = 'EN',
  ES = 'ES'
}

export interface VoiceMessage {
  role: 'user' | 'model';
  text: string;
}