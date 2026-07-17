import { describe, it, expect } from 'vitest';
import {
  clipboardUpdateSchema,
  CLIPBOARD_CONTENT_MAX_LENGTH,
} from './clipboard.schema';

describe('clipboardUpdateSchema', () => {
  it('accepts a plain link', () => {
    const result = clipboardUpdateSchema.safeParse({
      content: 'https://claude.ai/public/artifacts/455e139f',
    });
    expect(result.success).toBe(true);
  });

  it('trims surrounding whitespace', () => {
    const result = clipboardUpdateSchema.parse({ content: '  hello  ' });
    expect(result.content).toBe('hello');
  });

  it('rejects empty content', () => {
    expect(clipboardUpdateSchema.safeParse({ content: '' }).success).toBe(false);
  });

  it('rejects whitespace-only content', () => {
    expect(clipboardUpdateSchema.safeParse({ content: '   ' }).success).toBe(false);
  });

  it('rejects content over the max length', () => {
    const result = clipboardUpdateSchema.safeParse({
      content: 'a'.repeat(CLIPBOARD_CONTENT_MAX_LENGTH + 1),
    });
    expect(result.success).toBe(false);
  });

  it('accepts content exactly at the max length', () => {
    const result = clipboardUpdateSchema.safeParse({
      content: 'a'.repeat(CLIPBOARD_CONTENT_MAX_LENGTH),
    });
    expect(result.success).toBe(true);
  });

  it('rejects a missing content field', () => {
    expect(clipboardUpdateSchema.safeParse({}).success).toBe(false);
  });
});
