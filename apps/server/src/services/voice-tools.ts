import { prisma, ReminderType, ReminderStatus, DocumentType, MaintenanceType } from './prisma';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';

export interface ToolExecutionContext {
  userId: string;
  householdId: string;
  userName?: string;
  userGender?: 'male' | 'female' | string;
  householdName?: string;
}

/**
 * Gemini Function Declaration Schemas
 */
export const GEMINI_VOICE_TOOL_DECLARATIONS = [
  {
    name: 'search_assets',
    description: 'Search or list household assets by keywords, name, category (e.g. appliances, electronics, furniture, vehicles, equipment), location/room, or brand.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'Search keyword for name, brand, model, or notes (e.g., "washing machine", "Sony", "TV", "fridge", "car")',
        },
        categoryId: {
          type: 'STRING',
          description: 'Category filter: "appliances", "electronics", "furniture", "vehicles", "equipment", or "other"',
        },
        location: {
          type: 'STRING',
          description: 'Location/room in the house (e.g., "Kitchen", "Living Room", "Garage", "Master Bedroom")',
        },
      },
    },
  },
  {
    name: 'get_asset_details',
    description: 'Get comprehensive details of a specific asset including purchase date, price, current value, seller, serial number, notes, warranty status, and attached documents.',
    parameters: {
      type: 'OBJECT',
      properties: {
        assetId: {
          type: 'STRING',
          description: 'Exact ID of the asset if known',
        },
        assetName: {
          type: 'STRING',
          description: 'Name or description of the asset (e.g., "Bosch Washing Machine", "Samsung TV")',
        },
      },
    },
  },
  {
    name: 'get_warranty_status',
    description: 'Check warranty information for an asset, including start date, end date, days remaining, warranty status (active, expiring soon, expired, or missing), and provider.',
    parameters: {
      type: 'OBJECT',
      properties: {
        assetId: {
          type: 'STRING',
          description: 'Exact ID of the asset if known',
        },
        assetName: {
          type: 'STRING',
          description: 'Name of the asset (e.g., "LG Refrigerator", "Sony TV")',
        },
      },
    },
  },
  {
    name: 'list_expiring_warranties',
    description: 'List all household assets that have warranties expiring soon (within 30/60/90 days) or already expired.',
    parameters: {
      type: 'OBJECT',
      properties: {
        withinDays: {
          type: 'NUMBER',
          description: 'Number of days to check for expiration (default: 30)',
        },
        status: {
          type: 'STRING',
          description: 'Filter by "expiring_soon", "expired", or "all"',
        },
      },
    },
  },
  {
    name: 'get_maintenance_history',
    description: 'Get past maintenance, repair, and servicing history and total maintenance expenditure for an asset or across the entire household.',
    parameters: {
      type: 'OBJECT',
      properties: {
        assetId: {
          type: 'STRING',
          description: 'Optional asset ID to check specific asset history',
        },
        assetName: {
          type: 'STRING',
          description: 'Optional asset name (e.g. "Daikin AC", "Car")',
        },
      },
    },
  },
  {
    name: 'get_upcoming_maintenance',
    description: 'Get scheduled maintenance tasks and upcoming service due dates across all household assets.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  {
    name: 'list_reminders',
    description: 'List household reminders such as upcoming warranty expirations, maintenance due dates, or custom household tasks.',
    parameters: {
      type: 'OBJECT',
      properties: {
        status: {
          type: 'STRING',
          description: 'Filter by "pending", "completed", or "all" (default: "pending")',
        },
        type: {
          type: 'STRING',
          description: 'Filter by "warranty", "maintenance", "custom", or "all"',
        },
      },
    },
  },
  {
    name: 'create_reminder',
    description: 'Create a new reminder for an asset service, warranty renewal, filter change, or custom task.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: {
          type: 'STRING',
          description: 'Title of the reminder (e.g., "Service AC before summer", "Replace RO water filter", "Renew car insurance")',
        },
        dueDate: {
          type: 'STRING',
          description: 'Due date in YYYY-MM-DD format (e.g., "2026-10-15")',
        },
        assetName: {
          type: 'STRING',
          description: 'Optional name of the related asset (e.g. "Living Room AC")',
        },
        assetId: {
          type: 'STRING',
          description: 'Optional exact asset ID if known',
        },
        type: {
          type: 'STRING',
          description: 'Type: "maintenance", "warranty", or "custom" (default: "maintenance")',
        },
      },
      required: ['title', 'dueDate'],
    },
  },
  {
    name: 'complete_reminder',
    description: 'Mark an existing pending reminder as completed.',
    parameters: {
      type: 'OBJECT',
      properties: {
        reminderId: {
          type: 'STRING',
          description: 'Exact ID of the reminder if known',
        },
        reminderTitle: {
          type: 'STRING',
          description: 'Title or keyword of the reminder to complete',
        },
      },
    },
  },
  {
    name: 'search_documents',
    description: 'Find invoices, receipts, warranties, manuals, insurance policies, or service receipts attached to assets.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'Document name keyword or asset name',
        },
        assetName: {
          type: 'STRING',
          description: 'Name of the asset whose documents are needed',
        },
        type: {
          type: 'STRING',
          description: 'Filter by type: "invoice", "warranty", "manual", "insurance", "service", or "other"',
        },
      },
    },
  },
  {
    name: 'create_asset',
    description: 'Add and register a new asset or device into the household inventory with name, category, price, location, brand, model, and optional warranty.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: {
          type: 'STRING',
          description: 'Name of the asset (e.g., "Sony Bravia 55-inch OLED TV", "LG Double Door Refrigerator", "Daikin 1.5 Ton AC", "MacBook Pro")',
        },
        categoryId: {
          type: 'STRING',
          description: 'Category: "appliances", "electronics", "furniture", "vehicles", "equipment", or "other" (default: "electronics" or "appliances")',
        },
        purchasePrice: {
          type: 'NUMBER',
          description: 'Purchase price in Indian Rupees (e.g., 45000, 12999)',
        },
        purchaseDate: {
          type: 'STRING',
          description: 'Purchase date in YYYY-MM-DD format (e.g., "2026-02-15")',
        },
        location: {
          type: 'STRING',
          description: 'Room or location in the home (e.g., "Living Room", "Kitchen", "Master Bedroom", "Garage")',
        },
        brand: {
          type: 'STRING',
          description: 'Brand or manufacturer (e.g., "Sony", "LG", "Samsung", "Daikin", "Apple")',
        },
        model: {
          type: 'STRING',
          description: 'Model name or model number (e.g., "XR-55A80K")',
        },
        serialNumber: {
          type: 'STRING',
          description: 'Serial number or IMEI number',
        },
        seller: {
          type: 'STRING',
          description: 'Store or seller name (e.g., "Amazon", "Reliance Digital", "Croma", "Flipkart")',
        },
        notes: {
          type: 'STRING',
          description: 'Notes or additional details about the asset',
        },
        warrantyProvider: {
          type: 'STRING',
          description: 'Optional warranty provider (e.g., "Sony India", "Reliance ResQ", "AppleCare")',
        },
        warrantyDurationMonths: {
          type: 'NUMBER',
          description: 'Optional warranty duration in months (e.g., 12, 24, 36)',
        },
        warrantyEndDate: {
          type: 'STRING',
          description: 'Optional warranty expiration date in YYYY-MM-DD format',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_asset',
    description: 'Update existing asset details such as price, location, brand, model, notes, or current valuation in the household inventory.',
    parameters: {
      type: 'OBJECT',
      properties: {
        assetId: {
          type: 'STRING',
          description: 'Exact ID of the asset if known',
        },
        assetName: {
          type: 'STRING',
          description: 'Current name of the asset to update (e.g., "Sony TV", "Living Room AC")',
        },
        name: {
          type: 'STRING',
          description: 'New name if renaming the asset',
        },
        purchasePrice: {
          type: 'NUMBER',
          description: 'Updated purchase price in INR',
        },
        currentValue: {
          type: 'NUMBER',
          description: 'Updated current market/resale valuation in INR',
        },
        location: {
          type: 'STRING',
          description: 'Updated room or location in the home',
        },
        brand: {
          type: 'STRING',
          description: 'Updated brand name',
        },
        model: {
          type: 'STRING',
          description: 'Updated model name/number',
        },
        notes: {
          type: 'STRING',
          description: 'Updated notes or comments',
        },
        categoryId: {
          type: 'STRING',
          description: 'Updated category: "appliances", "electronics", "furniture", "vehicles", "equipment", "other"',
        },
      },
    },
  },
  {
    name: 'delete_asset',
    description: 'Delete or remove an asset from the household inventory.',
    parameters: {
      type: 'OBJECT',
      properties: {
        assetId: {
          type: 'STRING',
          description: 'Exact ID of the asset if known',
        },
        assetName: {
          type: 'STRING',
          description: 'Name of the asset to remove (e.g., "Old Microwave")',
        },
        confirm: {
          type: 'BOOLEAN',
          description: 'Must be true to confirm permanent deletion',
        },
      },
    },
  },
  {
    name: 'create_maintenance_record',
    description: 'Log and record a maintenance, repair, or servicing event for an asset, including cost, service provider, service date, notes, and next scheduled service date.',
    parameters: {
      type: 'OBJECT',
      properties: {
        assetName: {
          type: 'STRING',
          description: 'Name of the asset serviced (e.g., "Living Room AC", "Washing Machine", "Car")',
        },
        assetId: {
          type: 'STRING',
          description: 'Optional exact asset ID if known',
        },
        title: {
          type: 'STRING',
          description: 'Title of the service (e.g., "AC Deep Cleaning & Gas Refill", "RO Water Filter Replacement", "Oil Change & Brake Inspection")',
        },
        type: {
          type: 'STRING',
          description: 'Type: "scheduled_service", "cleaning", "filter_replacement", "inspection", "repair", "part_replacement", or "other"',
        },
        cost: {
          type: 'NUMBER',
          description: 'Service cost in Indian Rupees (e.g., 1500, 3500)',
        },
        serviceDate: {
          type: 'STRING',
          description: 'Date service was performed in YYYY-MM-DD format (defaults to today)',
        },
        serviceProvider: {
          type: 'STRING',
          description: 'Technician, company, or service center (e.g., "Urban Company", "Daikin Authorized Service", "Local Mechanic")',
        },
        technicianNotes: {
          type: 'STRING',
          description: 'Technician observations, parts replaced, or service details',
        },
        nextServiceDate: {
          type: 'STRING',
          description: 'Optional next scheduled service date in YYYY-MM-DD format (e.g., "2026-11-15")',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'create_document',
    description: 'Attach and record an invoice, warranty certificate, user manual, insurance policy, or service receipt for a household asset.',
    parameters: {
      type: 'OBJECT',
      properties: {
        assetName: {
          type: 'STRING',
          description: 'Name of the asset this document belongs to (e.g., "Sony Bravia TV", "LG Fridge")',
        },
        assetId: {
          type: 'STRING',
          description: 'Optional exact asset ID if known',
        },
        name: {
          type: 'STRING',
          description: 'Document title (e.g., "Amazon Purchase Invoice", "5-Year Extended Warranty Policy", "Owner User Manual")',
        },
        type: {
          type: 'STRING',
          description: 'Document type: "invoice", "warranty", "manual", "insurance", "service", or "other"',
        },
        fileUrl: {
          type: 'STRING',
          description: 'Optional document URL or reference link',
        },
        notes: {
          type: 'STRING',
          description: 'Optional description or notes',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'add_warranty',
    description: 'Add, register, or extend warranty details for a household asset.',
    parameters: {
      type: 'OBJECT',
      properties: {
        assetName: {
          type: 'STRING',
          description: 'Name of the asset (e.g., "Daikin AC", "Sony TV")',
        },
        assetId: {
          type: 'STRING',
          description: 'Optional exact asset ID if known',
        },
        provider: {
          type: 'STRING',
          description: 'Warranty provider / brand (e.g., "Daikin India", "Reliance ResQ", "AppleCare+", "Croma ZipCare")',
        },
        warrantyNumber: {
          type: 'STRING',
          description: 'Warranty policy or registration number',
        },
        startDate: {
          type: 'STRING',
          description: 'Warranty start date in YYYY-MM-DD format (defaults to purchase date or today)',
        },
        endDate: {
          type: 'STRING',
          description: 'Warranty expiration date in YYYY-MM-DD format',
        },
        durationMonths: {
          type: 'NUMBER',
          description: 'Duration in months (e.g., 12, 24, 36) if endDate is not specified directly',
        },
      },
      required: ['provider'],
    },
  },
  {
    name: 'get_household_summary',
    description: 'Get an overview of the household asset portfolio: total asset count, total purchase valuation, current value, total maintenance spend, active warranties, and pending tasks.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  {
    name: 'get_smart_recommendations',
    description: 'Get proactive home recommendations, preventive maintenance alerts, expiring warranty warnings, missing invoice notifications, and high-priority action items for the household.',
    parameters: {
      type: 'OBJECT',
      properties: {
        focusArea: {
          type: 'STRING',
          description: 'Optional focus area filter: "all", "warranties", "maintenance", "documents", or "reminders"',
        },
        limit: {
          type: 'NUMBER',
          description: 'Maximum number of recommendations to return (default: 5)',
        },
      },
    },
  },
];

/**
 * AI Tool Execution Engine
 * Validates authorization on the server and executes domain queries strictly scoped to the user's householdId.
 */
export class VoiceToolExecutor {
  /**
   * Main dispatch function for all AI tool calls
   */
  public static async executeTool(
    toolName: string,
    args: Record<string, any>,
    ctx: ToolExecutionContext
  ): Promise<{ success: boolean; data?: any; message?: string; error?: string }> {
    const startTime = Date.now();
    logger.info(`Voice Assistant executing tool: "${toolName}"`, {
      toolName,
      args,
      userId: ctx.userId,
      householdId: ctx.householdId,
    }, 'VoiceTools');

    try {
      let result: any;
      switch (toolName) {
        case 'search_assets':
          result = await this.searchAssets(args, ctx);
          break;
        case 'get_asset_details':
          result = await this.getAssetDetails(args, ctx);
          break;
        case 'get_warranty_status':
          result = await this.getWarrantyStatus(args, ctx);
          break;
        case 'list_expiring_warranties':
          result = await this.listExpiringWarranties(args, ctx);
          break;
        case 'get_maintenance_history':
          result = await this.getMaintenanceHistory(args, ctx);
          break;
        case 'get_upcoming_maintenance':
          result = await this.getUpcomingMaintenance(args, ctx);
          break;
        case 'list_reminders':
          result = await this.listReminders(args, ctx);
          break;
        case 'create_reminder':
          result = await this.createReminder(args as any, ctx);
          break;
        case 'complete_reminder':
          result = await this.completeReminder(args, ctx);
          break;
        case 'search_documents':
          result = await this.searchDocuments(args, ctx);
          break;
        case 'get_household_summary':
          result = await this.getHouseholdSummary(args, ctx);
          break;
        case 'get_smart_recommendations':
          result = await this.getSmartRecommendations(args, ctx);
          break;
        case 'create_asset':
          result = await this.createAsset(args as any, ctx);
          break;
        case 'update_asset':
          result = await this.updateAsset(args as any, ctx);
          break;
        case 'delete_asset':
          result = await this.deleteAsset(args as any, ctx);
          break;
        case 'create_maintenance_record':
          result = await this.createMaintenanceRecord(args as any, ctx);
          break;
        case 'create_document':
          result = await this.createDocument(args as any, ctx);
          break;
        case 'add_warranty':
          result = await this.addWarranty(args as any, ctx);
          break;
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }

      const durationMs = Date.now() - startTime;
      logger.info(`Voice Assistant tool "${toolName}" completed in ${durationMs}ms`, {
        toolName,
        durationMs,
        success: true,
      }, 'VoiceTools');

      return { success: true, data: result };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      logger.error(`Voice Assistant tool "${toolName}" failed after ${durationMs}ms`, err, {
        toolName,
        args,
        durationMs,
      }, 'VoiceTools');

      return { success: false, error: err.message || 'Tool execution error' };
    }
  }

  // 1. Search Assets
  private static async searchAssets(args: { query?: string; categoryId?: string; location?: string }, ctx: ToolExecutionContext) {
    const where: any = { householdId: ctx.householdId };

    if (args.categoryId) {
      where.categoryId = { contains: args.categoryId.toLowerCase().trim(), mode: 'insensitive' };
    }
    if (args.location) {
      where.location = { contains: args.location.trim(), mode: 'insensitive' };
    }
    if (args.query) {
      const q = args.query.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { model: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { categoryId: { contains: q, mode: 'insensitive' } },
        { seller: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
      ];
    }

    const assets = await prisma.asset.findMany({
      where,
      include: { warranty: true, category: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const now = new Date();
    return {
      totalFound: assets.length,
      assets: assets.map((a) => {
        let warrantyStatus = 'None recorded';
        if (a.warranty) {
          const end = new Date(a.warranty.endDate);
          const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          warrantyStatus = end < now ? 'Expired' : daysLeft <= 30 ? `Expiring soon (${daysLeft} days left)` : `Active (Expires ${a.warranty.endDate.toISOString().split('T')[0]})`;
        }

        return {
          id: a.id,
          name: a.name,
          category: a.category?.name || a.categoryId,
          brand: a.brand || 'Unknown',
          model: a.model || 'Unknown',
          purchaseDate: a.purchaseDate ? a.purchaseDate.toISOString().split('T')[0] : 'Unknown',
          purchasePrice: a.purchasePrice !== null ? `₹${Number(a.purchasePrice).toLocaleString('en-IN')}` : 'Not recorded',
          location: a.location || 'Not specified',
          owner: a.owner || 'Household',
          warrantyStatus,
        };
      }),
    };
  }

  // 2. Get Asset Details
  private static async getAssetDetails(args: { assetId?: string; assetName?: string }, ctx: ToolExecutionContext) {
    let asset: any = null;

    if (args.assetId) {
      asset = await prisma.asset.findFirst({
        where: { id: args.assetId, householdId: ctx.householdId },
        include: { warranty: true, documents: true, records: true, schedules: true, category: true },
      });
    }

    if (!asset && args.assetName) {
      const q = args.assetName.trim();
      asset = await prisma.asset.findFirst({
        where: {
          householdId: ctx.householdId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { brand: { contains: q, mode: 'insensitive' } },
            { model: { contains: q, mode: 'insensitive' } },
          ],
        },
        include: { warranty: true, documents: true, records: true, schedules: true, category: true },
      });
    }

    if (!asset) {
      return {
        found: false,
        message: `No asset found matching "${args.assetName || args.assetId}" in your household inventory.`,
      };
    }

    const now = new Date();
    let warrantyInfo: any = null;
    if (asset.warranty) {
      const end = new Date(asset.warranty.endDate);
      const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      warrantyInfo = {
        provider: asset.warranty.provider,
        warrantyNumber: asset.warranty.warrantyNumber || 'Not recorded',
        startDate: asset.warranty.startDate.toISOString().split('T')[0],
        endDate: asset.warranty.endDate.toISOString().split('T')[0],
        isExpired: end < now,
        daysRemaining: Math.max(0, daysLeft),
        statusLabel: end < now ? 'Expired' : daysLeft <= 30 ? `Expiring in ${daysLeft} days` : 'Active and covered',
      };
    }

    return {
      found: true,
      asset: {
        id: asset.id,
        name: asset.name,
        category: asset.category?.name || asset.categoryId,
        brand: asset.brand || 'Not recorded',
        model: asset.model || 'Not recorded',
        serialNumber: asset.serialNumber || 'Not recorded',
        purchasePriceFormatted: asset.purchasePrice !== null ? `₹${Number(asset.purchasePrice).toLocaleString('en-IN')}` : 'Not recorded',
        currentValueFormatted: asset.currentValue !== null ? `₹${Number(asset.currentValue).toLocaleString('en-IN')}` : undefined,
        purchaseDate: asset.purchaseDate ? asset.purchaseDate.toISOString().split('T')[0] : 'Not recorded',
        seller: asset.seller || 'Not recorded',
        location: asset.location || 'Not specified',
        owner: asset.owner || 'Household',
        notes: asset.notes || '',
        warranty: warrantyInfo || 'No warranty recorded for this item.',
        documents: asset.documents.map((d: any) => ({
          name: d.name,
          type: d.type.toLowerCase(),
          fileUrl: d.fileUrl,
        })),
        maintenanceHistoryCount: asset.records.length,
        lastServicedDate: asset.records.length > 0 ? asset.records[0].serviceDate.toISOString().split('T')[0] : 'Never serviced',
      },
    };
  }

  // 3. Get Warranty Status
  private static async getWarrantyStatus(args: { assetId?: string; assetName?: string }, ctx: ToolExecutionContext) {
    let asset: any = null;

    if (args.assetId) {
      asset = await prisma.asset.findFirst({
        where: { id: args.assetId, householdId: ctx.householdId },
        include: { warranty: true },
      });
    }

    if (!asset && args.assetName) {
      const q = args.assetName.trim();
      asset = await prisma.asset.findFirst({
        where: {
          householdId: ctx.householdId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { brand: { contains: q, mode: 'insensitive' } },
          ],
        },
        include: { warranty: true },
      });
    }

    if (!asset) {
      return {
        found: false,
        message: `Could not find any asset matching "${args.assetName || args.assetId}".`,
      };
    }

    if (!asset.warranty) {
      return {
        found: true,
        assetName: asset.name,
        hasWarranty: false,
        message: `There is no warranty recorded in the system for ${asset.name}.`,
      };
    }

    const end = new Date(asset.warranty.endDate);
    const start = new Date(asset.warranty.startDate);
    const now = new Date();
    const isExpired = end < now;
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      found: true,
      assetName: asset.name,
      hasWarranty: true,
      warranty: {
        provider: asset.warranty.provider,
        warrantyNumber: asset.warranty.warrantyNumber || 'Not specified',
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        isExpired,
        daysLeft: Math.max(0, daysLeft),
        statusText: isExpired
          ? `Warranty expired on ${end.toISOString().split('T')[0]}`
          : daysLeft <= 30
          ? `Warranty is expiring soon in ${daysLeft} days on ${end.toISOString().split('T')[0]}`
          : `Warranty is active until ${end.toISOString().split('T')[0]} (${daysLeft} days remaining)`,
      },
    };
  }

  // 4. List Expiring Warranties
  private static async listExpiringWarranties(args: { withinDays?: number; status?: string }, ctx: ToolExecutionContext) {
    const withinDays = args.withinDays || 30;
    const now = new Date();

    const assets = await prisma.asset.findMany({
      where: {
        householdId: ctx.householdId,
        warranty: { isNot: null },
      },
      include: { warranty: true },
    });

    const enriched = assets.map((a) => {
      const w = a.warranty!;
      const end = new Date(w.endDate);
      const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isExpired = end < now;

      let status = 'active';
      if (isExpired) status = 'expired';
      else if (daysLeft <= withinDays) status = 'expiring_soon';

      return {
        assetId: a.id,
        assetName: a.name,
        brand: a.brand || 'Unknown',
        provider: w.provider,
        startDate: w.startDate.toISOString().split('T')[0],
        endDate: w.endDate.toISOString().split('T')[0],
        daysLeft,
        status,
      };
    });

    let filtered = enriched;
    if (args.status === 'expiring_soon') {
      filtered = enriched.filter((item) => item.status === 'expiring_soon');
    } else if (args.status === 'expired') {
      filtered = enriched.filter((item) => item.status === 'expired');
    } else {
      filtered = enriched.filter((item) => item.status === 'expiring_soon' || item.status === 'expired');
    }

    return {
      totalFound: filtered.length,
      expiringOrExpiredWarranties: filtered,
    };
  }

  // 5. Get Maintenance History
  private static async getMaintenanceHistory(args: { assetId?: string; assetName?: string }, ctx: ToolExecutionContext) {
    const where: any = {
      asset: { householdId: ctx.householdId },
    };

    if (args.assetId) {
      where.assetId = args.assetId;
    } else if (args.assetName) {
      const q = args.assetName.trim();
      where.asset = {
        householdId: ctx.householdId,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { brand: { contains: q, mode: 'insensitive' } },
        ],
      };
    }

    const records = await prisma.maintenanceRecord.findMany({
      where,
      include: { asset: { select: { id: true, name: true } } },
      orderBy: { serviceDate: 'desc' },
    });

    const totalCost = records.reduce((acc, r) => acc + (Number(r.cost) || 0), 0);

    return {
      totalRecords: records.length,
      totalSpendFormatted: `₹${totalCost.toLocaleString('en-IN')}`,
      records: records.map((r) => ({
        id: r.id,
        assetName: r.asset.name,
        title: r.title,
        type: r.type.toLowerCase(),
        costFormatted: `₹${(Number(r.cost) || 0).toLocaleString('en-IN')}`,
        serviceDate: r.serviceDate.toISOString().split('T')[0],
        serviceProvider: r.serviceProvider || 'Self/Unknown',
        notes: r.description || '',
        nextServiceDate: r.nextServiceDate ? r.nextServiceDate.toISOString().split('T')[0] : undefined,
      })),
    };
  }

  // 6. Get Upcoming Maintenance
  private static async getUpcomingMaintenance(_args: any, ctx: ToolExecutionContext) {
    const now = new Date();
    const reminders = await prisma.reminder.findMany({
      where: {
        householdId: ctx.householdId,
        type: ReminderType.MAINTENANCE_DUE,
        status: ReminderStatus.PENDING,
      },
      include: { asset: { select: { id: true, name: true } } },
      orderBy: { dueDate: 'asc' },
    });

    return {
      count: reminders.length,
      upcomingMaintenance: reminders.map((r) => {
        const due = new Date(r.dueDate);
        const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: r.id,
          title: r.title,
          assetName: r.asset?.name || 'General Household',
          dueDate: r.dueDate.toISOString().split('T')[0],
          daysRemaining: daysLeft,
          statusLabel: daysLeft < 0 ? `Overdue by ${Math.abs(daysLeft)} days` : daysLeft === 0 ? 'Due today' : `Due in ${daysLeft} days`,
        };
      }),
    };
  }

  // 7. List Reminders
  private static async listReminders(args: { status?: string; type?: string }, ctx: ToolExecutionContext) {
    const where: any = { householdId: ctx.householdId };

    if (args.status && args.status !== 'all') {
      where.status = args.status.toUpperCase() === 'COMPLETED' ? ReminderStatus.COMPLETED : ReminderStatus.PENDING;
    } else if (!args.status) {
      where.status = ReminderStatus.PENDING;
    }

    if (args.type && args.type !== 'all') {
      const t = args.type.toUpperCase();
      if (t === 'WARRANTY') where.type = ReminderType.WARRANTY_EXPIRY;
      else if (t === 'MAINTENANCE') where.type = ReminderType.MAINTENANCE_DUE;
      else if (t === 'CUSTOM') where.type = ReminderType.CUSTOM;
    }

    const reminders = await prisma.reminder.findMany({
      where,
      include: { asset: { select: { id: true, name: true } } },
      orderBy: { dueDate: 'asc' },
    });

    const now = new Date();
    return {
      count: reminders.length,
      reminders: reminders.map((r) => {
        const due = new Date(r.dueDate);
        const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: r.id,
          title: r.title,
          assetName: r.asset?.name || 'General',
          dueDate: r.dueDate.toISOString().split('T')[0],
          type: r.type === ReminderType.WARRANTY_EXPIRY ? 'warranty' : r.type === ReminderType.MAINTENANCE_DUE ? 'maintenance' : 'custom',
          status: r.status.toLowerCase(),
          daysLeft,
          daysLabel: r.status === ReminderStatus.COMPLETED ? 'Completed' : daysLeft < 0 ? `Overdue (${Math.abs(daysLeft)} days ago)` : daysLeft === 0 ? 'Due today' : `Due in ${daysLeft} days`,
        };
      }),
    };
  }

  // 8. Create Reminder (Safe Mutation)
  private static async createReminder(
    args: { title: string; dueDate: string; assetId?: string; assetName?: string; type?: string },
    ctx: ToolExecutionContext
  ) {
    if (!args.title || !args.dueDate) {
      throw new Error('Title and dueDate (YYYY-MM-DD) are required to create a reminder.');
    }

    let assetId = args.assetId;
    let assetName = args.assetName;

    if (!assetId && args.assetName) {
      const asset = await prisma.asset.findFirst({
        where: {
          householdId: ctx.householdId,
          name: { contains: args.assetName.trim(), mode: 'insensitive' },
        },
      });
      if (asset) {
        assetId = asset.id;
        assetName = asset.name;
      }
    }

    let reminderType: ReminderType = ReminderType.MAINTENANCE_DUE;
    if (args.type?.toLowerCase() === 'warranty') reminderType = ReminderType.WARRANTY_EXPIRY;
    else if (args.type?.toLowerCase() === 'custom') reminderType = ReminderType.CUSTOM;

    const reminder = await prisma.reminder.create({
      data: {
        householdId: ctx.householdId,
        assetId: assetId || null,
        title: args.title.trim(),
        dueDate: new Date(args.dueDate),
        type: reminderType,
        status: ReminderStatus.PENDING,
      },
      include: { asset: { select: { id: true, name: true } } },
    });

    logger.info(`Voice Assistant created reminder in PostgreSQL: "${reminder.title}"`, {
      reminderId: reminder.id,
      dueDate: args.dueDate,
    }, 'VoiceTools');

    return {
      success: true,
      message: `Reminder scheduled for "${reminder.title}" on ${args.dueDate}${reminder.asset ? ` for ${reminder.asset.name}` : ''}.`,
      reminder: {
        id: reminder.id,
        title: reminder.title,
        dueDate: reminder.dueDate.toISOString().split('T')[0],
        assetName: reminder.asset?.name || undefined,
      },
    };
  }

  // 9. Complete Reminder (Safe Mutation)
  private static async completeReminder(args: { reminderId?: string; reminderTitle?: string }, ctx: ToolExecutionContext) {
    let reminder: any = null;

    if (args.reminderId) {
      reminder = await prisma.reminder.findFirst({
        where: { id: args.reminderId, householdId: ctx.householdId },
      });
    }

    if (!reminder && args.reminderTitle) {
      reminder = await prisma.reminder.findFirst({
        where: {
          householdId: ctx.householdId,
          status: ReminderStatus.PENDING,
          title: { contains: args.reminderTitle.trim(), mode: 'insensitive' },
        },
      });
    }

    if (!reminder) {
      return {
        success: false,
        message: `No pending reminder found matching "${args.reminderTitle || args.reminderId}".`,
      };
    }

    await prisma.reminder.update({
      where: { id: reminder.id },
      data: { status: ReminderStatus.COMPLETED },
    });

    return {
      success: true,
      message: `Completed reminder: "${reminder.title}".`,
    };
  }

  // 10. Search Documents
  private static async searchDocuments(
    args: { query?: string; assetId?: string; assetName?: string; type?: string },
    ctx: ToolExecutionContext
  ) {
    const where: any = {
      asset: { householdId: ctx.householdId },
    };

    if (args.assetId) {
      where.assetId = args.assetId;
    } else if (args.assetName) {
      where.asset = {
        householdId: ctx.householdId,
        name: { contains: args.assetName.trim(), mode: 'insensitive' },
      };
    }

    if (args.type && args.type !== 'all') {
      const t = args.type.toUpperCase();
      if (t === 'INVOICE') where.type = DocumentType.INVOICE;
      else if (t === 'WARRANTY') where.type = DocumentType.WARRANTY;
      else if (t === 'MANUAL') where.type = DocumentType.MANUAL;
      else if (t === 'INSURANCE') where.type = DocumentType.INSURANCE;
      else if (t === 'SERVICE') where.type = DocumentType.SERVICE;
    }

    if (args.query) {
      where.name = { contains: args.query.trim(), mode: 'insensitive' };
    }

    const docs = await prisma.document.findMany({
      where,
      include: { asset: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    return {
      count: docs.length,
      documents: docs.map((d) => ({
        id: d.id,
        name: d.name,
        type: d.type.toLowerCase(),
        assetName: d.asset.name,
        uploadedAt: d.createdAt.toISOString().split('T')[0],
        fileUrl: d.fileUrl && !d.fileUrl.includes('example.com') ? d.fileUrl : `/api/documents/${d.id}/file`,
      })),
    };
  }

  // 11. Get Household Summary & Valuation
  private static async getHouseholdSummary(_args: any, ctx: ToolExecutionContext) {
    const [household, assets, records, reminders] = await Promise.all([
      prisma.household.findUnique({
        where: { id: ctx.householdId },
        include: { members: { include: { user: true } } },
      }),
      prisma.asset.findMany({
        where: { householdId: ctx.householdId },
        include: { warranty: true, category: true },
      }),
      prisma.maintenanceRecord.findMany({
        where: { asset: { householdId: ctx.householdId } },
      }),
      prisma.reminder.findMany({
        where: { householdId: ctx.householdId, status: ReminderStatus.PENDING },
      }),
    ]);

    const totalAssets = assets.length;
    const totalPurchaseValue = assets.reduce((sum, a) => sum + (Number(a.purchasePrice) || 0), 0);
    const totalValuation = assets.reduce((sum, a) => sum + (Number(a.currentValue) || Number(a.purchasePrice) || 0), 0);
    const totalMaintenanceSpend = records.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);

    const now = new Date();
    const activeWarranties = assets.filter((a) => a.warranty && new Date(a.warranty.endDate) >= now).length;
    const expiredWarranties = assets.filter((a) => a.warranty && new Date(a.warranty.endDate) < now).length;

    // Category breakdown
    const categoryCounts: Record<string, number> = {};
    assets.forEach((a) => {
      const cat = a.category?.name || a.categoryId || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    return {
      householdName: household?.name || 'My Household',
      membersCount: household?.members.length || 1,
      totalAssets,
      totalPurchaseValueFormatted: `₹${totalPurchaseValue.toLocaleString('en-IN')}`,
      totalValuationFormatted: `₹${totalValuation.toLocaleString('en-IN')}`,
      totalMaintenanceSpendFormatted: `₹${totalMaintenanceSpend.toLocaleString('en-IN')}`,
      activeWarranties,
      expiredWarranties,
      pendingRemindersCount: reminders.length,
      categoryBreakdown: categoryCounts,
    };
  }

  // 12. Get Smart Proactive Recommendations & Briefing
  public static async getSmartRecommendations(
    args: { focusArea?: string; limit?: number },
    ctx: ToolExecutionContext
  ) {
    const limit = args.limit || 6;
    const focusArea = (args.focusArea || 'all').toLowerCase();
    const now = new Date();

    const [assets, reminders] = await Promise.all([
      prisma.asset.findMany({
        where: { householdId: ctx.householdId },
        include: {
          warranty: true,
          documents: true,
          records: { orderBy: { serviceDate: 'desc' }, take: 1 },
          category: true,
        },
      }),
      prisma.reminder.findMany({
        where: { householdId: ctx.householdId },
        orderBy: { dueDate: 'asc' },
        include: { asset: { select: { id: true, name: true } } },
      }),
    ]);

    const recommendations: Array<{
      id: string;
      type: 'warranty_expiring' | 'maintenance_due' | 'missing_document' | 'pending_reminder' | 'cost_insight';
      severity: 'high' | 'medium' | 'low';
      title: string;
      description: string;
      suggestedAction: string;
      spokenBriefing: string;
      assetName?: string;
      assetId?: string;
    }> = [];

    // 1. Check Expiring Warranties (<= 60 days)
    if (focusArea === 'all' || focusArea === 'warranties') {
      for (const asset of assets) {
        if (asset.warranty) {
          const end = new Date(asset.warranty.endDate);
          const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (end >= now && daysLeft <= 60) {
            const isUrgent = daysLeft <= 15;
            recommendations.push({
              id: `rec_war_${asset.id}`,
              type: 'warranty_expiring',
              severity: isUrgent ? 'high' : 'medium',
              title: `${asset.name} Warranty Expiring`,
              description: `Warranty ends in ${daysLeft} days on ${end.toISOString().split('T')[0]} (${asset.warranty.provider || 'Standard warranty'}).`,
              suggestedAction: `Check warranty status for ${asset.name}`,
              spokenBriefing: `Your ${asset.name} warranty expires in ${daysLeft} days.`,
              assetName: asset.name,
              assetId: asset.id,
            });
          }
        }
      }
    }

    // 2. Check Preventive Maintenance (appliances/vehicles/HVAC)
    if (focusArea === 'all' || focusArea === 'maintenance') {
      const applianceCategories = ['appliances', 'appliance', 'vehicle', 'vehicles', 'electronics', 'equipment', 'hvac'];
      for (const asset of assets) {
        const catName = (asset.category?.name || asset.categoryId || '').toLowerCase();
        const isMaintCategory = applianceCategories.some((c) => catName.includes(c));
        if (isMaintCategory) {
          const lastService = asset.records.length > 0 ? new Date(asset.records[0].serviceDate) : null;
          const daysSinceService = lastService
            ? Math.ceil((now.getTime() - lastService.getTime()) / (1000 * 60 * 60 * 24))
            : null;

          const nameLower = asset.name.toLowerCase();
          const isHeavyAppliance =
            nameLower.includes('ac') ||
            nameLower.includes('air conditioner') ||
            nameLower.includes('purifier') ||
            nameLower.includes('washing') ||
            nameLower.includes('car') ||
            nameLower.includes('fridge') ||
            nameLower.includes('refrigerator');

          if (isHeavyAppliance || daysSinceService !== null) {
            if (daysSinceService === null || daysSinceService > 120) {
              recommendations.push({
                id: `rec_maint_${asset.id}`,
                type: 'maintenance_due',
                severity: isHeavyAppliance ? 'medium' : 'low',
                title: `Service Due for ${asset.name}`,
                description: daysSinceService
                  ? `Last serviced ${daysSinceService} days ago (${lastService?.toISOString().split('T')[0]}). Regular tune-ups prevent failures.`
                  : `No maintenance recorded. Consider scheduling a seasonal tune-up.`,
                suggestedAction: `Check maintenance for ${asset.name}`,
                spokenBriefing: `Your ${asset.name} is due for a regular maintenance check.`,
                assetName: asset.name,
                assetId: asset.id,
              });
            }
          }
        }
      }
    }

    // 3. Check High-Value Assets Missing Invoices/Documents
    if (focusArea === 'all' || focusArea === 'documents') {
      for (const asset of assets) {
        const price = Number(asset.purchasePrice) || 0;
        const hasInvoice = asset.documents.some((d) => d.type === DocumentType.INVOICE || d.type === DocumentType.WARRANTY);
        if (price >= 15000 && !hasInvoice) {
          recommendations.push({
            id: `rec_doc_${asset.id}`,
            type: 'missing_document',
            severity: 'low',
            title: `Upload Receipt for ${asset.name}`,
            description: `No purchase receipt or warranty document attached for this ₹${price.toLocaleString('en-IN')} item.`,
            suggestedAction: `Search documents for ${asset.name}`,
            spokenBriefing: `You have not uploaded an invoice for your ${asset.name}.`,
            assetName: asset.name,
            assetId: asset.id,
          });
        }
      }
    }

    // 4. Check Pending / Overdue Reminders
    if (focusArea === 'all' || focusArea === 'reminders') {
      for (const rem of reminders) {
        if (rem.status === ReminderStatus.PENDING) {
          const due = new Date(rem.dueDate);
          const isOverdue = due < now;
          const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (isOverdue || daysUntil <= 7) {
            recommendations.push({
              id: `rec_rem_${rem.id}`,
              type: 'pending_reminder',
              severity: isOverdue ? 'high' : 'medium',
              title: isOverdue ? `Overdue: ${rem.title}` : `Due Soon: ${rem.title}`,
              description: `Scheduled for ${due.toISOString().split('T')[0]}${rem.asset ? ` (${rem.asset.name})` : ''}.`,
              suggestedAction: `Mark reminder "${rem.title}" as completed`,
              spokenBriefing: isOverdue
                ? `You have an overdue task: "${rem.title}".`
                : `You have an upcoming task due in ${daysUntil} days: "${rem.title}".`,
              assetName: rem.asset?.name,
              assetId: rem.assetId || undefined,
            });
          }
        }
      }
    }

    // Sort by severity (high -> medium -> low)
    const severityWeight = { high: 3, medium: 2, low: 1 };
    recommendations.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);

    const sliced = recommendations.slice(0, limit);

    // Generate natural spoken briefing sentence
    let spokenSummary = '';
    if (sliced.length === 0) {
      spokenSummary = 'Everything looks in great shape in your household! All warranties are current and no urgent maintenance is pending.';
    } else {
      const topItems = sliced.slice(0, 2).map((r) => r.spokenBriefing).join(' Also, ');
      spokenSummary = `Here is your home briefing: ${topItems}. Would you like me to set a reminder or check any details for you?`;
    }

    return {
      totalFound: recommendations.length,
      highPriorityCount: recommendations.filter((r) => r.severity === 'high').length,
      spokenSummary,
      recommendations: sliced,
    };
  }

  // 13. Create Asset (Voice CRUD)
  public static async createAsset(
    args: {
      name: string;
      categoryId?: string;
      purchasePrice?: number;
      purchaseDate?: string;
      location?: string;
      brand?: string;
      model?: string;
      serialNumber?: string;
      seller?: string;
      notes?: string;
      warrantyProvider?: string;
      warrantyDurationMonths?: number;
      warrantyEndDate?: string;
    },
    ctx: ToolExecutionContext
  ) {
    if (!args.name || !args.name.trim()) {
      throw new Error('Asset name is required.');
    }

    const name = args.name.trim();

    // Determine category
    let categoryId = (args.categoryId || '').toLowerCase().trim();
    if (!categoryId) {
      const lowerName = name.toLowerCase();
      if (
        lowerName.includes('tv') ||
        lowerName.includes('laptop') ||
        lowerName.includes('macbook') ||
        lowerName.includes('phone') ||
        lowerName.includes('headphone') ||
        lowerName.includes('speaker') ||
        lowerName.includes('tablet') ||
        lowerName.includes('ipad') ||
        lowerName.includes('camera') ||
        lowerName.includes('monitor') ||
        lowerName.includes('computer')
      ) {
        categoryId = 'electronics';
      } else if (
        lowerName.includes('ac') ||
        lowerName.includes('air conditioner') ||
        lowerName.includes('fridge') ||
        lowerName.includes('refrigerator') ||
        lowerName.includes('washing') ||
        lowerName.includes('microwave') ||
        lowerName.includes('oven') ||
        lowerName.includes('purifier') ||
        lowerName.includes('vacuum') ||
        lowerName.includes('geyser') ||
        lowerName.includes('heater') ||
        lowerName.includes('fan')
      ) {
        categoryId = 'appliances';
      } else if (
        lowerName.includes('sofa') ||
        lowerName.includes('bed') ||
        lowerName.includes('chair') ||
        lowerName.includes('table') ||
        lowerName.includes('wardrobe') ||
        lowerName.includes('desk')
      ) {
        categoryId = 'furniture';
      } else if (
        lowerName.includes('car') ||
        lowerName.includes('bike') ||
        lowerName.includes('scooter') ||
        lowerName.includes('cycle') ||
        lowerName.includes('motorcycle')
      ) {
        categoryId = 'vehicles';
      } else {
        categoryId = 'appliances';
      }
    }

    // Ensure category exists
    const categoryExists = await prisma.assetCategory.findUnique({ where: { id: categoryId } });
    if (!categoryExists) {
      await prisma.assetCategory.create({
        data: {
          id: categoryId,
          name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
        },
      });
    }

    // Execute in transaction
    const newAsset = await prisma.$transaction(async (tx) => {
      const purchaseDate = args.purchaseDate ? new Date(args.purchaseDate) : new Date();
      const asset = await tx.asset.create({
        data: {
          householdId: ctx.householdId,
          name,
          categoryId,
          brand: args.brand?.trim() || null,
          model: args.model?.trim() || null,
          serialNumber: args.serialNumber?.trim() || null,
          purchasePrice: args.purchasePrice ? Number(args.purchasePrice) : null,
          currentValue: args.purchasePrice ? Number(args.purchasePrice) : null,
          purchaseDate,
          location: args.location?.trim() || null,
          seller: args.seller?.trim() || null,
          owner: ctx.userName || 'Household Member',
          notes: args.notes?.trim() || null,
        },
        include: { category: true },
      });

      // Optional Warranty
      let createdWarranty: any = null;
      if (args.warrantyProvider || args.warrantyDurationMonths || args.warrantyEndDate) {
        const provider = args.warrantyProvider?.trim() || args.brand?.trim() || 'Manufacturer';
        let endDate: Date;
        if (args.warrantyEndDate) {
          endDate = new Date(args.warrantyEndDate);
        } else {
          const months = Number(args.warrantyDurationMonths) || 12;
          endDate = new Date(purchaseDate);
          endDate.setMonth(endDate.getMonth() + months);
        }

        createdWarranty = await tx.warranty.create({
          data: {
            assetId: asset.id,
            provider,
            startDate: purchaseDate,
            endDate,
          },
        });

        // Add warranty reminder
        await tx.reminder.create({
          data: {
            householdId: ctx.householdId,
            assetId: asset.id,
            title: `Warranty expiring for ${asset.name}`,
            dueDate: endDate,
            type: ReminderType.WARRANTY_EXPIRY,
            status: ReminderStatus.PENDING,
          },
        });
      }

      return { asset, warranty: createdWarranty };
    });

    logger.info(`Voice Assistant registered new asset: "${newAsset.asset.name}" (${newAsset.asset.id})`, {
      assetId: newAsset.asset.id,
      householdId: ctx.householdId,
      price: args.purchasePrice,
    }, 'VoiceTools');

    return {
      success: true,
      action: 'created_asset',
      message: `Successfully added ${newAsset.asset.name} to your household inventory in ${newAsset.asset.location || 'your home'}${args.purchasePrice ? ` with value ₹${Number(args.purchasePrice).toLocaleString('en-IN')}` : ''}.`,
      asset: {
        id: newAsset.asset.id,
        name: newAsset.asset.name,
        category: newAsset.asset.category?.name || newAsset.asset.categoryId,
        brand: newAsset.asset.brand || 'Not recorded',
        model: newAsset.asset.model || undefined,
        location: newAsset.asset.location || 'General',
        purchasePriceFormatted: newAsset.asset.purchasePrice ? `₹${Number(newAsset.asset.purchasePrice).toLocaleString('en-IN')}` : undefined,
        purchaseDate: newAsset.asset.purchaseDate ? newAsset.asset.purchaseDate.toISOString().split('T')[0] : undefined,
        hasWarranty: Boolean(newAsset.warranty),
        warrantyEndDate: newAsset.warranty ? newAsset.warranty.endDate.toISOString().split('T')[0] : undefined,
        warrantyProvider: newAsset.warranty ? newAsset.warranty.provider : undefined,
      },
    };
  }

  // 14. Update Asset (Voice CRUD)
  public static async updateAsset(
    args: {
      assetId?: string;
      assetName?: string;
      name?: string;
      purchasePrice?: number;
      currentValue?: number;
      location?: string;
      brand?: string;
      model?: string;
      notes?: string;
      categoryId?: string;
    },
    ctx: ToolExecutionContext
  ) {
    let asset: any = null;
    if (args.assetId) {
      asset = await prisma.asset.findFirst({
        where: { id: args.assetId, householdId: ctx.householdId },
      });
    }

    if (!asset && args.assetName) {
      const q = args.assetName.trim();
      asset = await prisma.asset.findFirst({
        where: {
          householdId: ctx.householdId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { brand: { contains: q, mode: 'insensitive' } },
          ],
        },
      });
    }

    if (!asset) {
      return {
        success: false,
        message: `Could not find an asset matching "${args.assetName || args.assetId}" to update.`,
      };
    }

    const updateData: any = {};
    if (args.name) updateData.name = args.name.trim();
    if (args.purchasePrice !== undefined) updateData.purchasePrice = Number(args.purchasePrice);
    if (args.currentValue !== undefined) updateData.currentValue = Number(args.currentValue);
    if (args.location !== undefined) updateData.location = args.location.trim();
    if (args.brand !== undefined) updateData.brand = args.brand.trim();
    if (args.model !== undefined) updateData.model = args.model.trim();
    if (args.notes !== undefined) updateData.notes = args.notes.trim();
    if (args.categoryId !== undefined) {
      const catId = args.categoryId.toLowerCase().trim();
      const catExists = await prisma.assetCategory.findUnique({ where: { id: catId } });
      if (!catExists) {
        await prisma.assetCategory.create({
          data: { id: catId, name: catId.charAt(0).toUpperCase() + catId.slice(1) },
        });
      }
      updateData.categoryId = catId;
    }

    const updated = await prisma.asset.update({
      where: { id: asset.id },
      data: updateData,
      include: { category: true, warranty: true },
    });

    return {
      success: true,
      action: 'updated_asset',
      message: `Updated details for ${updated.name}.`,
      asset: {
        id: updated.id,
        name: updated.name,
        category: updated.category?.name || updated.categoryId,
        brand: updated.brand || 'Not recorded',
        model: updated.model || undefined,
        location: updated.location || 'General',
        purchasePriceFormatted: updated.purchasePrice ? `₹${Number(updated.purchasePrice).toLocaleString('en-IN')}` : undefined,
        currentValueFormatted: updated.currentValue ? `₹${Number(updated.currentValue).toLocaleString('en-IN')}` : undefined,
      },
    };
  }

  // 15. Delete Asset (Voice CRUD)
  public static async deleteAsset(
    args: { assetId?: string; assetName?: string; confirm?: boolean },
    ctx: ToolExecutionContext
  ) {
    let asset: any = null;
    if (args.assetId) {
      asset = await prisma.asset.findFirst({
        where: { id: args.assetId, householdId: ctx.householdId },
      });
    }

    if (!asset && args.assetName) {
      const q = args.assetName.trim();
      asset = await prisma.asset.findFirst({
        where: {
          householdId: ctx.householdId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { brand: { contains: q, mode: 'insensitive' } },
          ],
        },
      });
    }

    if (!asset) {
      return {
        success: false,
        message: `Could not find an asset matching "${args.assetName || args.assetId}" to remove.`,
      };
    }

    await prisma.asset.delete({
      where: { id: asset.id },
    });

    return {
      success: true,
      action: 'deleted_asset',
      message: `Successfully removed ${asset.name} from your household inventory.`,
      deletedAssetName: asset.name,
    };
  }

  // 16. Create Maintenance Record (Voice CRUD)
  public static async createMaintenanceRecord(
    args: {
      assetName?: string;
      assetId?: string;
      title: string;
      type?: string;
      cost?: number;
      serviceDate?: string;
      serviceProvider?: string;
      technicianNotes?: string;
      nextServiceDate?: string;
    },
    ctx: ToolExecutionContext
  ) {
    if (!args.title || !args.title.trim()) {
      throw new Error('Service title is required.');
    }

    let asset: any = null;
    if (args.assetId) {
      asset = await prisma.asset.findFirst({
        where: { id: args.assetId, householdId: ctx.householdId },
      });
    }

    if (!asset && args.assetName) {
      const q = args.assetName.trim();
      asset = await prisma.asset.findFirst({
        where: {
          householdId: ctx.householdId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { brand: { contains: q, mode: 'insensitive' } },
          ],
        },
      });
    }

    if (!asset) {
      asset = await prisma.asset.findFirst({
        where: { householdId: ctx.householdId },
      });

      if (!asset) {
        asset = await prisma.asset.create({
          data: {
            householdId: ctx.householdId,
            name: args.assetName?.trim() || 'General Household Equipment',
            categoryId: 'appliances',
          },
        });
      }
    }

    let maintenanceType: MaintenanceType = MaintenanceType.SCHEDULED_SERVICE;
    const t = (args.type || '').toUpperCase();
    if (t === 'CLEANING') maintenanceType = MaintenanceType.CLEANING;
    else if (t === 'FILTER_REPLACEMENT') maintenanceType = MaintenanceType.FILTER_REPLACEMENT;
    else if (t === 'INSPECTION') maintenanceType = MaintenanceType.INSPECTION;
    else if (t === 'REPAIR') maintenanceType = MaintenanceType.REPAIR;
    else if (t === 'PART_REPLACEMENT') maintenanceType = MaintenanceType.PART_REPLACEMENT;
    else if (t === 'OTHER') maintenanceType = MaintenanceType.OTHER;

    const serviceDate = args.serviceDate ? new Date(args.serviceDate) : new Date();
    const nextServiceDate = args.nextServiceDate ? new Date(args.nextServiceDate) : null;
    const cost = args.cost ? Number(args.cost) : null;

    const record = await prisma.maintenanceRecord.create({
      data: {
        assetId: asset.id,
        title: args.title.trim(),
        type: maintenanceType,
        cost,
        serviceDate,
        serviceProvider: args.serviceProvider?.trim() || null,
        description: args.technicianNotes?.trim() || null,
        nextServiceDate,
      },
      include: { asset: true },
    });

    if (nextServiceDate) {
      await prisma.reminder.create({
        data: {
          householdId: ctx.householdId,
          assetId: asset.id,
          title: `Next service due: ${record.title} (${asset.name})`,
          dueDate: nextServiceDate,
          type: ReminderType.MAINTENANCE_DUE,
          status: ReminderStatus.PENDING,
        },
      });
    }

    logger.info(`Voice Assistant logged maintenance record for ${asset.name}: "${record.title}"`, {
      recordId: record.id,
      cost,
    }, 'VoiceTools');

    return {
      success: true,
      action: 'created_maintenance_record',
      message: `Logged service record for ${asset.name}: "${record.title}"${cost !== null ? ` (Cost: ₹${cost.toLocaleString('en-IN')})` : ''}.`,
      record: {
        id: record.id,
        title: record.title,
        assetName: asset.name,
        type: record.type.toLowerCase(),
        costFormatted: cost !== null ? `₹${cost.toLocaleString('en-IN')}` : '₹0',
        serviceDate: record.serviceDate.toISOString().split('T')[0],
        serviceProvider: record.serviceProvider || 'Self/Authorized',
        technicianNotes: record.description || undefined,
        nextServiceDate: nextServiceDate ? nextServiceDate.toISOString().split('T')[0] : undefined,
      },
    };
  }

  // 17. Create / Attach Document (Voice CRUD)
  public static async createDocument(
    args: {
      assetName?: string;
      assetId?: string;
      name: string;
      type?: string;
      fileUrl?: string;
      notes?: string;
    },
    ctx: ToolExecutionContext
  ) {
    if (!args.name || !args.name.trim()) {
      throw new Error('Document name is required.');
    }

    let asset: any = null;
    if (args.assetId) {
      asset = await prisma.asset.findFirst({
        where: { id: args.assetId, householdId: ctx.householdId },
      });
    }

    if (!asset && args.assetName) {
      const q = args.assetName.trim();
      asset = await prisma.asset.findFirst({
        where: {
          householdId: ctx.householdId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { brand: { contains: q, mode: 'insensitive' } },
          ],
        },
      });
    }

    if (!asset) {
      asset = await prisma.asset.findFirst({
        where: { householdId: ctx.householdId },
      });

      if (!asset) {
        asset = await prisma.asset.create({
          data: {
            householdId: ctx.householdId,
            name: args.assetName?.trim() || 'Household Asset',
            categoryId: 'appliances',
          },
        });
      }
    }

    let docType: DocumentType = DocumentType.INVOICE;
    const t = (args.type || '').toUpperCase();
    if (t === 'WARRANTY') docType = DocumentType.WARRANTY;
    else if (t === 'MANUAL') docType = DocumentType.MANUAL;
    else if (t === 'INSURANCE') docType = DocumentType.INSURANCE;
    else if (t === 'SERVICE') docType = DocumentType.SERVICE;
    else if (t === 'BOX_IMAGE') docType = DocumentType.BOX_IMAGE;
    else if (t === 'OTHER') docType = DocumentType.OTHER;

    const docId = randomUUID();
    const doc = await prisma.document.create({
      data: {
        id: docId,
        assetId: asset.id,
        name: args.name.trim(),
        type: docType,
        mimeType: 'application/pdf',
        fileSizeBytes: 102400,
        fileUrl: args.fileUrl || `/api/documents/${docId}/file`,
      },
      include: { asset: true },
    });

    return {
      success: true,
      action: 'created_document',
      message: `Attached ${doc.type.toLowerCase()} "${doc.name}" to ${asset.name}.`,
      document: {
        id: doc.id,
        name: doc.name,
        type: doc.type.toLowerCase(),
        assetName: asset.name,
        date: doc.createdAt.toISOString().split('T')[0],
        fileUrl: doc.fileUrl,
      },
    };
  }

  // 18. Add or Update Warranty (Voice CRUD)
  public static async addWarranty(
    args: {
      assetName?: string;
      assetId?: string;
      provider: string;
      warrantyNumber?: string;
      startDate?: string;
      endDate?: string;
      durationMonths?: number;
    },
    ctx: ToolExecutionContext
  ) {
    if (!args.provider || !args.provider.trim()) {
      throw new Error('Warranty provider name is required.');
    }

    let asset: any = null;
    if (args.assetId) {
      asset = await prisma.asset.findFirst({
        where: { id: args.assetId, householdId: ctx.householdId },
      });
    }

    if (!asset && args.assetName) {
      const q = args.assetName.trim();
      asset = await prisma.asset.findFirst({
        where: {
          householdId: ctx.householdId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { brand: { contains: q, mode: 'insensitive' } },
          ],
        },
      });
    }

    if (!asset) {
      return {
        success: false,
        message: `Could not find asset "${args.assetName || args.assetId}" to attach warranty.`,
      };
    }

    const startDate = args.startDate ? new Date(args.startDate) : asset.purchaseDate ? new Date(asset.purchaseDate) : new Date();
    let endDate: Date;
    if (args.endDate) {
      endDate = new Date(args.endDate);
    } else {
      const months = Number(args.durationMonths) || 12;
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + months);
    }

    const warranty = await prisma.warranty.upsert({
      where: { assetId: asset.id },
      create: {
        assetId: asset.id,
        provider: args.provider.trim(),
        warrantyNumber: args.warrantyNumber?.trim() || null,
        startDate,
        endDate,
      },
      update: {
        provider: args.provider.trim(),
        warrantyNumber: args.warrantyNumber?.trim() || null,
        startDate,
        endDate,
      },
    });

    // Create / Update warranty reminder
    await prisma.reminder.create({
      data: {
        householdId: ctx.householdId,
        assetId: asset.id,
        title: `Warranty expiring for ${asset.name}`,
        dueDate: endDate,
        type: ReminderType.WARRANTY_EXPIRY,
        status: ReminderStatus.PENDING,
      },
    });

    const now = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      success: true,
      action: 'added_warranty',
      message: `Registered ${warranty.provider} warranty for ${asset.name}, valid until ${endDate.toISOString().split('T')[0]} (${daysLeft} days remaining).`,
      warranty: {
        id: warranty.id,
        assetName: asset.name,
        provider: warranty.provider,
        warrantyNumber: warranty.warrantyNumber || undefined,
        startDate: warranty.startDate.toISOString().split('T')[0],
        endDate: warranty.endDate.toISOString().split('T')[0],
        daysRemaining: Math.max(0, daysLeft),
        status: endDate < now ? 'Expired' : daysLeft <= 30 ? `Expiring soon (${daysLeft} days)` : 'Active',
      },
    };
  }
}
