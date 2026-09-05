import { Platform } from 'react-native';
import { API_ENDPOINTS, buildApiUrl, getApiBaseUrl } from '@home-assets/tokens';

const API_BASE = getApiBaseUrl(Platform.OS);

export { API_ENDPOINTS, buildApiUrl, getApiBaseUrl };

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = (): string | null => {
  return authToken;
};

const getHeaders = (contentType = 'application/json') => {
  const headers: Record<string, string> = {};
  if (contentType) headers['Content-Type'] = contentType;
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  return headers;
};

export interface DashboardData {
  user: { id?: string; name: string; fullName?: string; email?: string; householdName?: string };
  totalAssets: number;
  totalPurchaseValue: number;
  growthPercent: string;
  atAGlance: {
    warrantiesExpiring: number;
    maintenanceDue: number;
    documentsMissing: number;
  };
  recentAssets: AssetSummary[];
}

export interface AssetSummary {
  id: string;
  name: string;
  categoryId: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue?: number;
  seller?: string;
  location?: string;
  ownership?: string;
  imageUrl?: string;
  warranty?: {
    provider: string;
    endDate: string;
    status: string;
    validLabel: string;
  };
  maintenance?: {
    nextDueDate: string;
    status: string;
    label: string;
  };
  documentsCount?: number;
}

export interface ReminderData {
  id: string;
  assetId?: string;
  assetName?: string;
  title: string;
  dueDate: string;
  type: 'maintenance' | 'warranty' | 'document' | 'general';
  priority?: 'urgent' | 'upcoming' | 'normal';
  status: 'pending' | 'completed' | 'snoozed';
  notes?: string;
  diffDays?: number;
  daysLabel?: string;
  categoryGroup?: 'due_today' | 'this_month' | 'warranty' | 'upcoming' | 'completed';
  createdAt?: string;
}

export interface ServiceRecordData {
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
  createdAt?: string;
}

