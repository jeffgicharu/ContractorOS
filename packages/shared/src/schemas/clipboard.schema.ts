import { z } from 'zod';

export const CLIPBOARD_CONTENT_MAX_LENGTH = 5000;

export const clipboardUpdateSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Content is required')
    .max(
      CLIPBOARD_CONTENT_MAX_LENGTH,
      `Content must be at most ${CLIPBOARD_CONTENT_MAX_LENGTH} characters`,
    ),
});

export type ClipboardUpdateInput = z.infer<typeof clipboardUpdateSchema>;
