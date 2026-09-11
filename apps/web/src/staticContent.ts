import baseGamesJson from '../../../content/game-levels.json';
import expandedGamesJson from '../../../content/game-levels-expanded.json';
import knowledgeJson from '../../../content/knowledge-base.json';
import type { BootstrapContent, GameLevel, KnowledgeItem } from './types';

const baseGames = baseGamesJson as {
  version: string;
  reviewStatus: 'draft' | 'approved';
  levels: GameLevel[];
};
const expandedGames = expandedGamesJson as {
  version: string;
  reviewStatus: 'draft' | 'approved';
  levels: GameLevel[];
};
const knowledgeSource = knowledgeJson as {
  version: string;
  notice: string;
  items: KnowledgeItem[];
};

const knowledge = knowledgeSource.items.filter(
  (item) => item.reviewStatus === 'approved',
);
const approvedKnowledgeIds = new Set(knowledge.map((item) => item.id));
const levels =
  baseGames.reviewStatus === 'approved' &&
  expandedGames.reviewStatus === 'approved'
    ? [...baseGames.levels, ...expandedGames.levels].filter((level) =>
        level.sourceKnowledgeIds.every((id) => approvedKnowledgeIds.has(id)),
      )
    : [];

export const staticContent: BootstrapContent = {
  version: `${baseGames.version}+${knowledgeSource.version}`,
  notice: knowledgeSource.notice,
  levels,
  knowledge,
  features: {
    externalAiConfigured: false,
    voiceInput: 'browser-dependent',
    chatPersistence: false,
  },
};
