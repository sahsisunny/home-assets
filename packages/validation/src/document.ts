import { z } from 'zod';

export const DocumentTypeEnum = z.enum([
  'invoice',
  'warranty',
  'manual',
  'insurance',
  'service',
  'box_image',
  'other',
]);

export const CreateDocumentSchema = z.object({
  assetId: z.string().uuid(),
  type: DocumentTypeEnum,
  name: z.string().min(1, 'Document name is required'),
  fileUrl: z.string().url(),
  mimeType: z.string(),
  fileSizeBytes: z.number().int().positive(),
});

export type DocumentType = z.infer<typeof DocumentTypeEnum>;
export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;
