import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameLevel } from '../types';
import { GameExperience } from './GameExperience';

vi.mock('../api', () => ({
  saveGameResult: vi.fn(async () => undefined),
}));

const level: GameLevel = {
  id: 'test-level',
  ageLevel: '3-6',
  order: 1,
  title: '测试安全关卡',
  shortTitle: '会选择',
  theme: 'sunshine',
  emoji: '🏡',
  summary: '测试关卡',
  sourceKnowledgeIds: ['safe-environment'],
  scenes: [
    {
      id: 'scene-1',
      prompt: '哪一个更安全？',
      narration: '请选安全做法',
      illustration: '🧸',
      choices: [
        { id: 'wrong', label: '危险做法', isSafe: false, feedback: '再想想' },
        { id: 'right', label: '安全做法', isSafe: true, feedback: '答对了' },
      ],
    },
  ],
};

describe('GameExperience', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
  });

  it('allows retry without penalty and completes the level', async () => {
    const user = userEvent.setup();
    render(
      <GameExperience
        levels={[level]}
        ageLevel="3-6"
        sessionId="session-test-123"
        soundEnabled={false}
        onBack={() => undefined}
      />,
    );

    await user.click(screen.getByRole('button', { name: '开始这一关' }));
    await user.click(screen.getByRole('button', { name: /危险做法/ }));
    expect(screen.getByText('再想想')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /安全做法/ }));
    expect(screen.getByText('答对了')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '领取成长徽章' }));
    expect(screen.getByText(/完成“会选择”练习/)).toBeInTheDocument();
  });
});
