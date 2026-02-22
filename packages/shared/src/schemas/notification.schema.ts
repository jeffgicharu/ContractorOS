import { z } from 'zod';

export const notificationListQuerySchema = z.object({
  unreadOnly: z.coerce.boolean().optional().default(false),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
