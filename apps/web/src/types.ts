export type Audience = 'child' | 'guardian';

export interface ContentSource {
  title: string;
  url: string;
  article: string;
  status: string;
  updatedAt: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  audiences: Audience[];
  keywords: string[];
  answer: string;
  childAnswer?: string | undefined;
  reviewStatus: 'draft' | 'approved';
  source: ContentSource;
}

export interface GameChoice {
  id: string;
  label: string;
  isSafe: boolean;
  isCorrect?: boolean;
  feedback: string;
}

export interface GameLesson {
  title: string;
  summary: string;
  tips: string[];
}

export interface GameScene {
  id: string;
  prompt: string;
  narration: string;
  illustration: string;
  lesson?: GameLesson;
  choices: GameChoice[];
}

export interface GameLevel {
  id: string;
  order: number;
  title: string;
  shortTitle: string;
  theme: string;
  emoji: string;
  summary: string;
  sourceKnowledgeIds: string[];
  scenes: GameScene[];
}

export interface BootstrapContent {
  version: string;
  notice: string;
  levels: GameLevel[];
  knowledge: KnowledgeItem[];
  features: {
    externalAiConfigured: boolean;
    voiceInput: string;
    chatPersistence: boolean;
  };
}

export interface AssistantCitation {
  id: string;
  title: string;
  url: string;
  article: string;
  status: string;
}

export interface AssistantReply {
  answer: string;
  mode: 'safety' | 'kb' | 'llm' | 'fallback';
  citations: AssistantCitation[];
  safetyNotice: string;
  category: string;
}

export type SectionId =
  | 'home'
  | 'game'
  | 'assistant'
  | 'video'
  | 'feedback'
  | 'sources'
  | 'admin';
