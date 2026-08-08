import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FeedbackPanel } from './FeedbackPanel';

vi.mock('../api', () => ({
  saveFeedback: vi.fn(async () => undefined),
}));

describe('FeedbackPanel', () => {
  it('requires a rating and submits anonymous feedback', async () => {
    const user = userEvent.setup();
    render(<FeedbackPanel sessionId="session-test-123" />);
    await user.click(screen.getByRole('button', { name: '匿名提交反馈' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/选择.*评分/);

    await user.click(screen.getByRole('radio', { name: '5 星' }));
    await user.click(screen.getByRole('button', { name: '界面友好' }));
    await user.type(screen.getByLabelText(/还有什么想告诉我们/), '关卡很清楚');
    await user.click(screen.getByRole('button', { name: '匿名提交反馈' }));
    expect(await screen.findByText('谢谢你帮助托宝变得更好')).toBeInTheDocument();
  });
});
