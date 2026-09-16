// apps/web/src/App.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, LoaderCircle, RefreshCcw, X, Mic, Volume2, CheckCircle2, Sparkles } from 'lucide-react';
import { fetchBootstrap, getSessionId } from './api';
import { AdminPanel } from './components/AdminPanel';
import { AssistantPanel } from './components/AssistantPanel';
import { FeedbackPanel } from './components/FeedbackPanel';
import { Age612Game } from './components/Age612Game';
import { GameExperience } from './components/GameExperience';
import { GuardianGate } from './components/GuardianGate';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { SourcesPanel } from './components/SourcesPanel';
import { VideoPlaceholder } from './components/VideoPlaceholder';
import { stopSpeaking, speak } from './speech';
import type { BootstrapContent, SectionId } from './types';
import { useTuobaoProgress, type AgeLevel } from './useTuobaoProgress';

const protectedSections = new Set<SectionId>(['game', 'assistant']);

export function App() {
  const [content, setContent] = useState<BootstrapContent | null>(null);
  const [loadError, setLoadError] = useState('');
  const [section, setSection] = useState<SectionId>('home');
  const [pendingSection, setPendingSection] = useState<SectionId | null>(null);
  const [guardianAccepted, setGuardianAccepted] = useState(
    () => sessionStorage.getItem('tuobao-guardian-accepted') === 'yes',
  );
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  
  // 引入打卡与年龄Hook
  const { 
    state: progressState, 
    setAgeLevel, 
    fetchDailyLaw, 
    completeSignIn, 
    hasSignedToday 
  } = useTuobaoProgress();

  const [showSigninModal, setShowSigninModal] = useState(false);
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecorded, setIsRecorded] = useState(false);
  const [hasConfirmedReading, setHasConfirmedReading] = useState(false);
  const [recordBlob, setRecordBlob] = useState<Blob | null>(null);
  const [recordUrl, setRecordUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const ageSelectorWasManualRef = useRef(false);

  const sessionId = useMemo(() => getSessionId(), []);

  useEffect(() => {
    return () => {
      if (recordUrl) URL.revokeObjectURL(recordUrl);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [recordUrl]);

  const load = useCallback(() => {
    setLoadError('');
    setContent(null);
    void fetchBootstrap()
      .then(setContent)
      .catch((error: unknown) =>
        setLoadError(
          error instanceof Error ? error.message : '内容服务暂时不可用。',
        ),
      );
  }, []);

  useEffect(() => load(), [load]);

  useEffect(() => {
    document.documentElement.dataset.contrast = highContrast ? 'high' : 'normal';
    document.documentElement.dataset.motion = reduceMotion ? 'reduced' : 'full';
  }, [highContrast, reduceMotion]);

  useEffect(() => {
    if (!showSigninModal) setHasConfirmedReading(false);
  }, [showSigninModal]);

  // 首次进入或切换地址时，检查强制打卡状态
  useEffect(() => {
    if (!progressState.userAgeLevel) {
      setShowAgeModal(true);
      return;
    }

    if (!hasSignedToday && !showAgeModal) {
      if (ageSelectorWasManualRef.current) {
        ageSelectorWasManualRef.current = false;
        return;
      }
      setShowSigninModal(true);
    }
  }, [progressState.userAgeLevel, hasSignedToday, showAgeModal]);

  const handleRecordToggle = async () => {
    if (isRecording) {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      setIsRecording(false);
      return;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
        const fallbackBlob = new Blob(['fake-audio-data'], { type: 'audio/mp3' });
        const fallbackUrl = URL.createObjectURL(fallbackBlob);
        setRecordBlob(fallbackBlob);
        setRecordUrl((previous) => {
          if (previous) URL.revokeObjectURL(previous);
          return fallbackUrl;
        });
        setIsRecorded(true);
        if (soundEnabled) speak('录音完成，打卡成功！');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        const nextUrl = URL.createObjectURL(blob);

        setRecordBlob(blob);
        setRecordUrl((previous) => {
          if (previous) URL.revokeObjectURL(previous);
          return nextUrl;
        });
        setIsRecorded(true);
        if (soundEnabled) speak('录音完成，打卡成功！');
      };

      recorder.start();
      setIsRecording(true);
      setIsRecorded(false);
      setHasConfirmedReading(false);
    } catch {
      const fallbackBlob = new Blob(['fake-audio-data'], { type: 'audio/mp3' });
      const fallbackUrl = URL.createObjectURL(fallbackBlob);
      setRecordBlob(fallbackBlob);
      setRecordUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return fallbackUrl;
      });
      setIsRecorded(true);
      if (soundEnabled) speak('无法访问麦克风，已使用演示录音。');
    }
  };

  const handleCompleteSignin = () => {
    if (recordBlob && hasConfirmedReading) {
      completeSignIn(recordBlob);
      setShowSigninModal(false);
    }
  };

  const handleAgeSelect = (level: AgeLevel) => {
    ageSelectorWasManualRef.current = false;
    setAgeLevel(level);
    setShowAgeModal(false);
    setShowSigninModal(!hasSignedToday);
  };

  function navigate(next: SectionId): void {
    stopSpeaking();
    if (protectedSections.has(next) && !guardianAccepted) {
      setPendingSection(next);
      return;
    }
    setSection(next);
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  function acceptGuardianGate(): void {
    setGuardianAccepted(true);
    sessionStorage.setItem('tuobao-guardian-accepted', 'yes');
    if (pendingSection) setSection(pendingSection);
    setPendingSection(null);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  if (loadError) {
    return (
      <main className="load-state" id="main-content">
        <AlertTriangle aria-hidden="true" />
        <h1>暂时没有连上托宝内容服务</h1>
        <p>{loadError}</p>
        <button type="button" className="button button--primary" onClick={load}>
          <RefreshCcw /> 重新连接
        </button>
      </main>
    );
  }

  if (!content) {
    return (
      <main className="load-state" id="main-content">
        <LoaderCircle className="spin" aria-hidden="true" />
        <h1>托宝正在准备成长乐园…</h1>
        <p>正在加载审核内容和安全关卡</p>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <Header
        activeSection={section}
        onNavigate={navigate}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          if (soundEnabled) stopSpeaking();
          setSoundEnabled((value) => !value);
        }}
        highContrast={highContrast}
        onToggleContrast={() => setHighContrast((value) => !value)}
        reduceMotion={reduceMotion}
        onToggleMotion={() => setReduceMotion((value) => !value)}
        ageLevel={progressState.userAgeLevel}
        onChangeAge={() => {
          stopSpeaking();
          ageSelectorWasManualRef.current = true;
          setShowSigninModal(false);
          setShowAgeModal(true);
        }}
      />
      <main id="main-content">
        {section === 'home' && (
          <HomePage
            levelCount={content.levels.length}
            knowledgeCount={content.knowledge.length}
            onStartGame={() => navigate('game')}
            onStartAssistant={() => navigate('assistant')}
            onOpenSources={() => navigate('sources')}
          />
        )}
        {section === 'game' && progressState.userAgeLevel === '6-12' && (
          <Age612Game
            sessionId={sessionId}
            soundEnabled={soundEnabled}
            onBack={() => navigate('home')}
          />
        )}
        {section === 'game' && progressState.userAgeLevel !== '6-12' && (
          <GameExperience
            levels={content.levels}
            ageLevel={progressState.userAgeLevel ?? '3-6'}
            sessionId={sessionId}
            soundEnabled={soundEnabled}
            onBack={() => navigate('home')}
          />
        )}
        {section === 'assistant' && (
          <AssistantPanel
            content={content}
            sessionId={sessionId}
            soundEnabled={soundEnabled}
          />
        )}
        {section === 'video' && <VideoPlaceholder />}
        {section === 'feedback' && <FeedbackPanel sessionId={sessionId} />}
        {section === 'sources' && <SourcesPanel content={content} />}
        {section === 'admin' && <AdminPanel />}
      </main>
      <footer className="site-footer">
        <div className="page-shell site-footer__grid">
          <div>
            <strong>托宝 · 法润托育 智护成长</strong>
            <p>家长陪同使用的托育法治早教公益科普产品</p>
          </div>
          <div className="site-footer__links">
            <button type="button" onClick={() => navigate('sources')}>来源与免责声明</button>
            <button type="button" onClick={() => navigate('feedback')}>匿名试用反馈</button>
            <button type="button" onClick={() => navigate('admin')}>数据导出</button>
          </div>
          <p className="site-footer__notice">
            不构成个案法律意见或医疗诊断。紧急情况请联系监护人并拨打 110 / 120。
          </p>
        </div>
      </footer>
      {pendingSection && (
        <GuardianGate
          destination={pendingSection === 'game' ? '成长游戏' : '托宝助手'}
          onAccept={acceptGuardianGate}
          onCancel={() => setPendingSection(null)}
        />
      )}

      {/* 年龄选择弹窗 */}
      {showAgeModal && (
        <div className="dialog-backdrop" role="presentation">
          <section className="guardian-dialog age-dialog" role="dialog" aria-modal="true" aria-labelledby="age-dialog-title">
            {progressState.userAgeLevel && (
              <button
                className="dialog-close"
                type="button"
                onClick={() => setShowAgeModal(false)}
                aria-label="关闭年龄选择"
              >
                <X />
              </button>
            )}
            <h2 id="age-dialog-title">选择体验年龄段</h2>
            <p>切换后会立即调整普法表达和成长游戏，不会清除各年龄段已保存的游戏进度。</p>
            <div className="guardian-points">
              <button className={`button age-option ${progressState.userAgeLevel === '0-3' ? 'is-current' : ''}`} aria-pressed={progressState.userAgeLevel === '0-3'} onClick={() => handleAgeSelect('0-3')}>
                <span><strong>0–3 岁</strong><small>家长陪同</small></span>
                {progressState.userAgeLevel === '0-3' && <em>当前</em>}
              </button>
              <button className={`button age-option ${progressState.userAgeLevel === '3-6' ? 'is-current' : ''}`} aria-pressed={progressState.userAgeLevel === '3-6'} onClick={() => handleAgeSelect('3-6')}>
                <span><strong>3–6 岁</strong><small>托幼衔接</small></span>
                {progressState.userAgeLevel === '3-6' && <em>当前</em>}
              </button>
              <button className={`button age-option ${progressState.userAgeLevel === '6-12' ? 'is-current' : ''}`} aria-pressed={progressState.userAgeLevel === '6-12'} onClick={() => handleAgeSelect('6-12')}>
                <span><strong>6–12 岁</strong><small>社会模拟</small></span>
                {progressState.userAgeLevel === '6-12' && <em>当前</em>}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* 强制每日法条打卡弹窗 */}
      {showSigninModal && progressState.userAgeLevel && (
        <div className="signin-backdrop" role="presentation">
          <section className="signin-modal" role="dialog" aria-modal="true" aria-labelledby="signin-dialog-title">
            <button 
              className="dialog-close signin-close" 
              type="button" 
              onClick={() => setShowSigninModal(false)}
              aria-label="关闭"
            >
              <X />
            </button>
            
            <div className="signin-title-row">
              <span className="signin-title-badge" aria-hidden="true"><CheckCircle2 /></span>
              <h2 id="signin-dialog-title">今日普法签到</h2>
            </div>

            <div className="signin-body">
              <div className="signin-law-column">
                <div className="law-tag">
                  <span className="law-tag__icon" aria-hidden="true">◫</span>
                  《托育法草案》{progressState.dailyLawArticleNo || '第18条'}
                </div>

                <div className="law-content">
                  {progressState.dailyLawText || '《托育法草案》第18条，托育机构应当建立安全管理制度，保障婴幼儿人身安全。'}
                </div>

                <button
                  className="audio-cta"
                  type="button"
                  onClick={() => speak(`《托育法草案》${progressState.dailyLawArticleNo || '第18条'}，${progressState.dailyLawText || '托育机构应当建立安全管理制度，保障婴幼儿人身安全。'}`)}
                >
                  <span className="audio-play-btn" aria-hidden="true"><Volume2 /></span>
                  <span><strong>播放朗读</strong><small>先听一遍，再跟着读</small></span>
                </button>
              </div>

              <div className="signin-action-column">
                <button
                  className={`record-btn ${isRecording ? 'is-recording' : (isRecorded ? 'is-completed' : '')}`}
                  type="button"
                  onClick={handleRecordToggle}
                  aria-label={isRecording ? '停止录音' : (isRecorded ? '重新录音' : '开始录音')}
                >
                  {isRecording ? <span>停止</span> : (isRecorded ? <CheckCircle2 /> : <Mic />)}
                </button>

                <p className="signin-voice-guide">
                  {isRecorded ? '录音已完成，可以试听并确认。' : `点击录音，读出${progressState.dailyLawArticleNo || '第18条'}及条文内容。`}
                </p>

                {isRecorded && recordUrl && (
                  <div className="signin-recording-review">
                    <audio controls src={recordUrl} />
                    <div className="signin-success-animation" aria-hidden="true"><Sparkles /></div>
                  </div>
                )}

                <label className={`signin-checkline ${hasConfirmedReading ? 'is-checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={hasConfirmedReading}
                    onChange={(event) => setHasConfirmedReading(event.target.checked)}
                  />
                  <span>
                    {progressState.userAgeLevel === '0-3' ? '已由家长陪同，完整读出法条编号和条文' :
                     progressState.userAgeLevel === '3-6' ? '已跟着音频，完整读出法条编号和条文' :
                     '我已独立朗读，并读出了法条编号'}
                  </span>
                </label>

                <button
                  className="button button--primary signin-complete-btn"
                  disabled={!isRecorded || !hasConfirmedReading}
                  onClick={handleCompleteSignin}
                >
                  解锁今日游戏权限
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
