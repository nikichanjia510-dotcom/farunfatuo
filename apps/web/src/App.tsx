import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, LoaderCircle, RefreshCcw } from 'lucide-react';
import { fetchBootstrap, getSessionId } from './api';
import { AdminPanel } from './components/AdminPanel';
import { AssistantPanel } from './components/AssistantPanel';
import { FeedbackPanel } from './components/FeedbackPanel';
import { GameExperience } from './components/GameExperience';
import { GuardianGate } from './components/GuardianGate';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { SourcesPanel } from './components/SourcesPanel';
import { VideoPlaceholder } from './components/VideoPlaceholder';
import { stopSpeaking } from './speech';
import type { BootstrapContent, SectionId } from './types';

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
  const sessionId = useMemo(() => getSessionId(), []);

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
        {section === 'game' && (
          <GameExperience
            levels={content.levels}
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
    </div>
  );
}
