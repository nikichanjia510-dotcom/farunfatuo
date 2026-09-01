import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useTuobaoProgress } from './useTuobaoProgress';

describe('useTuobaoProgress', () => {
  it('stores the matching law text when an age level is selected and prevents duplicate sign-ins for the same day', () => {
    const { result } = renderHook(() => useTuobaoProgress());

    act(() => {
      result.current.setAgeLevel('3-6');
    });

    expect(result.current.state.userAgeLevel).toBe('3-6');
    expect(result.current.state.dailyLawArticleNo).toBe('第18条');
    expect(result.current.state.dailyLawText).toContain('托育机构应当保护婴幼儿的人身安全');

    const blob = new Blob(['demo-audio'], { type: 'audio/mpeg' });

    act(() => {
      result.current.completeSignIn(blob);
    });

    expect(result.current.state.signTotalDays).toBe(1);
    expect(result.current.state.signLastDate).toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(result.current.hasSignedToday).toBe(true);

    act(() => {
      result.current.completeSignIn(new Blob(['same-day-repeat'], { type: 'audio/mpeg' }));
    });

    expect(result.current.state.signTotalDays).toBe(1);
  });
});
