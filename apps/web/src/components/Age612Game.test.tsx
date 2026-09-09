import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Age612Game } from './Age612Game';

vi.mock('../api', () => ({
  saveGameResult: vi.fn(async () => undefined),
}));

function renderGame() {
  return render(
    <Age612Game
      sessionId="session-age-612"
      soundEnabled={false}
      onBack={() => undefined}
    />,
  );
}

describe('Age612Game', () => {
  beforeEach(() => {
    localStorage.clear();
    window.scrollTo = vi.fn();
  });

  afterEach(() => cleanup());

  it('shows all nine careers and keeps the prosecutor conditionally locked', async () => {
    const user = userEvent.setup();
    renderGame();

    await user.click(screen.getByRole('button', { name: /开启案件/ }));

    expect(screen.getByRole('heading', { name: '托育园主班老师' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '幼儿家长' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '卫健局执法检查员' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '未成年人检察官' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '查看职业预览' })).toHaveLength(5);
    expect(screen.getByRole('button', { name: /拒不整改分支解锁/ })).toBeDisabled();
  });

  it('lets the player collect evidence and rewind a wrong decision', async () => {
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole('button', { name: /开启案件/ }));

    const teacherCard = screen.getByRole('heading', { name: '托育园主班老师' }).closest('article');
    expect(teacherCard).not.toBeNull();
    await user.click(within(teacherCard!).getByRole('button', { name: /进入主线/ }));

    await user.click(screen.getByRole('button', { name: /幼儿磕碰照片/ }));
    await user.click(screen.getByRole('button', { name: /家长口述投诉记录/ }));
    await user.click(screen.getByRole('button', { name: /班级近三日看护值班表/ }));
    await user.click(screen.getByRole('button', { name: /只口头劝慰/ }));
    expect(screen.getByText(/留下处理断点/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /回溯重选/ }));
    expect(screen.queryByText(/留下处理断点/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /书面记录全部内容/ }));
    expect(screen.getByText('已归档 3 项')).toBeInTheDocument();
    expect(screen.getByText(/处理得当/)).toBeInTheDocument();
  });

  it('restores the prosecutor unlock from local progress', async () => {
    localStorage.setItem('tuobao-age-6-12-progress-v1', JSON.stringify({
      completedRoles: ['parent'],
      prosecutorUnlocked: true,
    }));
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole('button', { name: /开启案件/ }));

    const prosecutorCard = screen.getByRole('heading', { name: '未成年人检察官' }).closest('article');
    expect(prosecutorCard).not.toBeNull();
    expect(within(prosecutorCard!).getByRole('button', { name: /进入主线/ })).toBeEnabled();
  });
});
