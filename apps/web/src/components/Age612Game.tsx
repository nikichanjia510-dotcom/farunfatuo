import { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Check,
  FileCheck2,
  FolderOpen,
  LockKeyhole,
  NotebookTabs,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { saveGameResult } from '../api';
import {
  careerCards,
  roleCardReward,
  roleSteps,
  type CareerCard,
  type CaseItem,
  type PlayableRoleId,
} from '../age612GameData';
import { speak } from '../speech';

interface Age612GameProps {
  sessionId: string;
  soundEnabled: boolean;
  onBack: () => void;
}

interface StoredProgress {
  completedRoles: PlayableRoleId[];
  prosecutorUnlocked: boolean;
}

type GameView = 'lobby' | 'roles' | 'case' | 'preview' | 'cards' | 'certificate' | 'result';

const progressKey = 'tuobao-age-6-12-progress-v1';
const playableRoleIds: PlayableRoleId[] = ['teacher', 'parent', 'inspector', 'prosecutor'];

function isPlayableRoleId(value: string): value is PlayableRoleId {
  return playableRoleIds.includes(value as PlayableRoleId);
}

function readStoredProgress(): StoredProgress {
  try {
    const value = JSON.parse(localStorage.getItem(progressKey) ?? '{}') as Partial<StoredProgress>;
    return {
      completedRoles: Array.isArray(value.completedRoles)
        ? value.completedRoles.filter(isPlayableRoleId)
        : [],
      prosecutorUnlocked: value.prosecutorUnlocked === true,
    };
  } catch {
    return { completedRoles: [], prosecutorUnlocked: false };
  }
}

function uniqueItems(current: CaseItem[], additions: CaseItem[]): CaseItem[] {
  const known = new Set(current.map((item) => item.id));
  return [...current, ...additions.filter((item) => !known.has(item.id))];
}

export function Age612Game({ sessionId, soundEnabled, onBack }: Age612GameProps) {
  const [view, setView] = useState<GameView>('lobby');
  const [progress, setProgress] = useState<StoredProgress>(readStoredProgress);
  const [activeRole, setActiveRole] = useState<PlayableRoleId | null>(null);
  const [previewRole, setPreviewRole] = useState<CareerCard | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [chosenOption, setChosenOption] = useState<string | null>(null);
  const [stepPassed, setStepPassed] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [evidence, setEvidence] = useState<CaseItem[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [ending, setEnding] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const startedAt = useRef(Date.now());

  const activeCard = useMemo(
    () => careerCards.find((card) => card.id === activeRole) ?? null,
    [activeRole],
  );
  const steps = activeRole ? roleSteps[activeRole] : [];
  const step = steps[stepIndex];
  const allRolesCompleted = playableRoleIds.every((roleId) => progress.completedRoles.includes(roleId));

  function updateProgress(next: StoredProgress): void {
    setProgress(next);
    localStorage.setItem(progressKey, JSON.stringify(next));
  }

  function resetStepState(): void {
    setSelectedItems([]);
    setChosenOption(null);
    setStepPassed(false);
    setFeedback('');
  }

  function openRoles(): void {
    setView('roles');
    setPreviewRole(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startRole(roleId: PlayableRoleId): void {
    if (roleId === 'prosecutor' && !progress.prosecutorUnlocked) return;
    setActiveRole(roleId);
    setStepIndex(0);
    setEvidence([]);
    setAttempts(0);
    setEnding('');
    setSaveStatus('');
    resetStepState();
    startedAt.current = Date.now();
    setView('case');
    const firstStep = roleSteps[roleId][0];
    if (soundEnabled && firstStep) speak(firstStep.story);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function toggleItem(itemId: string): void {
    if (stepPassed) return;
    setSelectedItems((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId],
    );
  }

  function validateItems(): void {
    if (!step?.items) return;
    setAttempts((value) => value + 1);
    const required = step.items.filter((item) => item.recommended !== false).map((item) => item.id);
    const forbidden = step.items.filter((item) => item.recommended === false).map((item) => item.id);
    const success = required.every((id) => selectedItems.includes(id))
      && forbidden.every((id) => !selectedItems.includes(id));

    if (!success) {
      const message = '还有关键材料未选择，或混入了不合适的做法。请对照事实重新核对。';
      setFeedback(message);
      if (soundEnabled) speak(message);
      return;
    }

    const additions = step.items.filter((item) => selectedItems.includes(item.id));
    setEvidence((current) => uniqueItems(current, additions));
    const message = step.successText ?? '核对完成，可以进入下一步。';
    setFeedback(message);
    setStepPassed(true);
    if (soundEnabled) speak(message);
  }

  function completeBriefing(): void {
    if (!step) return;
    setAttempts((value) => value + 1);
    setEvidence((current) => uniqueItems(current, step.evidenceToAdd ?? []));
    const message = step.successText ?? '卷宗已经整理完成。';
    setFeedback(message);
    setStepPassed(true);
    if (soundEnabled) speak(message);
  }

  function chooseOption(optionId: string): void {
    if (!step?.options || stepPassed) return;
    const option = step.options.find((item) => item.id === optionId);
    if (!option) return;
    setAttempts((value) => value + 1);
    if (step.items) {
      const required = step.items.filter((item) => item.recommended !== false).map((item) => item.id);
      if (!required.every((id) => selectedItems.includes(id))) {
        const message = '先把全部关键材料勾选完整，再作出处置决定。';
        setFeedback(message);
        if (soundEnabled) speak(message);
        return;
      }
    }
    setChosenOption(option.id);
    setFeedback(option.feedback);
    setStepPassed(option.recommended);
    if (option.recommended && step.items) {
      setEvidence((current) => uniqueItems(
        current,
        step.items!.filter((item) => selectedItems.includes(item.id)),
      ));
    }
    if (soundEnabled) speak(option.feedback);
  }

  function completeRole(finalEnding: string, unlockProsecutor = false): void {
    if (!activeRole) return;
    const nextProgress: StoredProgress = {
      completedRoles: progress.completedRoles.includes(activeRole)
        ? progress.completedRoles
        : [...progress.completedRoles, activeRole],
      prosecutorUnlocked: progress.prosecutorUnlocked || unlockProsecutor,
    };
    updateProgress(nextProgress);
    setEnding(finalEnding);
    setSaveStatus('正在保存匿名案件结果…');
    setView('result');
    void saveGameResult({
      sessionId,
      levelId: `age-6-12-${activeRole}`,
      attempts,
      completed: true,
      durationMs: Date.now() - startedAt.current,
    })
      .then(() => setSaveStatus('匿名案件结果已保存。'))
      .catch(() => setSaveStatus('结果暂未保存，但本机进度已经保留。'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function continueCase(): void {
    if (!step || !stepPassed) return;
    if (step.kind === 'branch') {
      const option = step.options?.find((item) => item.id === chosenOption);
      completeRole(option?.ending ?? step.title, option?.unlockProsecutor);
      return;
    }
    if (step.kind === 'document' || stepIndex >= steps.length - 1) {
      completeRole(step.title);
      return;
    }
    setStepIndex((value) => value + 1);
    resetStepState();
    const nextStep = steps[stepIndex + 1];
    if (soundEnabled && nextStep) speak(nextStep.story);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetWrongChoice(): void {
    setChosenOption(null);
    setStepPassed(false);
    setFeedback('');
  }

  const pageBack = view === 'lobby' ? onBack : view === 'case' ? openRoles : () => setView('lobby');

  if (view === 'lobby') {
    return (
      <section className="age612-page age612-lobby" aria-labelledby="age612-title">
        <div className="page-shell">
          <button className="back-button age612-back" type="button" onClick={onBack}>
            <ArrowLeft aria-hidden="true" /> 返回首页
          </button>
          <div className="age612-lobby__hero">
            <div className="age612-lobby__eyebrow"><ShieldCheck aria-hidden="true" /> 6–12 岁 · 社会规则进阶</div>
            <h1 id="age612-title">托宝社会法律调查局</h1>
            <p>换一个职业，就换一个看问题的角度。调查同一起托育事件，收集证据、作出决定，让儿童保护真正形成闭环。</p>
            <div className="age612-case-file">
              <span className="age612-case-file__stamp">DEMO 案件</span>
              <div>
                <small>CASE 001</small>
                <h2>星星托育园疑似看护缺位事件</h2>
                <p>一名幼儿连续出现磕碰，午睡巡查、健康记录与教职工行为均存在疑点。</p>
              </div>
              <FolderOpen aria-hidden="true" />
            </div>
            <button className="primary-button age612-start" type="button" onClick={openRoles}>
              开启案件 <ArrowRight aria-hidden="true" />
            </button>
          </div>
          <div className="age612-lobby__features" aria-label="游戏特色">
            <span><BriefcaseBusiness aria-hidden="true" /> 9 张职业卡</span>
            <span><NotebookTabs aria-hidden="true" /> 动态证据笔记本</span>
            <span><RotateCcw aria-hidden="true" /> 错误分支可回溯</span>
            <span><Trophy aria-hidden="true" /> 卡牌与证书收藏</span>
          </div>
          <p className="age612-disclaimer">普法体验基于公开草案主题设计；草案尚未生效，游戏流程经过简化，不构成个案法律意见。</p>
        </div>
      </section>
    );
  }

  if (view === 'roles') {
    return (
      <section className="age612-page age612-roles" aria-labelledby="role-title">
        <div className="page-shell">
          <button className="back-button age612-back" type="button" onClick={() => setView('lobby')}>
            <ArrowLeft aria-hidden="true" /> 返回调查局
          </button>
          <div className="age612-section-heading">
            <div>
              <span className="age612-kicker">职业档案室</span>
              <h1 id="role-title">选择你的调查身份</h1>
              <p>4 条可体验主线，5 张完整版职业预览。检察官需在“拒不整改”分支中解锁。</p>
            </div>
            <div className="age612-heading-actions">
              <button type="button" className="secondary-button" onClick={() => setView('cards')}><BookOpen aria-hidden="true" /> 卡牌库</button>
              <span>{progress.completedRoles.length}/4 主线完成</span>
            </div>
          </div>
          <div className="age612-role-grid">
            {careerCards.map((card) => {
              const locked = card.id === 'prosecutor' && !progress.prosecutorUnlocked;
              const completed = isPlayableRoleId(card.id) && progress.completedRoles.includes(card.id);
              return (
                <article className={`age612-role-card age612-role-card--${card.rarity === '预览' ? 'preview' : card.rarity}`} key={card.id}>
                  <div className="age612-role-card__top">
                    <span className="age612-role-card__emoji" aria-hidden="true">{card.emoji}</span>
                    <span className="age612-rarity">{card.rarity}</span>
                  </div>
                  <small>{card.perspective}</small>
                  <h2>{card.name}</h2>
                  <p>{card.duty}</p>
                  <div className="age612-topic">学习主题：{card.legalTopic}</div>
                  {completed && <div className="age612-complete-mark"><Check aria-hidden="true" /> 已通关</div>}
                  {locked ? (
                    <button type="button" className="age612-card-button" disabled><LockKeyhole aria-hidden="true" /> 拒不整改分支解锁</button>
                  ) : card.playable && isPlayableRoleId(card.id) ? (
                    <button type="button" className="age612-card-button" onClick={() => startRole(card.id as PlayableRoleId)}>
                      {completed ? '再次调查' : '进入主线'} <ArrowRight aria-hidden="true" />
                    </button>
                  ) : (
                    <button type="button" className="age612-card-button age612-card-button--preview" onClick={() => { setPreviewRole(card); setView('preview'); }}>
                      查看职业预览
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  if (view === 'preview' && previewRole) {
    return (
      <section className="age612-page age612-centered">
        <div className="page-shell">
          <button className="back-button age612-back" type="button" onClick={openRoles}><ArrowLeft aria-hidden="true" /> 返回职业选择</button>
          <div className="age612-preview-panel">
            <span className="age612-preview-panel__emoji" aria-hidden="true">{previewRole.emoji}</span>
            <span className="age612-kicker">完整版职业预览</span>
            <h1>{previewRole.name}</h1>
            <p>{previewRole.duty}</p>
            <div className="age612-preview-topic">未来任务主题：{previewRole.legalTopic}</div>
            <p className="age612-muted">本次 DEMO 先完整开放老师、家长、卫健局检查员和条件解锁的检察官四条主线。</p>
            <button className="primary-button" type="button" onClick={openRoles}>选择已开放职业</button>
          </div>
        </div>
      </section>
    );
  }

  if (view === 'cards') {
    return (
      <section className="age612-page age612-centered" aria-labelledby="cards-title">
        <div className="page-shell">
          <button className="back-button age612-back" type="button" onClick={openRoles}><ArrowLeft aria-hidden="true" /> 返回职业选择</button>
          <div className="age612-section-heading">
            <div><span className="age612-kicker">我的收藏</span><h1 id="cards-title">职业成就卡牌库</h1></div>
            <span>{progress.completedRoles.length}/4 已收集</span>
          </div>
          <div className="age612-reward-grid">
            {playableRoleIds.map((roleId) => {
              const card = careerCards.find((item) => item.id === roleId)!;
              const collected = progress.completedRoles.includes(roleId);
              return (
                <article className={`age612-reward-card ${collected ? 'is-collected' : 'is-locked'}`} key={roleId}>
                  <span aria-hidden="true">{collected ? card.emoji : '❔'}</span>
                  <small>{collected ? card.rarity : '尚未获得'}</small>
                  <h2>{collected ? roleCardReward[roleId] : '神秘职业卡'}</h2>
                  <p>{collected ? `完成“${card.name}”主线获得` : '完成对应职业主线后点亮'}</p>
                </article>
              );
            })}
          </div>
          {allRolesCompleted && <button className="primary-button age612-certificate-button" type="button" onClick={() => setView('certificate')}><Trophy aria-hidden="true" /> 查看调查员证书</button>}
        </div>
      </section>
    );
  }

  if (view === 'certificate') {
    return (
      <section className="age612-page age612-centered">
        <div className="page-shell">
          <button className="back-button age612-back" type="button" onClick={() => setView('cards')}><ArrowLeft aria-hidden="true" /> 返回卡牌库</button>
          <div className="age612-certificate">
            <Sparkles aria-hidden="true" />
            <span>托宝社会法律调查局</span>
            <h1>多角色法律调查员</h1>
            <p>已从托育老师、家长、行政检查员和未成年人检察官四种视角完成案件调查。</p>
            <strong>善于观察 · 尊重事实 · 懂得求助 · 守护儿童</strong>
            <small>此证书为普法游戏纪念证书</small>
          </div>
        </div>
      </section>
    );
  }

  if (view === 'result' && activeRole && activeCard) {
    const nowComplete = playableRoleIds.every((roleId) => (
      roleId === activeRole || progress.completedRoles.includes(roleId)
    ));
    return (
      <section className="age612-page age612-centered">
        <div className="page-shell">
          <div className="age612-result-panel">
            <Sparkles aria-hidden="true" />
            <span className="age612-kicker">案件阶段完成</span>
            <h1>{ending}</h1>
            <p>你以“{activeCard.name}”身份完成了调查，获得职业成就卡：</p>
            <div className="age612-earned-card"><span>{activeCard.emoji}</span><strong>{roleCardReward[activeRole]}</strong><small>{activeCard.rarity}卡牌</small></div>
            {progress.prosecutorUnlocked && activeRole !== 'prosecutor' && <div className="age612-unlocked"><LockKeyhole aria-hidden="true" /> 新职业“未成年人检察官”已解锁</div>}
            <p className="age612-save-status" role="status">{saveStatus}</p>
            <div className="age612-result-actions">
              <button className="primary-button" type="button" onClick={openRoles}>继续选择职业</button>
              <button className="secondary-button" type="button" onClick={() => setView('cards')}>查看卡牌库</button>
              {nowComplete && <button className="secondary-button" type="button" onClick={() => setView('certificate')}>查看调查员证书</button>}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (view === 'case' && activeRole && activeCard && step) {
    const isDecision = step.kind === 'decision' || step.kind === 'branch';
    const isBriefing = step.kind === 'briefing';
    const isDocument = step.kind === 'document';
    return (
      <section className="age612-page age612-case" aria-labelledby="case-step-title">
        <div className="page-shell">
          <button className="back-button age612-back" type="button" onClick={pageBack}><ArrowLeft aria-hidden="true" /> 暂停并返回职业选择</button>
          <header className="age612-case-header">
            <div><span>{activeCard.emoji}</span><div><small>当前身份</small><strong>{activeCard.name}</strong></div></div>
            <div className="age612-case-progress"><span>案件进度 {stepIndex + 1}/{steps.length}</span><div><i style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} /></div></div>
          </header>
          <div className="age612-case-layout">
            <main className="age612-case-stage">
              <span className="age612-kicker">{step.kicker}</span>
              <div className="age612-scene-emoji" aria-hidden="true">{step.sceneEmoji}</div>
              <h1 id="case-step-title">{step.title}</h1>
              <p className="age612-story">{step.story}</p>

              {step.prompt && <h2 className="age612-prompt">{step.prompt}</h2>}
              {step.items && (
                <div className="age612-evidence-options">
                  {step.items.map((item) => {
                    const selected = selectedItems.includes(item.id);
                    return (
                      <button type="button" className={selected ? 'is-selected' : ''} aria-pressed={selected} onClick={() => toggleItem(item.id)} key={item.id}>
                        <span>{selected ? <Check aria-hidden="true" /> : '＋'}</span>
                        <strong>{item.label}</strong>
                        {item.detail && <small>{item.detail}</small>}
                      </button>
                    );
                  })}
                </div>
              )}
              {step.options && (
                <div className="age612-choice-list">
                  {step.options.map((option) => (
                    <button
                      type="button"
                      className={`${chosenOption === option.id ? 'is-chosen' : ''} ${chosenOption === option.id && !option.recommended ? 'is-wrong' : ''}`}
                      onClick={() => chooseOption(option.id)}
                      disabled={stepPassed}
                      key={option.id}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
              {isDocument && (
                <div className="age612-document">
                  <FileCheck2 aria-hidden="true" />
                  <small>游戏内模拟文书</small>
                  <h2>{step.documentTitle}</h2>
                  <ul>{step.documentLines?.map((line) => <li key={line}>{line}</li>)}</ul>
                </div>
              )}
              {step.legalNote && <aside className="age612-legal-note"><BookOpen aria-hidden="true" /><span><strong>普法提示</strong>{step.legalNote}</span></aside>}
              {feedback && <div className={`age612-feedback ${stepPassed ? 'is-success' : 'is-detour'}`} role="status">{feedback}</div>}
              <div className="age612-stage-actions">
                {isBriefing && !stepPassed && <button className="primary-button" type="button" onClick={completeBriefing}>{step.actionLabel}</button>}
                {!isDecision && !isBriefing && !isDocument && !stepPassed && <button className="primary-button" type="button" onClick={validateItems}>{step.actionLabel}</button>}
                {isDocument && !stepPassed && <button className="primary-button" type="button" onClick={() => setStepPassed(true)}>确认文书并结案</button>}
                {chosenOption && !stepPassed && <button className="secondary-button" type="button" onClick={resetWrongChoice}><RotateCcw aria-hidden="true" /> 回溯重选</button>}
                {stepPassed && <button className="primary-button" type="button" onClick={continueCase}>{step.kind === 'branch' || isDocument ? '完成本角色主线' : '进入下一步'} <ArrowRight aria-hidden="true" /></button>}
              </div>
            </main>
            <aside className="age612-notebook" aria-label="证据笔记本">
              <div className="age612-notebook__binding" />
              <div className="age612-notebook__title"><NotebookTabs aria-hidden="true" /><div><small>CASE 001</small><h2>证据笔记本</h2></div></div>
              {evidence.length === 0 ? <p className="age612-notebook__empty">调查刚刚开始。完成核查后，证据会自动归档在这里。</p> : (
                <ol>{evidence.map((item) => <li key={item.id}><Check aria-hidden="true" /><span><strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}</span></li>)}</ol>
              )}
              <div className="age612-notebook__count">已归档 {evidence.length} 项</div>
            </aside>
          </div>
        </div>
      </section>
    );
  }

  return null;
}