export const api = {
  // Auth APIs
  async login(identifier: string, password?: string): Promise<{ token: string; user: any; household: any }> {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.LOGIN, API_BASE), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password: password || 'SecurePass@123' }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Login failed');
    }
    setAuthToken(json.token);
    return json;
  },

  async register(data: {
    fullName: string;
    email: string;
    phone: string;
    password?: string;
    confirmPassword?: string;
    agreeToTerms?: boolean;
  }): Promise<{ token: string; user: any; household: any }> {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.REGISTER, API_BASE), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password || 'SecurePass@123',
        confirmPassword: data.confirmPassword || data.password || 'SecurePass@123',
        agreeToTerms: data.agreeToTerms !== undefined ? data.agreeToTerms : true,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      const errorMsg = Array.isArray(json.error)
        ? json.error.map((e: any) => e.message).join(', ')
        : json.error || 'Registration failed';
      throw new Error(errorMsg);
    }
    setAuthToken(json.token);
    return json;
  },

  async getMe(): Promise<{ user: any; household: any }> {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.ME, API_BASE), {
      headers: getHeaders(),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Unauthorized');
    }
    return json;
  },

  async logout(): Promise<void> {
    try {
      if (authToken) {
        await fetch(buildApiUrl(API_ENDPOINTS.AUTH.LOGOUT, API_BASE), {
          method: 'POST',
          headers: getHeaders(),
        });
      }
    } finally {
      setAuthToken(null);
    }
  },

  // Dashboard Summary
  async getDashboardSummary(): Promise<DashboardData> {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.ASSETS.DASHBOARD_SUMMARY, API_BASE), {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch dashboard summary: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data;
  },

  async getAssets(category?: string, search?: string): Promise<AssetSummary[]> {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(buildApiUrl(`${API_ENDPOINTS.ASSETS.LIST}${query}`, API_BASE), {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch assets: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data || [];
  },

  async getAssetById(id: string): Promise<any> {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.ASSETS.DETAILS(id), API_BASE), {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch asset ${id}: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data;
  },

  async createAsset(assetData: Partial<AssetSummary>): Promise<AssetSummary> {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.ASSETS.CREATE, API_BASE), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(assetData),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to create asset: ${err}`);
    }
    const json = await res.json();
    return json.data;
  },

  async extractInvoice(fileBase64: string, mimeType = 'image/jpeg'): Promise<any> {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.INVOICES.PROCESS, API_BASE), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ fileBase64, mimeType }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Invoice OCR extraction failed: ${err}`);
    }
    const json = await res.json();
    return json.data;
  },

  async getDocuments(assetId?: string, type?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (assetId) params.append('assetId', assetId);
    if (type && type !== 'all') params.append('type', type);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(buildApiUrl(`${API_ENDPOINTS.DOCUMENTS.LIST}${query}`, API_BASE), {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch documents: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data || [];
  },

  async createDocument(docData: {
    assetId: string;
    assetName?: string;
    type?: string;
    name: string;
    fileName?: string;
    fileUrl?: string;
    fileSizeBytes?: number;
    mimeType?: string;
  }): Promise<any> {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.DOCUMENTS.CREATE, API_BASE), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(docData),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to create document: ${err}`);
    }
    const json = await res.json();
    return json.data;
  },

  async getReminders(status?: string, assetId?: string, type?: string): Promise<{ data: ReminderData[]; summary: any }> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (assetId) params.append('assetId', assetId);
    if (type && type !== 'all') params.append('type', type);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(buildApiUrl(`${API_ENDPOINTS.REMINDERS.LIST}${query}`, API_BASE), {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch reminders: ${res.statusText}`);
    }
    return await res.json();
  },

  async createReminder(reminderData: Partial<ReminderData>): Promise<ReminderData> {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.REMINDERS.CREATE, API_BASE), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(reminderData),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to create reminder: ${err}`);
    }
    const json = await res.json();
    return json.data;
  },

  async updateReminder(id: string, updates: Partial<ReminderData> & { snoozeDays?: number }): Promise<ReminderData> {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.REMINDERS.UPDATE(id), API_BASE), {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to update reminder: ${err}`);
    }
    const json = await res.json();
    return json.data;
  },

  async deleteReminder(id: string): Promise<void> {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.REMINDERS.DELETE(id), API_BASE), {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to delete reminder: ${res.statusText}`);
    }
  },

  async getServices(assetId?: string): Promise<{ data: ServiceRecordData[]; totalSpend: number }> {
    const params = new URLSearchParams();
    if (assetId) params.append('assetId', assetId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(buildApiUrl(`${API_ENDPOINTS.SERVICES.LIST}${query}`, API_BASE), {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch service records: ${res.statusText}`);
    }
    return await res.json();
  },

  async createService(serviceData: Partial<ServiceRecordData>): Promise<ServiceRecordData> {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.SERVICES.CREATE, API_BASE), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(serviceData),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to log service: ${err}`);
    }
    const json = await res.json();
    return json.data;
  },

  async deleteService(id: string): Promise<void> {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.SERVICES.DELETE(id), API_BASE), {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to delete service: ${res.statusText}`);
    }
  },

  async getHousehold(): Promise<any> {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.HOUSEHOLD.DETAILS, API_BASE), {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch household: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data;
  },

  async inviteHouseholdMember(memberData: { name: string; emailOrPhone: string; role?: string }): Promise<any> {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.HOUSEHOLD.INVITE, API_BASE), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(memberData),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to invite member: ${err}`);
    }
    const json = await res.json();
    return json.data;
  },

  async removeHouseholdMember(id: string): Promise<void> {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.HOUSEHOLD.REMOVE_MEMBER(id), API_BASE), {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to remove member: ${res.statusText}`);
    }
  },

  async getAnalytics(): Promise<any> {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.ANALYTICS.SUMMARY, API_BASE), {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch analytics: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data;
  },

  async search(query: string): Promise<{ assets: any[]; documents: any[]; services: any[]; reminders: any[]; total: number }> {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.SEARCH.QUERY(query), API_BASE), {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Search failed: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data;
  },
};
