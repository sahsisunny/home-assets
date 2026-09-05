import { z } from 'zod';

export const AssetCategoryEnum = z.enum([
  'appliances',
  'electronics',
  'furniture',
  'vehicles',
  'equipment',
  'other',
]);

export const CreateAssetSchema = z.object({
  householdId: z.string().uuid().optional(),
  name: z.string().min(2, 'Asset name is required'),
  categoryId: AssetCategoryEnum,
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  purchasePrice: z.number().nonnegative().optional(),
  currentValue: z.number().nonnegative().optional(),
  seller: z.string().optional(),
  location: z.string().optional(),
  owner: z.string().optional(),
  imageUrl: z.string().url().optional(),
  notes: z.string().optional(),
  // Initial Warranty sub-form during creation
  warranty: z
    .object({
      provider: z.string().optional(),
      durationMonths: z.number().int().positive().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      warrantyNumber: z.string().optional(),
      status: z.string().optional(),
      validLabel: z.string().optional(),
    })
    .or(z.string())
    .optional(),
});

export const UpdateAssetSchema = CreateAssetSchema.partial();

export const AssetFilterSchema = z.object({
  category: AssetCategoryEnum.optional(),
  location: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['recent', 'purchase_date', 'price_desc', 'price_asc', 'warranty_expiry']).optional().default('recent'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateAssetInput = z.infer<typeof CreateAssetSchema>;
export type UpdateAssetInput = z.infer<typeof UpdateAssetSchema>;
export type AssetFilterInput = z.infer<typeof AssetFilterSchema>;
