export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  householdId: string;
  avatarUrl?: string;
  role: 'Owner' | 'Admin' | 'Member' | 'Viewer';
  createdAt: string;
  updatedAt?: string;
}

export interface HouseholdMember {
  id: string;
  name: string;
  emailOrPhone: string;
  role: 'Owner' | 'Admin' | 'Member' | 'Viewer';
  avatar?: string;
  initials: string;
  joinedDate: string;
  status: 'active' | 'invited';
}

export interface Household {
  id: string;
  name: string;
  plan: 'Standard' | 'Family Pro';
  ownerId: string;
  createdAt: string;
  updatedAt?: string;
  members: HouseholdMember[];
}

export interface StoredSession {
  token: string;
  userId: string;
  createdAt: number;
}

export interface AssetWarranty {
  provider: string;
  durationMonths?: number;
  startDate?: string;
  endDate: string;
  status?: 'active' | 'expired';
  validLabel?: string;
}

export interface AssetItem {
  id: string;
  name: string;
  categoryId: string;
  category?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue?: number;
  seller?: string;
  location?: string;
  ownership?: 'Me' | 'Spouse' | 'Shared' | 'Other' | string;
  imageUrl?: string;
  notes?: string;
  documentsCount?: number;
  createdAt: string;
  updatedAt?: string;
  warranty?: AssetWarranty;
}

export interface DocumentItem {
  id: string;
  assetId: string;
  assetName: string;
  type: 'invoice' | 'warranty' | 'manual' | 'insurance' | 'service' | 'box_image' | 'other';
  name: string;
  fileName: string;
  date: string;
  sizeFormatted?: string;
  mimeType: string;
  fileUrl: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ServiceRecord {
  id: string;
  assetId: string;
  assetName: string;
  title: string;
  type?: string;
  cost: number;
  serviceDate: string;
  serviceProvider?: string;
  technicianNotes?: string;
  nextDueDate?: string;
  documentId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ReminderItem {
  id: string;
  assetId?: string;
  assetName?: string;
  title: string;
  dueDate: string;
  type: 'maintenance' | 'warranty' | 'document' | 'general';
  priority?: 'urgent' | 'upcoming' | 'normal';
  status: 'pending' | 'completed' | 'snoozed';
  notes?: string;
  createdAt: string;
}
