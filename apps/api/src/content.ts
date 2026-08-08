import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { z } from 'zod';
import type { ContentBundle } from './types.js';

const sourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  article: z.string().min(1),
  status: z.string().min(1),
  updatedAt: z.string().min(1),
});

const knowledgeSchema = z.object({
  version: z.string().min(1),
  notice: z.string().min(1),
  items: z.array(
    z.object({
      id: z.string().regex(/^[a-z0-9-]+$/),
      title: z.string().min(1),
      audiences: z.array(z.enum(['child', 'guardian'])).min(1),
      keywords: z.array(z.string().min(1)).min(1),
      answer: z.string().min(1),
      childAnswer: z.string().min(1).optional(),
      reviewStatus: z.enum(['draft', 'approved']),
      source: sourceSchema,
    }),
  ),
});

const gameSchema = z.object({
  version: z.string().min(1),
  reviewStatus: z.enum(['draft', 'approved']),
  levels: z.array(
    z.object({
      id: z.string().regex(/^[a-z0-9-]+$/),
      order: z.number().int().positive(),
      title: z.string().min(1),
      shortTitle: z.string().min(1),
      theme: z.string().min(1),
      emoji: z.string().min(1),
      summary: z.string().min(1),
      sourceKnowledgeIds: z.array(z.string().min(1)),
      scenes: z.array(
        z.object({
          id: z.string().min(1),
          prompt: z.string().min(1),
          narration: z.string().min(1),
          illustration: z.string().min(1),
          choices: z
            .array(
              z.object({
                id: z.string().min(1),
                label: z.string().min(1),
                isSafe: z.boolean(),
                feedback: z.string().min(1),
              }),
            )
            .min(2),
        }),
      ),
    }),
  ),
});

export const defaultContentRoot = fileURLToPath(
  new URL('../../../content/', import.meta.url),
);

export function loadContent(contentRoot = defaultContentRoot): ContentBundle {
  const gamesRaw: unknown = JSON.parse(
    readFileSync(resolve(contentRoot, 'game-levels.json'), 'utf8'),
  );
  const knowledgeRaw: unknown = JSON.parse(
    readFileSync(resolve(contentRoot, 'knowledge-base.json'), 'utf8'),
  );

  const games = gameSchema.parse(gamesRaw);
  const knowledge = knowledgeSchema.parse(knowledgeRaw);
  const approvedKnowledge = knowledge.items.filter(
    (item) => item.reviewStatus === 'approved',
  );
  const approvedIds = new Set(approvedKnowledge.map((item) => item.id));
  const levels =
    games.reviewStatus === 'approved'
      ? games.levels.filter((level) =>
          level.sourceKnowledgeIds.every((id) => approvedIds.has(id)),
        )
      : [];

  return {
    version: `${games.version}+${knowledge.version}`,
    notice: knowledge.notice,
    levels,
    knowledge: approvedKnowledge,
  };
}
