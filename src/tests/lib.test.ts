import { describe, it, expect } from 'vitest';
import { formatDate, getErrorMessage } from '../lib/utils';
import { loginSchema } from '../lib/schemas';

describe('utils', () => {
  it('getErrorMessage returns message from Error', () => {
    expect(getErrorMessage(new Error('oops'))).toBe('oops');
  });

  it('getErrorMessage falls back for unknown', () => {
    expect(getErrorMessage(null)).toBe('An unexpected error occurred');
  });

  it('formatDate returns a non-empty string', () => {
    const result = formatDate('2024-01-01T00:00:00Z');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'secret123' }).success).toBe(true);
  });

  it('rejects short password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'short' }).success).toBe(false);
  });

  it('rejects invalid email', () => {
    expect(loginSchema.safeParse({ email: 'bad', password: 'secret123' }).success).toBe(false);
  });
});
