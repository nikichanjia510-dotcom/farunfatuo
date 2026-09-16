import {
  Baby,
  BookOpenText,
  Bot,
  ClipboardCheck,
  Gamepad2,
  Home,
  KeyRound,
  MoonStar,
  SunMedium,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { SectionId } from '../types';
import type { AgeLevel } from '../useTuobaoProgress';

interface HeaderProps {
  activeSection: SectionId;
  onNavigate: (section: SectionId) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  highContrast: boolean;
  onToggleContrast: () => void;
  reduceMotion: boolean;
  onToggleMotion: () => void;
  ageLevel: AgeLevel | null;
  onChangeAge: () => void;
}

const navigation: Array<{
  id: SectionId;
  label: string;
  icon: typeof Home;
}> = [
  { id: 'home', label: '首页', icon: Home },
  { id: 'game', label: '成长游戏', icon: Gamepad2 },
  { id: 'assistant', label: '托宝助手', icon: Bot },
  { id: 'video', label: '科普动画', icon: BookOpenText },
  { id: 'feedback', label: '试用反馈', icon: ClipboardCheck },
  { id: 'sources', label: '来源说明', icon: KeyRound },
];

export function Header({
  activeSection,
  onNavigate,
  soundEnabled,
  onToggleSound,
  highContrast,
  onToggleContrast,
  reduceMotion,
  onToggleMotion,
  ageLevel,
  onChangeAge,
}: HeaderProps) {
  const ageLabel = ageLevel ? `${ageLevel} 岁` : '选择年龄';
  const compactForInvestigation = activeSection === 'game' && ageLevel === '6-12';

  return (
    <header className={`site-header ${compactForInvestigation ? 'site-header--compact-game' : ''}`}>
      <div className="site-header__inner page-shell">
      <div className="site-header__top">
        <button
          className="brand"
          type="button"
          onClick={() => onNavigate('home')}
          aria-label="返回托宝首页"
        >
          <span className="brand__mark" aria-hidden="true">
            托
          </span>
          <span>
            <strong>托宝</strong>
            <small>法润托育 · 智护成长</small>
          </span>
        </button>
        <div className="accessibility-tools" aria-label="阅读辅助设置">
          <button
            type="button"
            className="age-switch"
            onClick={onChangeAge}
            aria-label={`切换年龄段，当前${ageLabel}`}
            title="切换年龄段"
          >
            <Baby aria-hidden="true" />
            <span><small>当前年龄段</small><strong>{ageLabel}</strong></span>
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={onToggleSound}
            aria-pressed={soundEnabled}
            title={soundEnabled ? '关闭旁白' : '开启旁白'}
          >
            {soundEnabled ? <Volume2 /> : <VolumeX />}
            <span className="sr-only">
              {soundEnabled ? '关闭旁白' : '开启旁白'}
            </span>
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={onToggleContrast}
            aria-pressed={highContrast}
            title="切换高对比度"
          >
            {highContrast ? <SunMedium /> : <MoonStar />}
            <span className="sr-only">切换高对比度</span>
          </button>
          <button
            type="button"
            className="motion-toggle"
            onClick={onToggleMotion}
            aria-pressed={reduceMotion}
            aria-label={`切换动效，当前${reduceMotion ? '已简化' : '已开启'}`}
            title={reduceMotion ? '恢复页面动效' : '减少页面动效'}
          >
            <span className="motion-toggle__dot" aria-hidden="true" />
            <span>{reduceMotion ? '动效简化' : '动效开启'}</span>
          </button>
        </div>
      </div>
      <nav className="main-nav" aria-label="主要导航">
        {navigation.map(({ id, label, icon: Icon }) => (
          <button
            type="button"
            key={id}
            className={activeSection === id ? 'is-active' : ''}
            onClick={() => onNavigate(id)}
            aria-current={activeSection === id ? 'page' : undefined}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      </div>
    </header>
  );
}
