import { FormEvent, useState } from 'react';
import { Database, Download, KeyRound, LockKeyhole } from 'lucide-react';
import { downloadFeedback } from '../api';

export function AdminPanel() {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleExport(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!token) {
      setStatus('请输入管理令牌。');
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      await downloadFeedback(token);
      setStatus('匿名反馈 CSV 已开始下载。令牌不会被保存。');
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : '导出失败。');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="admin-page page-shell" aria-labelledby="admin-title">
      <div className="admin-card">
        <div className="admin-card__icon"><Database /></div>
        <p className="eyebrow">调研数据导出</p>
        <h1 id="admin-title">匿名数据管理</h1>
        <p>
          仅导出角色、评分、标签、建议和提交时间。关卡结果与助手事件不包含聊天正文、录音或儿童身份信息。
        </p>
        <form onSubmit={(event) => void handleExport(event)}>
          <label htmlFor="admin-token">
            <KeyRound /> 管理令牌
          </label>
          <div className="token-field">
            <input
              id="admin-token"
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              autoComplete="off"
              placeholder="输入 ADMIN_TOKEN"
            />
            <button className="button button--primary" type="submit" disabled={loading}>
              <Download /> {loading ? '正在导出…' : '导出 CSV'}
            </button>
          </div>
        </form>
        {status && <p className="admin-status" role="status">{status}</p>}
        <div className="privacy-note">
          <LockKeyhole />
          <p>令牌只用于本次请求，不写入浏览器存储。部署前必须修改示例令牌。</p>
        </div>
      </div>
    </section>
  );
}
