import type {
  AssistantCitation,
  AssistantReply,
  Audience,
  KnowledgeItem,
} from './types.js';

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

export interface AssistantOptions {
  knowledge: KnowledgeItem[];
  aiBaseUrl?: string;
  aiApiKey?: string;
  aiModel?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

function citationFor(item: KnowledgeItem): AssistantCitation {
  return {
    id: item.id,
    title: item.source.title,
    url: item.source.url,
    article: item.source.article,
    status: item.source.status,
  };
}

export function isUrgentMessage(message: string): boolean {
  return URGENT_KEYWORDS.some((keyword) => message.includes(keyword));
}

export function retrieveKnowledge(
  message: string,
  audience: Audience,
  knowledge: KnowledgeItem[],
): KnowledgeItem[] {
  const normalized = message.toLowerCase().replaceAll(/\s+/g, '');
  return knowledge
    .filter((item) => item.audiences.includes(audience))
    .map((item) => {
      const keywordScore = item.keywords.reduce(
        (score, keyword) =>
          score + (normalized.includes(keyword.toLowerCase().replaceAll(/\s+/g, '')) ? 3 : 0),
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

function localAnswer(items: KnowledgeItem[], audience: Audience): string {
  return items
    .map((item) =>
      audience === 'child' && item.childAnswer ? item.childAnswer : item.answer,
    )
    .join('\n\n');
}

async function askCompatibleModel(
  message: string,
  audience: Audience,
  items: KnowledgeItem[],
  options: Required<Pick<AssistantOptions, 'aiBaseUrl' | 'aiApiKey' | 'aiModel'>> & {
    timeoutMs: number;
    fetchImpl: typeof fetch;
  },
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  const endpoint = `${options.aiBaseUrl.replace(/\/$/, '')}/chat/completions`;
  const context = items
    .map(
      (item, index) =>
        `[资料${index + 1}] ${item.title}\n${item.answer}\n来源：${item.source.title}，${item.source.article}，状态：${item.source.status}`,
    )
    .join('\n\n');
  const audienceRule =
    audience === 'child'
      ? '使用短句和温和、积极的儿童陪伴表达，并提醒找可信大人。'
      : '面向家长，用清晰、克制的科普语言回答。';

  try {
    const response = await options.fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${options.aiApiKey}`,
      },
      body: JSON.stringify({
        model: options.aiModel,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              `你是“托宝”公益科普助手。只能根据给定资料回答，不得虚构条款，不得把草案说成已生效法律，不提供个案法律结论或医疗诊断。${audienceRule} 回答控制在220字以内。`,
          },
          {
            role: 'user',
            content: `${context}\n\n问题：${message}`,
          },
        ],
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`AI request failed with ${response.status}`);
    }
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      throw new Error('AI response was empty');
    }
    return answer;
  } finally {
    clearTimeout(timer);
  }
}

export function createAssistant(options: AssistantOptions) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 8000;

  return async function reply(
    message: string,
    audience: Audience,
  ): Promise<AssistantReply> {
    if (isUrgentMessage(message)) {
      const emergencyItem = options.knowledge.find(
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

    const matches = retrieveKnowledge(message, audience, options.knowledge);
    if (matches.length === 0) {
      const statusItem = options.knowledge.find((item) => item.id === 'draft-status');
      return {
        answer:
          audience === 'child'
            ? '这个问题我还没有审核好的答案。请和家长一起询问可信老师或专业人员，不要把个人信息告诉陌生人。'
            : '本地审核知识库暂未覆盖这个问题。建议查询属地卫生健康部门等官方渠道或咨询专业人员；请勿在对话中提供儿童姓名、联系方式、健康记录等个人信息。',
        mode: 'fallback',
        citations: statusItem ? [citationFor(statusItem)] : [],
        safetyNotice: SAFETY_NOTICE,
        category: 'unmatched',
      };
    }

    const canUseModel = Boolean(
      options.aiBaseUrl && options.aiApiKey && options.aiModel,
    );
    if (canUseModel) {
      try {
        const answer = await askCompatibleModel(message, audience, matches, {
          aiBaseUrl: options.aiBaseUrl!,
          aiApiKey: options.aiApiKey!,
          aiModel: options.aiModel!,
          timeoutMs,
          fetchImpl,
        });
        return {
          answer,
          mode: 'llm',
          citations: matches.map(citationFor),
          safetyNotice: SAFETY_NOTICE,
          category: matches[0]?.id ?? 'knowledge',
        };
      } catch {
        // External AI is optional; the reviewed local answer is the safe fallback.
      }
    }

    return {
      answer: localAnswer(matches, audience),
      mode: 'kb',
      citations: matches.map(citationFor),
      safetyNotice: SAFETY_NOTICE,
      category: matches[0]?.id ?? 'knowledge',
    };
  };
}
