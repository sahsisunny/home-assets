import { Router } from 'express';
import { logger } from '../utils/logger';
import { prisma, DocumentType } from '../services/prisma';
import { getActiveUser } from '../services/user-store';

export const documentsRouter = Router();

function mapDocType(type?: string): DocumentType {
  const t = (type || '').toUpperCase();
  if (t === 'INVOICE') return DocumentType.INVOICE;
  if (t === 'WARRANTY') return DocumentType.WARRANTY;
  if (t === 'MANUAL') return DocumentType.MANUAL;
  if (t === 'INSURANCE') return DocumentType.INSURANCE;
  if (t === 'SERVICE') return DocumentType.SERVICE;
  if (t === 'BOX_IMAGE') return DocumentType.BOX_IMAGE;
  return DocumentType.OTHER;
}

function formatDocumentResponse(doc: any) {
  const isCustomUrl = doc.fileUrl && !doc.fileUrl.includes('placehold.co') && !doc.fileUrl.includes('example.com') && !doc.fileUrl.startsWith('/api/documents/');
  const fileUrl = isCustomUrl ? doc.fileUrl : `/api/documents/${doc.id}/file`;

  return {
    id: doc.id,
    assetId: doc.assetId,
    assetName: doc.asset?.name || 'Asset Document',
    type: doc.type.toLowerCase(),
    name: doc.name,
    fileName: doc.name,
    date: doc.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    sizeFormatted: doc.fileSizeBytes ? `${Math.round(doc.fileSizeBytes / 1024)} KB` : '',
    fileSizeBytes: doc.fileSizeBytes,
    mimeType: doc.mimeType,
    fileUrl,
    hasFileContent: Boolean(doc.fileSizeBytes && doc.fileSizeBytes > 0),
    createdAt: doc.createdAt.toISOString(),
  };
}

