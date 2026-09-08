import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Headphones,
  RotateCcw,
  Sparkles,
  Star,
} from 'lucide-react';
import { saveGameResult } from '../api';
import { speak } from '../speech';
import type { GameChoice, GameLevel } from '../types';
import { Mascot } from './Mascot';

interface GameExperienceProps {
  levels: GameLevel[];
  sessionId: string;
  soundEnabled: boolean;
  onBack: () => void;
}

function isChoiceCorrect(choice: GameChoice): boolean {
  return choice.isCorrect ?? choice.isSafe;
}

export function GameExperience({
  levels,
  sessionId,
  soundEnabled,
  onBack,
}: GameExperienceProps) {
  const [activeLevelId, setActiveLevelId] = useState<string | null>(null);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [correctChoice, setCorrectChoice] = useState(false);
  const [completedLevels, setCompletedLevels] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const startedAt = useRef(Date.now());

  const sortedLevels = useMemo(
    () => [...levels].sort((left, right) => left.order - right.order),
    [levels],
  );
  const activeLevel = sortedLevels.find((level) => level.id === activeLevelId);
  const scene = activeLevel?.scenes[sceneIndex];

  useEffect(() => {
    if (soundEnabled && scene) speak(scene.narration);
  }, [scene, soundEnabled]);

  function startLevel(level: GameLevel): void {
    setActiveLevelId(level.id);
    setSceneIndex(0);
    setAttempts(0);
    setFeedback('');
    setCorrectChoice(false);
    setShowCelebration(false);
    setSaveStatus('');
    startedAt.current = Date.now();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function choose(choice: GameChoice): void {
    if (correctChoice) return;
    const isCorrect = isChoiceCorrect(choice);
    setAttempts((value) => value + 1);
    setFeedback(choice.feedback);
    setCorrectChoice(isCorrect);
    if (soundEnabled) speak(choice.feedback);
  }

  function finishLevel(): void {
    if (!activeLevel) return;
    const durationMs = Date.now() - startedAt.current;
    setCompletedLevels((current) =>
      current.includes(activeLevel.id) ? current : [...current, activeLevel.id],
    );
    setShowCelebration(true);
    setSaveStatus('正在保存匿名关卡结果…');
    void saveGameResult({
      sessionId,
      levelId: activeLevel.id,
      attempts,
      completed: true,
      durationMs,
    })
      .then(() => setSaveStatus('匿名关卡结果已保存。'))
      .catch(() => setSaveStatus('结果暂未保存，但不影响继续体验。'));
  }

  function nextScene(): void {
    if (!activeLevel) return;
    if (sceneIndex >= activeLevel.scenes.length - 1) {
      finishLevel();
      return;
    }
    setSceneIndex((value) => value + 1);
    setFeedback('');
    setCorrectChoice(false);
  }

  function startNextLevel(): void {
    if (!activeLevel) return;
    const currentIndex = sortedLevels.findIndex(
      (level) => level.id === activeLevel.id,
    );
    const next = sortedLevels[currentIndex + 1];
    if (next) startLevel(next);
    else {
      setActiveLevelId(null);
      setShowCelebration(false);
    }
  }

  if (!activeLevel || !scene) {
    return (
      <section className="experience-page page-shell" aria-labelledby="game-title">
        <button className="back-link" type="button" onClick={onBack}>
          <ArrowLeft aria-hidden="true" /> 返回首页
        </button>
        <div className="experience-heading">
          <div>
            <p className="eyebrow">托宝成长乐园</p>
            <h1 id="game-title">选一个今天想练习的安全本领</h1>
            <p>所有关卡都没有倒计时，也不会因为答错扣分。</p>
          </div>
          <Mascot size="medium" />
        </div>
        <div className="level-grid">
          {sortedLevels.map((level) => {
            const completed = completedLevels.includes(level.id);
            return (
              <article className={`level-card level-card--${level.theme}`} key={level.id}>
                <div className="level-card__top">
                  <span className="level-card__number">第 {level.order} 关</span>
                  {completed && (
                    <span className="completion-badge">
                      <CheckCircle2 /> 已完成
                    </span>
                  )}
                </div>
                <span className="level-card__emoji" aria-hidden="true">
                  {level.emoji}
                </span>
                <h2>{level.title}</h2>
                <p>{level.summary}</p>
                <ul>
                  <li>{level.scenes.length} 个亲子小情景</li>
                  <li>可重复尝试</li>
                </ul>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => startLevel(level)}
                >
                  {completed ? <RotateCcw /> : <Star />}
                  {completed ? '再玩一次' : '开始这一关'}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  if (showCelebration) {
    const currentIndex = sortedLevels.findIndex(
      (level) => level.id === activeLevel.id,
    );
    const hasNext = Boolean(sortedLevels[currentIndex + 1]);
    const isFinalLevel = currentIndex === sortedLevels.length - 1;

    return (
      <section className="celebration page-shell" aria-labelledby="celebration-title">
        <div className="confetti" aria-hidden="true">✦ ✨ ★ ✦</div>
        <Mascot size="large" mood="celebrate" />
        <p className="eyebrow">成长徽章已点亮</p>
        <h1 id="celebration-title">完成“{activeLevel.shortTitle}”练习！</h1>
        <p>
          宝宝和陪同大人一起完成了 {activeLevel.scenes.length} 个安全情景。
          答错也没关系，每一次重新选择都在学习。
        </p>
        <div className="result-badges" aria-label="本关结果">
          <span><Star /> {activeLevel.scenes.length} 颗成长星</span>
          <span><Sparkles /> 共尝试 {attempts} 次</span>
        </div>
        {isFinalLevel && (
          <div
            style={{
              marginTop: '1.25rem',
              border: '1px solid rgba(52, 168, 83, 0.28)',
              background: 'linear-gradient(135deg, rgba(147, 233, 167, 0.18), rgba(245, 249, 182, 0.18))',
              borderRadius: '18px',
              padding: '1rem 1.25rem',
              display: 'grid',
              gap: '0.4rem',
              textAlign: 'left',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#2c7a52' }}>Garden Unlock</p>
            <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#204b30' }}>花园已解锁：小花和小动物醒来了</h3>
            <p style={{ margin: 0, color: '#2d4f3d' }}>🌼 🐰 🐼 你已经通过了今天的安全成长关卡，花园里的小花和小动物现在都能一起玩耍了。</p>
          </div>
        )}
        <p className="subtle" aria-live="polite">{saveStatus}</p>
        <div className="hero__actions">
          <button
            type="button"
            className="button button--ghost"
            onClick={() => {
              setActiveLevelId(null);
              setShowCelebration(false);
            }}
          >
            返回关卡选择
          </button>
          <button type="button" className="button button--primary" onClick={startNextLevel}>
            {hasNext ? '挑战下一关' : '回到成长乐园'}
            <ArrowRight />
          </button>
        </div>
      </section>
    );
  }

  const progress = ((sceneIndex + 1) / activeLevel.scenes.length) * 100;
  return (
    <section className={`game-stage game-stage--${activeLevel.theme}`}>
      <div className="page-shell">
        <div className="game-stage__toolbar">
          <button
            type="button"
            className="back-link"
            onClick={() => setActiveLevelId(null)}
          >
            <ArrowLeft /> 退出本关
          </button>
          <span>第 {sceneIndex + 1} / {activeLevel.scenes.length} 题</span>
          <button
            type="button"
            className="listen-button"
            onClick={() => speak(scene.narration)}
          >
            <Headphones /> 听题目
          </button>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="关卡进度"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="scene-card">
          <div className="scene-card__visual" aria-hidden="true">
            <span>{scene.illustration}</span>
            <small>{activeLevel.shortTitle}</small>
          </div>
          <div className="scene-card__content">
            <p className="eyebrow">和家长一起想一想</p>
            <h1>{scene.prompt}</h1>
            <div className="choice-list" aria-label="选择一个做法">
              {scene.choices.map((choice, index) => {
                const isCorrect = isChoiceCorrect(choice);
                const showCorrectState = correctChoice && isCorrect;
                const showWrongState = correctChoice && !isCorrect;

                return (
                  <button
                    type="button"
                    key={choice.id}
                    onClick={() => choose(choice)}
                    disabled={correctChoice}
                    className={showCorrectState ? 'is-correct' : showWrongState ? 'is-wrong' : ''}
                  >
                    <span>{String.fromCharCode(65 + index)}</span>
                    {choice.label}
                    {showCorrectState && <CheckCircle2 />}
                  </button>
                );
              })}
            </div>
            <div
              className={`feedback-callout ${correctChoice ? 'is-success' : ''}`}
              aria-live="polite"
            >
              <Mascot size="small" mood={correctChoice ? 'celebrate' : 'thinking'} />
              <p>{feedback || '选择后，托宝会温柔地告诉你为什么。'}</p>
            </div>
            {correctChoice && scene.lesson && (
              <div
                style={{
                  marginTop: '1rem',
                  borderRadius: '16px',
                  padding: '1rem 1.1rem',
                  background: 'linear-gradient(135deg, rgba(255,243,214,0.9), rgba(227,245,255,0.9))',
                  border: '1px solid rgba(245, 158, 11, 0.28)',
                  color: '#334155',
                }}
              >
                <p style={{ margin: '0 0 0.4rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, color: '#c7740d' }}>儿童法律小课堂</p>
                <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.2rem', color: '#1f2937' }}>{scene.lesson.title}</h3>
                <p style={{ margin: '0 0 0.5rem', lineHeight: 1.6 }}>{scene.lesson.summary}</p>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '0.25rem' }}>
                  {scene.lesson.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
            {correctChoice && (
              <button
                type="button"
                className="button button--primary button--next"
                onClick={nextScene}
              >
                {sceneIndex === activeLevel.scenes.length - 1 ? '领取成长徽章' : '进入下一个情景'}
                <ArrowRight />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
