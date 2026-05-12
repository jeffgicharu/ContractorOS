import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  inviteAcceptSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
} from './auth.schema';

describe('loginSchema', () => {
  it('accepts a valid email and non-empty password', () => {
    const result = loginSchema.safeParse({ email: 'admin@org.test', password: 'whatever' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'whatever' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['email']);
  });

  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({ email: 'admin@org.test', password: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['password']);
  });
});

describe('inviteAcceptSchema', () => {
  const baseValid = {
    token: 'abc-123',
    password: 'StrongPass1',
    firstName: 'Casey',
    lastName: 'Contractor',
  };

  it('accepts a valid invite-accept payload', () => {
    expect(inviteAcceptSchema.safeParse(baseValid).success).toBe(true);
  });

  it('rejects a password without an uppercase letter', () => {
    const result = inviteAcceptSchema.safeParse({ ...baseValid, password: 'weakpass1' });
    expect(result.success).toBe(false);
  });

  it('rejects a password shorter than 8 chars', () => {
    const result = inviteAcceptSchema.safeParse({ ...baseValid, password: 'Aa1' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing firstName', () => {
    const result = inviteAcceptSchema.safeParse({ ...baseValid, firstName: '' });
    expect(result.success).toBe(false);
  });
});

describe('passwordResetRequestSchema', () => {
  it('accepts a valid email', () => {
    expect(passwordResetRequestSchema.safeParse({ email: 'a@b.test' }).success).toBe(true);
  });
  it('rejects an invalid email', () => {
    expect(passwordResetRequestSchema.safeParse({ email: 'bad' }).success).toBe(false);
  });
});

describe('passwordResetSchema', () => {
  it('accepts a strong new password with a token', () => {
    expect(
      passwordResetSchema.safeParse({ token: 'abc', newPassword: 'StrongPass1' }).success,
    ).toBe(true);
  });
  it('rejects a missing token', () => {
    expect(
      passwordResetSchema.safeParse({ token: '', newPassword: 'StrongPass1' }).success,
    ).toBe(false);
  });
});