// GET /api/documents (List Documents)
documentsRouter.get('/', async (req, res) => {
  try {
    const userSession = await getActiveUser(req.headers.authorization);
    const householdId = userSession?.household.id;
    const { type, assetId } = req.query;

    const whereClause: any = {};
    if (assetId) {
      whereClause.assetId = String(assetId);
    } else if (householdId) {
      whereClause.asset = { householdId };
    }

    if (type && type !== 'all') {
      whereClause.type = mapDocType(String(type));
    }

    const docs = await prisma.document.findMany({
      where: whereClause,
      select: {
        id: true,
        assetId: true,
        type: true,
        name: true,
        fileUrl: true,
        mimeType: true,
        fileSizeBytes: true,
        fileData: false, // Omit heavy base64 from list for maximum performance
        uploadedById: true,
        createdAt: true,
        asset: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    logger.debug(`Listed ${docs.length} documents from PostgreSQL`, { filterType: type, assetId, count: docs.length }, 'PostgreSQL Documents');
    return res.json({ success: true, data: docs.map(formatDocumentResponse), total: docs.length });
  } catch (err: any) {
    logger.error('Failed to list documents', err, undefined, 'PostgreSQL Documents');
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/documents/:id/file (View Document Inline)
documentsRouter.get('/:id/file', async (req, res) => {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.id },
    });

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    if (!doc.fileData) {
      if (doc.fileUrl && (doc.fileUrl.startsWith('http://') || doc.fileUrl.startsWith('https://'))) {
        return res.redirect(doc.fileUrl);
      }
      return res.status(404).json({ success: false, error: 'No raw file content stored for this document' });
    }

    const base64Content = doc.fileData.includes(',') ? doc.fileData.split(',')[1] : doc.fileData;
    const fileBuffer = Buffer.from(base64Content, 'base64');
    const safeFilename = encodeURIComponent(doc.name || 'document');

    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(fileBuffer);
  } catch (err: any) {
    logger.error('Failed to stream document file', err, { id: req.params.id }, 'PostgreSQL Documents');
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/documents/:id/download (Download Document Attachment)
documentsRouter.get('/:id/download', async (req, res) => {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.id },
    });

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    if (!doc.fileData) {
      if (doc.fileUrl && (doc.fileUrl.startsWith('http://') || doc.fileUrl.startsWith('https://'))) {
        return res.redirect(doc.fileUrl);
      }
      return res.status(404).json({ success: false, error: 'No raw file content stored for this document' });
    }

    const base64Content = doc.fileData.includes(',') ? doc.fileData.split(',')[1] : doc.fileData;
    const fileBuffer = Buffer.from(base64Content, 'base64');
    const safeFilename = encodeURIComponent(doc.name || 'document');

    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    return res.send(fileBuffer);
  } catch (err: any) {
    logger.error('Failed to download document file', err, { id: req.params.id }, 'PostgreSQL Documents');
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/documents (Create Document with Actual File Data)
documentsRouter.post('/', async (req, res) => {
  try {
    const { assetId, type, name, fileName, fileUrl, fileData, fileSizeBytes, mimeType } = req.body;
    const userSession = await getActiveUser(req.headers.authorization);

    if (!assetId) {
      return res.status(400).json({ success: false, error: 'Asset ID is required to attach document' });
    }

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return res.status(404).json({ success: false, error: 'Target asset not found' });
    }

    const docName = name || fileName || 'Document';
    const docType = mapDocType(type);

    let calculatedSize = fileSizeBytes ? Number(fileSizeBytes) : 0;
    if (!calculatedSize && fileData) {
      const pureBase64 = fileData.includes(',') ? fileData.split(',')[1] : fileData;
      calculatedSize = Math.round((pureBase64.length * 3) / 4);
    }
    if (!calculatedSize) calculatedSize = 102400;

    const detectedMime = mimeType || (fileData?.startsWith('data:image/') ? fileData.substring(5, fileData.indexOf(';')) : 'application/pdf');

    const doc = await prisma.document.create({
      data: {
        assetId,
        type: docType,
        name: docName,
        fileUrl: fileUrl || `/api/documents/temp/file`,
        fileData: fileData || null,
        mimeType: detectedMime,
        fileSizeBytes: calculatedSize,
        uploadedById: userSession?.user.id || null,
      },
      include: {
        asset: {
          select: { id: true, name: true },
        },
      },
    });

    // Update fileUrl with permanent document ID endpoint if default
    if (!fileUrl) {
      await prisma.document.update({
        where: { id: doc.id },
        data: { fileUrl: `/api/documents/${doc.id}/file` },
      });
      doc.fileUrl = `/api/documents/${doc.id}/file`;
    }

    logger.info(`Document stored in PostgreSQL: ${doc.name} (${doc.id}) for ${asset.name} (hasData: ${Boolean(fileData)}, ${Math.round(calculatedSize / 1024)} KB)`, {
      id: doc.id,
      name: doc.name,
      type: doc.type,
      assetId: doc.assetId,
      hasFileData: Boolean(fileData),
    }, 'PostgreSQL Documents');

    return res.status(201).json({ success: true, data: formatDocumentResponse(doc) });
  } catch (error: any) {
    logger.error('Failed to create document record in PostgreSQL', error, undefined, 'PostgreSQL Documents');
    return res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/documents/:id (Get Document by ID)
documentsRouter.get('/:id', async (req, res) => {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: {
        asset: {
          select: { id: true, name: true },
        },
      },
    });

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    return res.json({ success: true, data: formatDocumentResponse(doc) });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/documents/:id (Update Document)
documentsRouter.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, fileData, mimeType } = req.body;

    const doc = await prisma.document.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        type: type !== undefined ? mapDocType(type) : undefined,
        fileData: fileData !== undefined ? fileData : undefined,
        mimeType: mimeType !== undefined ? mimeType : undefined,
      },
      include: {
        asset: {
          select: { id: true, name: true },
        },
      },
    });

    return res.json({ success: true, data: formatDocumentResponse(doc) });
  } catch (err: any) {
    return res.status(404).json({ success: false, error: 'Document not found or update failed' });
  }
});

// DELETE /api/documents/:id (Delete Document)
documentsRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.document.delete({
      where: { id },
    });

    logger.info(`Document deleted from PostgreSQL: ${id}`, { id }, 'PostgreSQL Documents');
    return res.json({ success: true, message: 'Document deleted successfully.' });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});
