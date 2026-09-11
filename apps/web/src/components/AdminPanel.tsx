import { useState } from 'react';
import { Database, Download, HardDrive } from 'lucide-react';
import { downloadFeedback } from '../api';

export function AdminPanel() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleExport(): Promise<void> {
    setLoading(true);
    setStatus('');
    try {
      await downloadFeedback();
      setStatus('本浏览器保存的匿名反馈 CSV 已开始下载。');
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
        <p className="eyebrow">静态演示数据</p>
        <h1 id="admin-title">本机匿名数据</h1>
        <p>
          静态版本只在当前浏览器保存反馈，不会汇总其他访客的数据，也不会上传聊天正文、录音或儿童身份信息。
        </p>
        <button
          className="button button--primary"
          type="button"
          disabled={loading}
          onClick={() => void handleExport()}
        >
          <Download /> {loading ? '正在导出…' : '导出本机 CSV'}
        </button>
        {status && <p className="admin-status" role="status">{status}</p>}
        <div className="privacy-note">
          <HardDrive />
          <p>清除浏览器站点数据后，本机反馈也会一并删除。</p>
        </div>
      </div>
    </section>
  );
}
