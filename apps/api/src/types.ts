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
  feedback: string;
}

export interface GameScene {
  id: string;
  prompt: string;
  narration: string;
  illustration: string;
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

export interface ContentBundle {
  version: string;
  notice: string;
  levels: GameLevel[];
  knowledge: KnowledgeItem[];
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
