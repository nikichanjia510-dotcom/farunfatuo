import { FormEvent, useState } from 'react';
import { CheckCircle2, Heart, MessageSquareHeart, Send } from 'lucide-react';
import { saveFeedback } from '../api';
import { Mascot } from './Mascot';

interface FeedbackPanelProps {
  sessionId: string;
}

const tagOptions = ['界面友好', '关卡清晰', '宝宝愿意参与', '回答有帮助', '需要继续优化'];

export function FeedbackPanel({ sessionId }: FeedbackPanelProps) {
  const [role, setRole] = useState<'guardian' | 'institution' | 'student' | 'practitioner'>('guardian');
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function toggleTag(tag: string): void {
    setTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag].slice(0, 5),
    );
  }

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (rating === 0) {
      setError('请先选择 1—5 星体验评分。');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await saveFeedback({ sessionId, role, rating, tags, comment });
      setSubmitted(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '提交失败，请稍后再试。');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section className="feedback-success page-shell" aria-labelledby="feedback-success-title">
        <Mascot size="large" mood="celebrate" />
        <CheckCircle2 aria-hidden="true" />
        <p className="eyebrow">本机匿名反馈已记录</p>
        <h1 id="feedback-success-title">谢谢你帮助托宝变得更好</h1>
        <p>反馈仅保存在当前浏览器，没有上传姓名、联系方式或儿童身份信息。</p>
        <button
          type="button"
          className="button button--soft"
          onClick={() => {
            setSubmitted(false);
            setRating(0);
            setTags([]);
            setComment('');
          }}
        >
          再提交一份反馈
        </button>
      </section>
    );
  }

  return (
    <section className="feedback-page page-shell" aria-labelledby="feedback-title">
      <div className="feedback-intro">
        <div>
          <p className="eyebrow">产品试用调研</p>
          <h1 id="feedback-title">你的感受，是下一次优化的起点</h1>
          <p>静态演示仅在当前浏览器记录角色、评分和建议。请不要填写姓名、电话、邮箱、身份证号或儿童健康信息。</p>
        </div>
        <MessageSquareHeart aria-hidden="true" />
      </div>
      <form className="feedback-form" onSubmit={(event) => void handleSubmit(event)}>
        <fieldset>
          <legend><span>1</span> 你以什么身份体验？</legend>
          <div className="role-options">
            {[
              ['guardian', '婴幼儿家长'],
              ['institution', '托育机构人员'],
              ['practitioner', '教育/法律从业者'],
              ['student', '项目成员或学生'],
            ].map(([value, label]) => (
              <label key={value}>
                <input
                  type="radio"
                  name="role"
                  value={value}
                  checked={role === value}
                  onChange={() => setRole(value as typeof role)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend><span>2</span> 整体体验如何？</legend>
          <div className="rating-options" role="radiogroup" aria-label="体验评分">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                className={rating >= value ? 'is-selected' : ''}
                onClick={() => setRating(value)}
                aria-label={`${value} 星`}
              >
                <Heart fill={rating >= value ? 'currentColor' : 'none'} />
              </button>
            ))}
            <span>{rating ? `${rating} 星` : '请选择'}</span>
          </div>
        </fieldset>
        <fieldset>
          <legend><span>3</span> 哪些方面给你留下印象？</legend>
          <div className="tag-options">
            {tagOptions.map((tag) => (
              <button
                type="button"
                key={tag}
                className={tags.includes(tag) ? 'is-selected' : ''}
                aria-pressed={tags.includes(tag)}
                onClick={() => toggleTag(tag)}
              >
                {tags.includes(tag) && <CheckCircle2 />}
                {tag}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="comment-field" htmlFor="feedback-comment">
          <strong><span>4</span> 还有什么想告诉我们？</strong>
          <textarea
            id="feedback-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={5}
            maxLength={500}
            placeholder="例如：宝宝最喜欢哪个环节、哪句话不够清楚…（请勿填写个人信息）"
          />
          <small>{comment.length} / 500</small>
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="button button--primary button--large" disabled={submitting}>
          <Send /> {submitting ? '正在提交…' : '匿名提交反馈'}
        </button>
      </form>
    </section>
  );
}
