import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Header } from './Header';

describe('Header age switch', () => {
  afterEach(() => cleanup());

  it('keeps the current age visible and reopens age selection', async () => {
    const onChangeAge = vi.fn();
    const user = userEvent.setup();
    render(
      <Header
        activeSection="home"
        onNavigate={() => undefined}
        soundEnabled={false}
        onToggleSound={() => undefined}
        highContrast={false}
        onToggleContrast={() => undefined}
        reduceMotion={false}
        onToggleMotion={() => undefined}
        ageLevel="6-12"
        onChangeAge={onChangeAge}
      />,
    );

    const switchButton = screen.getByRole('button', { name: /切换年龄段，当前6-12 岁/ });
    expect(switchButton).toBeVisible();
    await user.click(switchButton);
    expect(onChangeAge).toHaveBeenCalledOnce();
  });
});
