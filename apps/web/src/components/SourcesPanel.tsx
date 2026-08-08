import { ExternalLink, FileCheck2, Info, Scale, ShieldCheck } from 'lucide-react';
import type { BootstrapContent } from '../types';

interface SourcesPanelProps {
  content: BootstrapContent;
}

export function SourcesPanel({ content }: SourcesPanelProps) {
  return (
    <section className="sources-page page-shell" aria-labelledby="sources-title">
      <div className="section-heading section-heading--left">
        <p className="eyebrow">内容来源与使用边界</p>
        <h1 id="sources-title">每个回答有出处，每条边界说清楚</h1>
        <p>{content.notice}</p>
      </div>

      <div className="status-callout">
        <Scale aria-hidden="true" />
        <div>
          <h2>重要：目前仍是“草案科普”</h2>
          <p>
            《中华人民共和国托育服务法》仍处于立法审议阶段。页面统一使用“草案提出”“草案拟规定”等表达，具体权利义务以最终通过文本和当地现行规定为准。
          </p>
        </div>
      </div>

      <div className="source-summary">
        <div><FileCheck2 /><strong>{content.knowledge.length}</strong><span>条已审核知识</span></div>
        <div><ShieldCheck /><strong>仅 approved</strong><span>生产环境可见</span></div>
        <div><Info /><strong>{content.version}</strong><span>内容版本</span></div>
      </div>

      <div className="knowledge-list">
        {content.knowledge.map((item) => (
          <article key={item.id}>
            <div className="knowledge-list__heading">
              <div>
                <span>{item.source.status}</span>
                <h2>{item.title}</h2>
              </div>
              <a href={item.source.url} target="_blank" rel="noreferrer">
                官方来源 <ExternalLink />
              </a>
            </div>
            <p>{item.answer}</p>
            <footer>
              <span>{item.source.title}</span>
              <span>{item.source.article}</span>
              <span>更新：{item.source.updatedAt}</span>
            </footer>
          </article>
        ))}
      </div>

      <div className="boundary-grid">
        <article>
          <h2>本产品可以做什么</h2>
          <ul>
            <li>提供已审核的公益法治科普</li>
            <li>帮助亲子练习安全表达和求助</li>
            <li>展示内容来源和草案状态</li>
          </ul>
        </article>
        <article>
          <h2>本产品不做什么</h2>
          <ul>
            <li>不判断具体案件责任或胜诉结果</li>
            <li>不进行疾病诊断、用药和急救替代</li>
            <li>不收集儿童姓名、录音和健康记录</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
