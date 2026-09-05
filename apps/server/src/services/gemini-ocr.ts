import { InvoiceExtractionResult, InvoiceExtractionResultSchema } from '@home-assets/validation';
import { logger } from '../utils/logger';

/**
 * Service for extracting structured asset data from invoice images using Multimodal LLM (Gemini 1.5/2.0 Flash/Pro)
 */
export class InvoiceOcrService {
  /**
   * Dynamically get supported Gemini models for this API key, prioritized for multimodal vision extraction
   */
  private static async getAvailableModels(apiKey: string): Promise<string[]> {
    const priorityList = [
      'models/gemini-flash-lite-latest',
      'models/gemini-1.5-flash-latest',
      'models/gemini-2.0-flash',
      'models/gemini-1.5-flash',
      'models/gemini-1.5-pro-latest',
      'models/gemini-1.5-pro',
      'models/gemini-1.5-flash-8b',
    ];

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.models)) {
          const validModels = json.models
            .filter((m: any) => {
              const name = (m.name || '').toLowerCase();
              return (
                m.supportedGenerationMethods?.includes('generateContent') &&
                !name.includes('tts') &&
                !name.includes('embedding') &&
                !name.includes('imagen') &&
                !name.includes('aqa') &&
                !name.includes('gemma')
              );
            })
            .map((m: any) => m.name);

          if (validModels.length > 0) {
            // Sort by priorityList first, then remaining
            const sorted = validModels.sort((a: string, b: string) => {
              const idxA = priorityList.indexOf(a);
              const idxB = priorityList.indexOf(b);
              if (idxA !== -1 && idxB !== -1) return idxA - idxB;
              if (idxA !== -1) return -1;
              if (idxB !== -1) return 1;
              return 0;
            });
            logger.info(`Prioritized ${sorted.length} Gemini vision models for OCR extraction`, { modelsCount: sorted.length, topModel: sorted[0] }, 'InvoiceOCR');
            return sorted;
          }
        }
      }
    } catch (err: any) {
      logger.warn('Gemini model listing failed, falling back to default candidate sequence', { error: err.message }, 'InvoiceOCR');
    }

    return priorityList;
  }

  /**
   * Process invoice image buffer or base64 and return structured data via Gemini AI
   */
  public static async processInvoice(imageBase64: string, mimeType = 'image/jpeg'): Promise<InvoiceExtractionResult> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
      throw new Error('GEMINI_API_KEY is not configured in the server environment (.env). Please set your Google AI Studio API key.');
    }

    if (!imageBase64 || imageBase64.trim() === '') {
      throw new Error('No invoice image provided for OCR processing.');
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

    const prompt = `You are an expert invoice and receipt OCR extraction engine.
Analyze this invoice image and extract structured data into JSON matching this exact schema:
{
  "seller": string (store / seller name e.g. Croma, Reliance Digital, Amazon, Vijay Sales),
  "invoiceNumber": string,
  "invoiceDate": string (YYYY-MM-DD format),
  "totalAmount": number (total amount in INR or local currency without symbol),
  "taxAmount": number (GST / tax amount),
  "rawConfidence": number (between 0.8 and 1.0),
  "primaryItem": {
    "productName": string (CRITICAL: Make this CONCISE, CLEAN, and human-friendly, 3-6 words maximum e.g. "Sony Bravia 65 4K TV", "Samsung 253L Refrigerator", "Dyson V12 Cordless Vacuum", "LG 8kg Front Load Washing Machine", "Apple MacBook Pro 16". Do NOT put long retail descriptions or SKU codes here),
    "description": string (Full technical specifications, raw invoice item description, color, capacity, variant details, energy rating, etc.),
    "notes": string (Warranty remarks, installation notes, serial notes, or retailer terms),
    "category": string (must be one of: "appliances", "electronics", "furniture", "vehicles", "equipment", "other"),
    "brand": string (brand name e.g. Xiaomi, Samsung, LG, Bosch, Sony, Apple, Dyson),
    "model": string (model number / SKU e.g. KD-65X82L, RT28T3722S8),
    "serialNumber": string (serial number if found, or empty),
    "quantity": number (integer),
    "unitPrice": number,
    "totalPrice": number,
    "warrantyMonths": number (warranty period in months if mentioned e.g. 12, 24, 36)
  },
  "additionalItems": [],
  "notes": string
}

Return ONLY valid raw JSON with NO markdown formatting, NO backticks, NO explanations.`;

    const modelsToTry = await this.getAvailableModels(apiKey);
    let lastError: Error | null = null;

    for (const modelName of modelsToTry) {
      const cleanModelName = modelName.startsWith('models/') ? modelName : `models/${modelName}`;
      logger.info(`Attempting invoice extraction with model: ${cleanModelName}`, { model: cleanModelName }, 'InvoiceOCR');

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${cleanModelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inline_data: {
                        mime_type: mimeType,
                        data: cleanBase64,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.1,
              },
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          logger.warn(`Model ${cleanModelName} returned error (${response.status})`, { status: response.status, errorSnippet: errText.slice(0, 200) }, 'InvoiceOCR');
          lastError = new Error(`Gemini API error (${response.status}) on ${cleanModelName}: ${errText}`);
          continue;
        }

        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          lastError = new Error(`No content returned from Gemini model ${cleanModelName}`);
          continue;
        }

        // Strip potential markdown wrapper ```json ... ```
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const parsedJson = JSON.parse(text);

        // Sanitize and verify concise product name and description
        if (parsedJson.primaryItem) {
          parsedJson.primaryItem = this.sanitizeAndVerifyItem(parsedJson.primaryItem, parsedJson.seller);
        }
        if (Array.isArray(parsedJson.additionalItems)) {
          parsedJson.additionalItems = parsedJson.additionalItems.map((item: any) =>
            this.sanitizeAndVerifyItem(item, parsedJson.seller)
          );
        }

        const productName = parsedJson.primaryItem?.productName || parsedJson.seller || 'Asset';
        logger.info(`Successfully extracted and verified structured data with ${cleanModelName}`, {
          model: cleanModelName,
          product: productName,
          description: parsedJson.primaryItem?.description,
          seller: parsedJson.seller,
          totalAmount: parsedJson.totalAmount,
        }, 'InvoiceOCR');

        return InvoiceExtractionResultSchema.parse(parsedJson);
      } catch (err: any) {
        lastError = err;
      }
    }

    logger.error('All available Gemini models failed to process the invoice image', lastError, {}, 'InvoiceOCR');
    throw lastError || new Error('All available Gemini models failed to process the invoice image.');
  }

  /**
   * Helper to verify and ensure the asset name is clean, concise, and professional,
   * while preserving full specifications in the description and notes fields.
   */
  private static sanitizeAndVerifyItem(item: any, seller?: string): any {
    if (!item) return item;
    let rawName = (item.productName || '').trim();
    const brand = (item.brand || '').trim();
    const model = (item.model || '').trim();
    let description = (item.description || '').trim();
    let notes = (item.notes || '').trim();

    // Preserve full raw text in description if not already set
    if (!description && rawName.length > 30) {
      description = rawName;
    }

    let cleanName = rawName;

    // Clean verbose product marketing clauses and boilerplates
    cleanName = cleanName
      .replace(/\b(with|including|includes|features|compatible with|edition)\b.*$/i, '')
      .replace(/\b\d{4}\s*(model|edition)\b/gi, '')
      .replace(/\b(brand new|original genuine|authentic|warranty pack|retail pack)\b/gi, '')
      .trim();

    // Common technical acronyms to keep in uppercase
    const acronyms = new Set([
      '4K', '8K', 'HD', 'FHD', 'UHD', 'TV', 'AC', 'OLED', 'QLED', 'LED', 'LCD',
      'RO', 'UV', 'UF', 'TDS', 'LG', 'HP', 'USB', 'AI', 'SSD', 'HDD', 'RAM',
      'GB', 'TB', 'KG', 'LTR', 'L', 'W', 'V', 'BTU', 'INCH', 'MM', 'CM'
    ]);

    // Format words into Title Case or Acronyms
    const words = cleanName.split(/\s+/).filter(Boolean);
    const formattedWords = words.map((w :any) => {
      const upper = w.toUpperCase();
      if (acronyms.has(upper) || /^\d+[A-Z]+$/i.test(w) || /^[A-Z0-9-]{2,5}$/.test(w)) {
        return upper;
      }
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    });

    // Limit to concise length (maximum ~6 words) without cutting words mid-word
    let resultWords = formattedWords;
    if (resultWords.length > 7) {
      resultWords = resultWords.slice(0, 6);
    }

    cleanName = resultWords.join(' ');

    if (!cleanName && brand) {
      cleanName = `${brand} ${item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1).toLowerCase() : 'Asset'}`;
    }

    return {
      ...item,
      productName: cleanName || 'Household Asset',
      description: description || rawName || cleanName,
      notes: notes || (seller ? `Purchased from ${seller}${model ? ` (Model: ${model})` : ''}` : ''),
    };
  }
}


