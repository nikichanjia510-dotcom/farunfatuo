import type {
  AssistantReply,
  Audience,
  BootstrapContent,
} from './types';

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...init?.headers,
    },
  });
  const data = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(data.message ?? '请求失败，请稍后重试。');
  }
  return data;
}

export function fetchBootstrap(): Promise<BootstrapContent> {
  return requestJson<BootstrapContent>('/api/content/bootstrap');
}

export function sendChat(payload: {
  sessionId: string;
  audience: Audience;
  message: string;
}): Promise<AssistantReply> {
  return requestJson<AssistantReply>('/api/assistant/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function saveGameResult(payload: {
  sessionId: string;
  levelId: string;
  attempts: number;
  completed: boolean;
  durationMs: number;
}): Promise<void> {
  await requestJson('/api/game-results', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function saveFeedback(payload: {
  sessionId: string;
  role: 'guardian' | 'institution' | 'student' | 'practitioner';
  rating: number;
  tags: string[];
  comment: string;
}): Promise<void> {
  await requestJson('/api/feedback', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function downloadFeedback(token: string): Promise<void> {
  const response = await fetch('/api/admin/feedback.csv', {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const data = (await response.json()) as { message?: string };
    throw new Error(data.message ?? '导出失败。');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'tuobao-feedback.csv';
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
