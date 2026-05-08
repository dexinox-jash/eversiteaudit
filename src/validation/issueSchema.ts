import { z } from 'zod';
import type { IssueSeverity, IssueStatus } from '@/types/domain';

export const issueSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z
    .string()
    .max(5000, 'Description must be 5000 characters or less')
    .nullable()
    .transform((v) => (v === '' ? null : v)),
  severity: z
    .enum(['critical', 'high', 'medium', 'low'] as const)
    .refine((val): val is IssueSeverity => !!val, {
      message: 'Severity is required',
    }),
  status: z
    .enum(['open', 'in_progress', 'resolved', 'closed'] as const)
    .refine((val): val is IssueStatus => !!val, {
      message: 'Status is required',
    }),
});

export type IssueFormData = z.infer<typeof issueSchema>;
