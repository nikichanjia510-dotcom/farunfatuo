import { describe, expect, it } from 'vitest';
import { containsPersonalIdentifier } from '../src/privacy.js';

describe('containsPersonalIdentifier', () => {
  it('detects phone, email and Chinese ID card patterns', () => {
    expect(containsPersonalIdentifier('请联系13800138000')).toBe(true);
    expect(containsPersonalIdentifier('邮箱 parent@example.com')).toBe(true);
    expect(containsPersonalIdentifier('身份证 11010519491231002X')).toBe(true);
  });

  it('allows ordinary anonymous feedback', () => {
    expect(containsPersonalIdentifier('按钮很清楚，希望增加更多场景。')).toBe(false);
  });
});
