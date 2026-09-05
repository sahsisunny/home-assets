import { Router } from 'express';
import { InvoiceOcrService } from '../services/gemini-ocr';
import { logger } from '../utils/logger';

export const invoicesRouter = Router();

/**
 * Process uploaded / scanned invoice base64 image and extract structured asset data
 */
invoicesRouter.post('/process', async (req, res) => {
  const startTime = Date.now();
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      logger.warn('Invoice OCR requested without imageBase64 payload', {}, 'Invoices');
      return res.status(400).json({ success: false, error: 'imageBase64 is required' });
    }

    const payloadSizeBytes = Math.round((imageBase64.length * 3) / 4);
    logger.info(`Received invoice image for AI extraction (${Math.round(payloadSizeBytes / 1024)} KB, ${mimeType})`, {
      mimeType,
      payloadSizeBytes,
    }, 'Invoices');

    const extraction = await InvoiceOcrService.processInvoice(imageBase64, mimeType);
    const durationMs = Date.now() - startTime;

    logger.info(`Invoice OCR extraction succeeded in ${durationMs}ms`, {
      seller: extraction.seller,
      invoiceNumber: extraction.invoiceNumber,
      productName: extraction.primaryItem?.productName,
      totalAmount: extraction.totalAmount,
      durationMs,
    }, 'Invoices');

    return res.json({
      success: true,
      data: extraction,
    });
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    logger.error(`Invoice extraction failed after ${durationMs}ms`, error, { durationMs }, 'Invoices');
    return res.status(500).json({ success: false, error: error.message || 'Invoice extraction failed' });
  }
});
