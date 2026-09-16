import { HeartHandshake, PauseCircle, ShieldCheck } from 'lucide-react';
import { publicAsset } from '../publicAsset';
import { Mascot } from './Mascot';

export function VideoPlaceholder() {
  return (
    <section className="video-page page-shell" aria-labelledby="video-title">
      <div className="section-heading section-heading--left">
        <p className="eyebrow">托宝法治科普动画</p>
        <h1 id="video-title">让复杂条文，变成宝宝听得懂的小故事</h1>
        <p>
          请家长陪同孩子一起观看。播放过程中可以随时暂停，用孩子熟悉的语言聊一聊故事里的安全本领。
        </p>
      </div>
      <div className="video-shell">
        <div className="video-shell__preview">
          <video
            controls
            playsInline
            preload="metadata"
            src={publicAsset('assets/tuobao/legal-video.mp4')}
            aria-label="托宝法治科普动画"
          >
            您的浏览器暂不支持视频播放，请升级浏览器后重试。
          </video>
        </div>
        <div className="video-shell__copy">
          <Mascot size="small" />
          <h2>亲子观看小提示</h2>
          <ol>
            <li><strong>一起观看</strong><span>由家长或可信照护者陪同孩子观看</span></li>
            <li><strong>随时暂停</strong><span>遇到重要情节时，停下来问问孩子的想法</span></li>
            <li><strong>看后复述</strong><span>邀请孩子说出“不要”和“找大人”等安全表达</span></li>
          </ol>
          <div className="replacement-spec">
            <p><HeartHandshake /> 陪伴观看，不让视频替代亲子交流</p>
            <p><PauseCircle /> 支持播放、暂停、进度和音量控制</p>
            <p><ShieldCheck /> 观看后结合真实生活场景温和复习</p>
          </div>
        </div>
      </div>
    </section>
  );
}
