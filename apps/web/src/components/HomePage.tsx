import {
  ArrowRight,
  Bot,
  Gamepad2,
  HeartHandshake,
  Mic2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Mascot } from './Mascot';

interface HomePageProps {
  levelCount: number;
  knowledgeCount: number;
  onStartGame: () => void;
  onStartAssistant: () => void;
  onOpenSources: () => void;
}

export function HomePage({
  levelCount,
  knowledgeCount,
  onStartGame,
  onStartAssistant,
  onOpenSources,
}: HomePageProps) {
  return (
    <div className="home-page">
      <section className="hero page-shell">
        <div className="hero__copy">
          <p className="eyebrow">
            <Sparkles aria-hidden="true" /> 暑期法学实践调研项目
          </p>
          <h1>
            陪宝宝在游戏里
            <span>认识安全 · 学会表达 · 勇敢求助</span>
          </h1>
          <p className="hero__lead">
            “托宝”把托育法治草案科普、亲子早教游戏和可信问答放进一个温暖、简单的网页里。
          </p>
          <div className="hero__actions">
            <button type="button" className="button button--primary button--large" onClick={onStartGame}>
              <Gamepad2 aria-hidden="true" /> 开始成长游戏
              <ArrowRight aria-hidden="true" />
            </button>
            <button type="button" className="button button--soft button--large" onClick={onStartAssistant}>
              <Bot aria-hidden="true" /> 问问托宝
            </button>
          </div>
          <button className="text-link" type="button" onClick={onOpenSources}>
            查看草案来源与使用边界
          </button>
        </div>
        <div className="hero__visual" aria-label="托宝产品概览">
          <div className="hero-orbit hero-orbit--one">安全环境</div>
          <div className="hero-orbit hero-orbit--two">身体边界</div>
          <div className="hero-orbit hero-orbit--three">可信求助</div>
          <Mascot size="large" />
          <div className="hero-badge">
            <ShieldCheck aria-hidden="true" />
            <span>家长陪同使用</span>
          </div>
        </div>
      </section>

      <section className="stats-strip" aria-label="产品内容数据">
        <div className="page-shell stats-grid">
          <div>
            <strong>{levelCount}</strong>
            <span>个陪伴式关卡</span>
          </div>
          <div>
            <strong>{knowledgeCount}</strong>
            <span>条审核知识</span>
          </div>
          <div>
            <strong>0</strong>
            <span>儿童身份信息采集</span>
          </div>
          <div>
            <strong>24h</strong>
            <span>离线知识可用</span>
          </div>
        </div>
      </section>

      <section className="section page-shell">
        <div className="section-heading">
          <p className="eyebrow">一站式亲子法治科普</p>
          <h2>从“看懂”到“会做”，每一步都温柔而清晰</h2>
        </div>
        <div className="feature-grid">
          <article className="feature-card feature-card--yellow">
            <span className="feature-card__icon"><Gamepad2 /></span>
            <h3>成长游戏</h3>
            <p>大按钮、短指令、无倒计时，不用害怕答错，和家长一起发现安全做法。</p>
          </article>
          <article className="feature-card feature-card--mint">
            <span className="feature-card__icon"><Bot /></span>
            <h3>双模式助手</h3>
            <p>儿童模式使用温和短句，家长模式提供带来源的草案科普与行动建议。</p>
          </article>
          <article className="feature-card feature-card--peach">
            <span className="feature-card__icon"><Mic2 /></span>
            <h3>可选语音交互</h3>
            <p>主动开启后可说出问题、听到旁白；应用不保存录音，不支持时仍可打字。</p>
          </article>
        </div>
      </section>

      <section className="safety-banner page-shell">
        <HeartHandshake aria-hidden="true" />
        <div>
          <p className="eyebrow">给陪同大人的一句话</p>
          <h2>最好的早教不是“答对”，而是让宝宝知道：不舒服时有人愿意听。</h2>
        </div>
      </section>
    </div>
  );
}
