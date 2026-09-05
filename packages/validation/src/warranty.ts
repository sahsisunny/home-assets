import { z } from 'zod';

export const CreateWarrantySchema = z.object({
  assetId: z.string().uuid(),
  provider: z.string().min(1, 'Provider is required'),
  warrantyNumber: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  documentId: z.string().uuid().optional(),
});

export const UpdateWarrantySchema = CreateWarrantySchema.partial().omit({ assetId: true });

export type CreateWarrantyInput = z.infer<typeof CreateWarrantySchema>;
export type UpdateWarrantyInput = z.infer<typeof UpdateWarrantySchema>;
