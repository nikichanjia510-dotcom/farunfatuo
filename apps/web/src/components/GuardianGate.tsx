import { HeartHandshake, ShieldCheck, X } from 'lucide-react';
import { Mascot } from './Mascot';

interface GuardianGateProps {
  destination: string;
  onAccept: () => void;
  onCancel: () => void;
}

export function GuardianGate({
  destination,
  onAccept,
  onCancel,
}: GuardianGateProps) {
  return (
    <div className="dialog-backdrop" role="presentation">
      <section
        className="guardian-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guardian-title"
      >
        <button
          className="dialog-close"
          type="button"
          onClick={onCancel}
          aria-label="关闭陪同提示"
        >
          <X />
        </button>
        <Mascot size="medium" />
        <p className="eyebrow">开始{destination}前</p>
        <h2 id="guardian-title">请由家长或可信照护者全程陪同</h2>
        <div className="guardian-points">
          <p>
            <HeartHandshake aria-hidden="true" />
            0—3 岁婴幼儿不应独立使用本产品。
          </p>
          <p>
            <ShieldCheck aria-hidden="true" />
            不输入姓名、电话、健康记录等个人信息。
          </p>
        </div>
        <p className="subtle">
          产品用于公益科普与亲子互动，不替代法律、医疗或紧急服务。
        </p>
        <div className="dialog-actions">
          <button type="button" className="button button--ghost" onClick={onCancel}>
            稍后再用
          </button>
          <button type="button" className="button button--primary" onClick={onAccept}>
            我会陪同使用
          </button>
        </div>
      </section>
    </div>
  );
}
