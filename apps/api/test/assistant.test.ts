import { describe, expect, it, vi } from 'vitest';
import { createAssistant, isUrgentMessage, retrieveKnowledge } from '../src/assistant.js';
import { loadContent } from '../src/content.js';

const content = loadContent();

describe('assistant', () => {
  it('retrieves approved knowledge by Chinese keywords', () => {
    const matches = retrieveKnowledge(
      '托育服务法现在已经生效了吗？',
      'guardian',
      content.knowledge,
    );
    expect(matches[0]?.id).toBe('draft-status');
  });

  it('routes urgent messages directly to emergency guidance', async () => {
    expect(isUrgentMessage('孩子无法呼吸')).toBe(true);
    const assistant = createAssistant({ knowledge: content.knowledge });
    const reply = await assistant('孩子无法呼吸怎么办', 'guardian');
    expect(reply.mode).toBe('safety');
    expect(reply.answer).toContain('120');
  });

  it('works fully from the local reviewed knowledge base', async () => {
    const assistant = createAssistant({ knowledge: content.knowledge });
    const reply = await assistant('怎样看活动室是否安全？', 'guardian');
    expect(reply.mode).toBe('kb');
    expect(reply.citations.length).toBeGreaterThan(0);
    expect(reply.answer).toContain('整洁防滑');
  });

  it('falls back to reviewed content when the model times out', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('timeout');
    }) as unknown as typeof fetch;
    const assistant = createAssistant({
      knowledge: content.knowledge,
      aiBaseUrl: 'https://example.invalid/v1',
      aiApiKey: 'test-key',
      aiModel: 'test-model',
      fetchImpl,
    });
    const reply = await assistant('托育机构有什么责任？', 'guardian');
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(reply.mode).toBe('kb');
  });
});
