import { z } from 'zod';

export const templateSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(100, 'Template name must be 100 characters or less'),
});

export type TemplateFormData = z.infer<typeof templateSchema>;
