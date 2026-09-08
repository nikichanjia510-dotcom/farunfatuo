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

interface NewsItem {
  title: string;
  href: string;
  cover: string;
}

interface HomePageProps {
  levelCount: number;
  knowledgeCount: number;
  onStartGame: () => void;
  onStartAssistant: () => void;
  onOpenSources: () => void;
}

function buildNewsCover(title: string, accent: string): string {
  const safeTitle = title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  const lines = safeTitle.length > 12 ? [safeTitle.slice(0, 12), safeTitle.slice(12)].join('\n') : safeTitle;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#f8f5ee"/>
          <stop offset="100%" stop-color="#f5efea"/>
        </linearGradient>
      </defs>
      <rect width="640" height="400" rx="36" fill="url(#bg)"/>
      <circle cx="90" cy="80" r="48" fill="${accent}" opacity="0.18"/>
      <circle cx="560" cy="310" r="62" fill="${accent}" opacity="0.14"/>
      <path d="M32 300 C 140 225, 220 355, 342 280 S 510 210, 606 250" fill="none" stroke="${accent}" stroke-width="12" stroke-linecap="round" opacity="0.42"/>
      <rect x="72" y="64" width="496" height="272" rx="34" fill="rgba(255,255,255,0.26)"/>
      <g fill="#fff" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-weight="700">
        <text x="50%" y="53%" text-anchor="middle" font-size="34" opacity="0.9">${lines.split('\n')[0] || '托宝'}</text>
        <text x="50%" y="63%" text-anchor="middle" font-size="34" opacity="0.9">${lines.split('\n')[1] || '家长科普'}</text>
      </g>
      <g fill="${accent}" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-weight="700">
        <text x="50%" y="75%" text-anchor="middle" font-size="24" opacity="0.75">家长科普文</text>
      </g>
    </svg>
  `)}`;
}

const newsItems: NewsItem[] = [
  {
    title: '【家长科普文】第1期：“托育”是什么？',
    href: 'https://mp.weixin.qq.com/s/zSvYAgOHOJBL7nfu5AJDoQ',
    cover: buildNewsCover('【家长科普文】第1期：“托育”是什么？', '#f7b267'),
  },
  {
    title: '【家长科普文】第2期（上）：送孩子去托育机构前，家长通常会关心哪些问题？',
    href: 'https://mp.weixin.qq.com/s/-KzdW11JzVp_W5QEMBZsYw',
    cover: buildNewsCover('【家长科普文】第2期（上）', '#7ec8a0'),
  },
  {
    title: '【家长科普文】第3期（上）：送孩子去托育机构前，家长通常会关心哪些问题？',
    href: 'https://mp.weixin.qq.com/s/XAPnO6kRBm6bWApURbpK4w',
    cover: buildNewsCover('【家长科普文】第3期（上）', '#f29bb2'),
  },
  {
    title: '托育纠纷的处理途径',
    href: 'https://mp.weixin.qq.com/s/QWfluEUQiCGGCc1EWfoRDg',
    cover: buildNewsCover('托育纠纷的处理途径', '#7cc8ff'),
  },
  {
    title: '【家长科普文】第2期（下）：送孩子去托育机构前，家长通常会关心哪些问题？',
    href: 'https://mp.weixin.qq.com/s/l7nefxOJmMHYzrnYd2DhXQ',
    cover: buildNewsCover('【家长科普文】第2期（下）', '#ffc857'),
  },
  {
    title: '【家长科普文】第3期（下）：托育机构的安全与健康管理',
    href: 'https://mp.weixin.qq.com/s/qErhnReN3coDFy7LcTpSnA',
    cover: buildNewsCover('【家长科普文】第3期（下）', '#9ad0c2'),
  },
  {
    title: '【家长科普文】第5期：家庭衔接篇：把托育好习惯“搬”回家',
    href: 'https://mp.weixin.qq.com/s/OWfX97J92n4eVZyxskequQ',
    cover: buildNewsCover('【家长科普文】第5期', '#f2b5d4'),
  },
  {
    title: '【家长科普文】第6期：托育机构资质线上查，家长选机构“关键信息”别漏看！',
    href: 'https://mp.weixin.qq.com/s/3Ou8sigVEE3BAa1DA4N74A',
    cover: buildNewsCover('【家长科普文】第6期', '#b8d7f8'),
  },
  {
    title: '【家长科普文】第7期：托育机构的健康指南',
    href: 'https://mp.weixin.qq.com/s/zHdpLEx0E1iMM1phyI1n1Q',
    cover: buildNewsCover('【家长科普文】第7期', '#f0b98f'),
  },
  {
    title: '【家长科普文】第8期：分离焦虑篇：不止是孩子的哭，更是家长的修行',
    href: 'https://mp.weixin.qq.com/s/dA6LjbgPz6E2pTQOQUA2jQ',
    cover: buildNewsCover('【家长科普文】第8期', '#9bc1bc'),
  },
];

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

      <section className="news-section page-shell" aria-labelledby="news-title">
        <div className="section-heading section-heading--left news-heading">
          <p className="eyebrow">家长科普与资讯</p>
          <h2 id="news-title">托宝精选文章</h2>
        </div>
        <div className="news-slider" aria-label="托宝新闻资讯列表">
          {newsItems.map((item) => (
            <a
              key={item.href}
              className="news-card"
              href={item.href}
              target="_blank"
              rel="noreferrer"
            >
              <div className="news-card__image-wrap">
                <img src={item.cover} alt={item.title} />
                <div className="news-card__overlay" aria-hidden="true" />
                <span className="news-card__tag">家长科普</span>
                <div className="news-card__title-overlay">{item.title}</div>
              </div>
            </a>
          ))}
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
