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
  assetId: z.string().uuid().or(z.string().min(1)),
  type: DocumentTypeEnum,
  name: z.string().min(1, 'Document name is required'),
  fileName: z.string().optional(),
  fileUrl: z.string().optional(),
  fileData: z.string().optional(),
  mimeType: z.string().optional(),
  fileSizeBytes: z.number().int().nonnegative().optional(),
});

export type DocumentType = z.infer<typeof DocumentTypeEnum>;
export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;
