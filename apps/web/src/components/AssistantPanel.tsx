import { FormEvent, useMemo, useRef, useState } from 'react';
import {
  Bot,
  ExternalLink,
  LoaderCircle,
  Mic,
  MicOff,
  Send,
  ShieldAlert,
  UserRound,
  Volume2,
} from 'lucide-react';
import { sendChat } from '../api';
import {
  canRecognizeSpeech,
  speak,
  startSpeechRecognition,
} from '../speech';
import type {
  AssistantCitation,
  Audience,
  BootstrapContent,
} from '../types';
import { Mascot } from './Mascot';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  mode?: string;
  citations?: AssistantCitation[];
}

interface AssistantPanelProps {
  content: BootstrapContent;
  sessionId: string;
  soundEnabled: boolean;
}

const prompts: Record<Audience, string[]> = {
  child: ['什么样的活动室更安全？', '觉得不舒服时怎么办？', '找不到家长时找谁？'],
  guardian: ['托育服务法现在生效了吗？', '怎样观察托育环境是否安全？', '发现照护问题怎样记录和反馈？'],
};

export function AssistantPanel({
  content,
  sessionId,
  soundEnabled,
}: AssistantPanelProps) {
  const [audience, setAudience] = useState<Audience>('guardian');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: '你好，我是托宝。我可以用审核知识库回答托育安全和草案科普问题。请不要输入儿童姓名、电话或健康记录。',
      mode: 'kb',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef<{ stop(): void } | null>(null);
  const voiceAvailable = useMemo(() => canRecognizeSpeech(), []);

  function switchAudience(next: Audience): void {
    setAudience(next);
    setMessages((current) => [
      ...current,
      {
        id: `switch-${Date.now()}`,
        role: 'assistant',
        text:
          next === 'child'
            ? '已切换到儿童陪伴模式。我会使用更短、更温和的句子。'
            : '已切换到家长咨询模式。我会提供来源与适用边界。',
        mode: 'kb',
      },
    ]);
  }

  async function submitMessage(message: string): Promise<void> {
    const trimmed = message.trim();
    if (!trimmed || loading) return;
    setError('');
    setInput('');
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: 'user', text: trimmed },
    ]);
    setLoading(true);
    try {
      const response = await sendChat({ sessionId, audience, message: trimmed });
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: response.answer,
          mode: response.mode,
          citations: response.citations,
        },
      ]);
      if (soundEnabled) speak(response.answer);
    } catch (caught) {
      const messageText =
        caught instanceof Error ? caught.message : '暂时无法回答，请稍后再试。';
      setError(messageText);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    void submitMessage(input);
  }

  function toggleListening(): void {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = startSpeechRecognition({
      onResult: (text) => setInput(text),
      onEnd: () => setListening(false),
      onError: () => {
        setListening(false);
        setError('没有听清楚，请使用文字输入或再试一次。');
      },
    });
    if (recognition) {
      recognitionRef.current = recognition;
      setListening(true);
      setError('');
    }
  }

  return (
    <section className="assistant-page page-shell" aria-labelledby="assistant-title">
      <div className="assistant-intro">
        <div>
          <p className="eyebrow">审核知识优先 · 外部AI可选</p>
          <h1 id="assistant-title">有问题，问问托宝</h1>
          <p>
            {content.features.externalAiConfigured
              ? '当前已启用来源约束的模型增强；异常时自动回到本地知识库。'
              : '当前使用本地审核知识库，无需外部网络也能完成演示。'}
          </p>
        </div>
        <Mascot size="medium" mood="thinking" />
      </div>

      <div className="assistant-layout">
        <aside className="assistant-sidebar">
          <h2>回答对象</h2>
          <div className="audience-switch" role="group" aria-label="选择回答对象">
            <button
              type="button"
              className={audience === 'guardian' ? 'is-active' : ''}
              onClick={() => switchAudience('guardian')}
              aria-pressed={audience === 'guardian'}
            >
              <UserRound /> 家长咨询
            </button>
            <button
              type="button"
              className={audience === 'child' ? 'is-active' : ''}
              onClick={() => switchAudience('child')}
              aria-pressed={audience === 'child'}
            >
              <Bot /> 儿童陪伴
            </button>
          </div>
          <h2>试试这样问</h2>
          <div className="prompt-list">
            {prompts[audience].map((prompt) => (
              <button type="button" key={prompt} onClick={() => void submitMessage(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
          <div className="privacy-note">
            <ShieldAlert />
            <p>不保存聊天正文和语音。开启外部AI时，问题文本会发送给已配置的模型服务。</p>
          </div>
        </aside>

        <div className="chat-panel">
          <div className="chat-log" aria-live="polite" aria-label="托宝对话">
            {messages.map((message) => (
              <article
                className={`chat-message chat-message--${message.role}`}
                key={message.id}
              >
                <span className="chat-message__avatar" aria-hidden="true">
                  {message.role === 'assistant' ? '托' : '你'}
                </span>
                <div>
                  <p>{message.text}</p>
                  {message.role === 'assistant' && (
                    <div className="chat-message__meta">
                      {message.mode && <span>{modeLabel(message.mode)}</span>}
                      <button type="button" onClick={() => speak(message.text)}>
                        <Volume2 /> 朗读
                      </button>
                    </div>
                  )}
                  {message.citations && message.citations.length > 0 && (
                    <details className="citations">
                      <summary>查看回答来源（{message.citations.length}）</summary>
                      <ul>
                        {message.citations.map((citation) => (
                          <li key={citation.id}>
                            <a href={citation.url} target="_blank" rel="noreferrer">
                              {citation.title} · {citation.article}
                              <ExternalLink />
                            </a>
                            <span>{citation.status}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </article>
            ))}
            {loading && (
              <div className="chat-loading">
                <LoaderCircle /> 托宝正在查找审核资料…
              </div>
            )}
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <form className="chat-form" onSubmit={handleSubmit}>
            <label htmlFor="chat-input" className="sr-only">输入想问托宝的问题</label>
            <textarea
              id="chat-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="请勿输入儿童姓名、电话或健康记录…"
              maxLength={500}
              rows={2}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void submitMessage(input);
                }
              }}
            />
            <button
              type="button"
              className={`voice-button ${listening ? 'is-listening' : ''}`}
              onClick={toggleListening}
              disabled={!voiceAvailable}
              title={voiceAvailable ? '开始语音输入' : '此浏览器不支持语音识别，请打字输入'}
            >
              {voiceAvailable ? <Mic /> : <MicOff />}
              <span className="sr-only">
                {voiceAvailable ? '开始语音输入' : '语音识别不可用'}
              </span>
            </button>
            <button className="send-button" type="submit" disabled={loading || !input.trim()}>
              <Send />
              <span className="sr-only">发送问题</span>
            </button>
          </form>
          <p className="chat-footnote">
            草案科普不等同于现行法律结论；紧急情况请立即拨打 110 或 120。
          </p>
        </div>
      </div>
    </section>
  );
}

function modeLabel(mode: string): string {
  const labels: Record<string, string> = {
    kb: '审核知识库',
    llm: '来源约束AI',
    safety: '紧急安全提示',
    fallback: '安全兜底',
  };
  return labels[mode] ?? mode;
}
