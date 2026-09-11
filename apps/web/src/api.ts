import type {
  AssistantReply,
  Audience,
  BootstrapContent,
  KnowledgeItem,
} from './types';
import { staticContent } from './staticContent';

const FEEDBACK_STORAGE_KEY = 'tuobao-static-feedback-v1';
const GAME_RESULTS_STORAGE_KEY = 'tuobao-static-game-results-v1';
const SAFETY_NOTICE =
  '本助手用于公益科普，不构成个案法律意见或医疗诊断。紧急情况请立即联系监护人及专业部门。';
const URGENT_KEYWORDS = [
  '无法呼吸',
  '不能呼吸',
  '昏迷',
  '意识不清',
  '大量出血',
  '严重受伤',
  '性侵',
  '虐待',
  '殴打',
  '走失',
  '人身危险',
];
const PHONE_PATTERN = /(?:^|\D)1[3-9]\d{9}(?:$|\D)/;
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const ID_CARD_PATTERN = /(?:^|\D)\d{17}[\dXx](?:$|\D)/;

interface StoredFeedback {
  id: number;
  sessionId: string;
  role: 'guardian' | 'institution' | 'student' | 'practitioner';
  rating: number;
  tags: string[];
  comment: string;
  createdAt: string;
}

function containsPersonalIdentifier(value: string): boolean {
  return (
    PHONE_PATTERN.test(value) ||
    EMAIL_PATTERN.test(value) ||
    ID_CARD_PATTERN.test(value)
  );
}

function readStoredArray<T>(key: string): T[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '[]') as unknown;
    return Array.isArray(value) ? (value as T[]) : [];
  } catch {
    return [];
  }
}

function writeStoredArray<T>(key: string, values: T[]): void {
  localStorage.setItem(key, JSON.stringify(values.slice(-200)));
}

function citationFor(item: KnowledgeItem) {
  return {
    id: item.id,
    title: item.source.title,
    url: item.source.url,
    article: item.source.article,
    status: item.source.status,
  };
}

function retrieveKnowledge(
  message: string,
  audience: Audience,
): KnowledgeItem[] {
  const normalized = message.toLowerCase().replaceAll(/\s+/g, '');
  return staticContent.knowledge
    .filter((item) => item.audiences.includes(audience))
    .map((item) => {
      const keywordScore = item.keywords.reduce(
        (score, keyword) =>
          score +
          (normalized.includes(keyword.toLowerCase().replaceAll(/\s+/g, ''))
            ? 3
            : 0),
        0,
      );
      const titleScore = normalized.includes(item.title.slice(0, 4)) ? 2 : 0;
      return { item, score: keywordScore + titleScore };
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map(({ item }) => item);
}

export async function fetchBootstrap(): Promise<BootstrapContent> {
  return staticContent;
}

export async function sendChat(payload: {
  sessionId: string;
  audience: Audience;
  message: string;
}): Promise<AssistantReply> {
  const message = payload.message.trim();
  if (containsPersonalIdentifier(message)) {
    throw new Error('请删除手机号、邮箱、身份证号等个人信息后再提问。');
  }

  if (URGENT_KEYWORDS.some((keyword) => message.includes(keyword))) {
    const emergencyItem = staticContent.knowledge.find(
      (item) => item.id === 'emergency-plan',
    );
    return {
      answer:
        '这可能是紧急情况。请先让儿童离开危险并联系监护人；严重受伤、无法呼吸或意识异常请立即拨打120，存在暴力、走失或持续人身危险请拨打110。不要等待网络回答。',
      mode: 'safety',
      citations: emergencyItem ? [citationFor(emergencyItem)] : [],
      safetyNotice: SAFETY_NOTICE,
      category: 'urgent-safety',
    };
  }

  const matches = retrieveKnowledge(message, payload.audience);
  if (matches.length === 0) {
    const statusItem = staticContent.knowledge.find(
      (item) => item.id === 'draft-status',
    );
    return {
      answer:
        payload.audience === 'child'
          ? '这个问题我还没有审核好的答案。请和家长一起询问可信老师或专业人员，不要把个人信息告诉陌生人。'
          : '本地审核知识库暂未覆盖这个问题。建议查询属地卫生健康部门等官方渠道或咨询专业人员；请勿在对话中提供儿童姓名、联系方式、健康记录等个人信息。',
      mode: 'fallback',
      citations: statusItem ? [citationFor(statusItem)] : [],
      safetyNotice: SAFETY_NOTICE,
      category: 'unmatched',
    };
  }

  return {
    answer: matches
      .map((item) =>
        payload.audience === 'child' && item.childAnswer
          ? item.childAnswer
          : item.answer,
      )
      .join('\n\n'),
    mode: 'kb',
    citations: matches.map(citationFor),
    safetyNotice: SAFETY_NOTICE,
    category: matches[0]?.id ?? 'knowledge',
  };
}

export async function saveGameResult(payload: {
  sessionId: string;
  levelId: string;
  attempts: number;
  completed: boolean;
  durationMs: number;
}): Promise<void> {
  const results = readStoredArray<typeof payload & { createdAt: string }>(
    GAME_RESULTS_STORAGE_KEY,
  );
  results.push({ ...payload, createdAt: new Date().toISOString() });
  writeStoredArray(GAME_RESULTS_STORAGE_KEY, results);
}

export async function saveFeedback(payload: {
  sessionId: string;
  role: 'guardian' | 'institution' | 'student' | 'practitioner';
  rating: number;
  tags: string[];
  comment: string;
}): Promise<void> {
  if (containsPersonalIdentifier(payload.comment)) {
    throw new Error('请删除手机号、邮箱、身份证号等个人信息后再提交。');
  }
  const feedback = readStoredArray<StoredFeedback>(FEEDBACK_STORAGE_KEY);
  feedback.push({
    id: (feedback.at(-1)?.id ?? 0) + 1,
    ...payload,
    createdAt: new Date().toISOString(),
  });
  writeStoredArray(FEEDBACK_STORAGE_KEY, feedback);
}

function csvCell(value: unknown): string {
  let text = String(value ?? '');
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function downloadFeedback(): Promise<void> {
  const feedback = readStoredArray<StoredFeedback>(FEEDBACK_STORAGE_KEY);
  const header = ['id', 'session_id', 'role', 'rating', 'tags', 'comment', 'created_at'];
  const rows = feedback.map((item) =>
    [
      item.id,
      item.sessionId,
      item.role,
      item.rating,
      JSON.stringify(item.tags),
      item.comment,
      item.createdAt,
    ]
      .map(csvCell)
      .join(','),
  );
  const blob = new Blob([`\uFEFF${[header.join(','), ...rows].join('\r\n')}`], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'tuobao-local-feedback.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

export function getSessionId(): string {
  const key = 'tuobao-anonymous-session';
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const created =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  sessionStorage.setItem(key, created);
  return created;
}
