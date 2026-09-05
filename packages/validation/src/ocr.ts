import { z } from 'zod';
import { AssetCategoryEnum } from './asset';

export const ExtractedInvoiceItemSchema = z.object({
  productName: z.string().describe('Concise, clean, verified human-friendly name of the asset (e.g. Sony Bravia 65" 4K TV, Samsung 253L Refrigerator)'),
  category: AssetCategoryEnum.default('appliances').describe('Categorized item group'),
  brand: z.string().optional().describe('Detected brand e.g. Samsung, LG, Bosch'),
  model: z.string().optional().describe('Detected model number e.g. QA55S90CAKXXL'),
  serialNumber: z.string().optional().describe('Detected serial number if present'),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.number().nonnegative().optional(),
  totalPrice: z.number().nonnegative().optional(),
  warrantyMonths: z.number().int().positive().optional().describe('Warranty duration in months if mentioned on invoice'),
  description: z.string().optional().describe('Full specifications, variant details, color, capacity, or extended description extracted from invoice'),
  notes: z.string().optional().describe('Invoice remarks, retailer perks, serial notes, or additional context'),
});

export const InvoiceExtractionResultSchema = z.object({
  seller: z.string().optional().describe('Store/Retailer name e.g. Croma, Reliance Digital, Amazon'),
  invoiceNumber: z.string().optional().describe('Invoice identification number'),
  invoiceDate: z.string().optional().describe('Date of invoice in YYYY-MM-DD format'),
  totalAmount: z.number().nonnegative().optional().describe('Total invoice bill amount'),
  taxAmount: z.number().nonnegative().optional().describe('Total GST/Tax amount'),
  rawConfidence: z.number().min(0).max(1).optional().describe('Confidence score of extraction'),
  primaryItem: ExtractedInvoiceItemSchema.describe('Main primary asset detected on this invoice'),
  additionalItems: z.array(ExtractedInvoiceItemSchema).optional().default([]),
  notes: z.string().optional().describe('General notes from the invoice'),
});


export type InvoiceExtractionResult = z.infer<typeof InvoiceExtractionResultSchema>;
export type ExtractedInvoiceItem = z.infer<typeof ExtractedInvoiceItemSchema>;
