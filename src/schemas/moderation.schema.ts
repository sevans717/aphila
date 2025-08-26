import { z } from 'zod';

export const createReportSchema = z.object({
  body: z.object({
    reportedId: z.string().uuid(),
    reason: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    contentId: z.string().uuid().optional(),
  }),
});

export const updateReportStatusSchema = z.object({
  body: z.object({
    status: z.enum(['reviewed', 'resolved']),
    action: z.enum(['warn', 'suspend', 'ban', 'dismiss']).optional(),
    adminNotes: z.string().max(500).optional(),
  }),
});

export const reportParamsSchema = z.object({
  params: z.object({
    reportId: z.string().uuid(),
  }),
});

export const getReportsQuerySchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'reviewed', 'resolved']).optional(),
    type: z.enum(['profile', 'message', 'photo', 'behavior']).optional(),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).default(20),
    page: z.string().transform(Number).pipe(z.number().min(1)).default(1),
  }),
});

export const moderateContentSchema = z.object({
  body: z.object({
    content: z.string().min(1),
  }),
});

export const userModerationParamsSchema = z.object({
  params: z.object({
    userId: z.string().uuid(),
  }),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportStatusInput = z.infer<typeof updateReportStatusSchema>;
export type ReportParams = z.infer<typeof reportParamsSchema>;
export type GetReportsQuery = z.infer<typeof getReportsQuerySchema>;
export type ModerateContentInput = z.infer<typeof moderateContentSchema>;
export type UserModerationParams = z.infer<typeof userModerationParamsSchema>;
