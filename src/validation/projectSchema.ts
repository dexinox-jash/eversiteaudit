import { z } from 'zod';

export const projectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be 100 characters or less'),
  siteAddress: z
    .string()
    .max(200, 'Site address must be 200 characters or less')
    .nullable()
    .transform((v) => (v === '' ? null : v)),
  clientName: z
    .string()
    .max(100, 'Client name must be 100 characters or less')
    .nullable()
    .transform((v) => (v === '' ? null : v)),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .nullable()
    .transform((v) => (v === '' ? null : v)),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
