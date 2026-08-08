import { FileVideo2, Play, Replace, ShieldCheck } from 'lucide-react';
import { Mascot } from './Mascot';

export function VideoPlaceholder() {
  return (
    <section className="video-page page-shell" aria-labelledby="video-title">
      <div className="section-heading section-heading--left">
        <p className="eyebrow">草案科普动画预留位</p>
        <h1 id="video-title">让复杂条文，变成宝宝听得懂的小故事</h1>
        <p>
          当前版本提供经过设计的播放容器。宣传组交付正式动画后，只需替换一个文件和封面，无需修改业务代码。
        </p>
      </div>
      <div className="video-shell">
        <div className="video-shell__preview">
          <img src="/assets/tuobao/video-placeholder.svg" alt="科普动画占位封面" />
          <button type="button" disabled aria-label="动画素材尚未加入">
            <Play />
          </button>
          <span>正式动画待替换</span>
        </div>
        <div className="video-shell__copy">
          <Mascot size="small" />
          <h2>建议动画结构</h2>
          <ol>
            <li><strong>30 秒认识托宝</strong><span>建立陪伴感和家长陪同提示</span></li>
            <li><strong>90 秒安全小故事</strong><span>用一个场景解释一种安全本领</span></li>
            <li><strong>30 秒亲子复述</strong><span>邀请宝宝说出“不要”和“找大人”</span></li>
          </ol>
          <div className="replacement-spec">
            <p><FileVideo2 /> 视频：MP4 / WebM，建议 1920×1080</p>
            <p><Replace /> 封面：WebP / PNG，建议 16:9</p>
            <p><ShieldCheck /> 不出现可识别儿童信息，配字幕和旁白</p>
          </div>
        </div>
      </div>
    </section>
  );
}
