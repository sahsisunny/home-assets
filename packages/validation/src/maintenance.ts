import { z } from 'zod';

export const MaintenanceTypeEnum = z.enum([
  'scheduled_service',
  'cleaning',
  'filter_replacement',
  'inspection',
  'repair',
  'part_replacement',
  'other',
]);

export const CreateMaintenanceScheduleSchema = z.object({
  assetId: z.string().uuid(),
  title: z.string().min(2, 'Title is required'),
  frequencyMonths: z.number().int().positive(),
  nextDueDate: z.string(),
  enabled: z.boolean().default(true),
});

export const CreateMaintenanceRecordSchema = z.object({
  assetId: z.string().uuid(),
  type: MaintenanceTypeEnum,
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional(),
  cost: z.number().nonnegative().optional(),
  serviceProvider: z.string().optional(),
  serviceDate: z.string(),
  nextServiceDate: z.string().optional(),
  documentId: z.string().uuid().optional(),
});

export type CreateMaintenanceScheduleInput = z.infer<typeof CreateMaintenanceScheduleSchema>;
export type CreateMaintenanceRecordInput = z.infer<typeof CreateMaintenanceRecordSchema>;
