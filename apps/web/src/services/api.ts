import { API_ENDPOINTS, buildApiUrl, getApiBaseUrl } from '@home-assets/tokens';

export interface DashboardData {
  user?: { name: string };
  totalAssets: number;
  totalPurchaseValue: number;
  growthPercent: string;
  atAGlance: {
    warrantiesExpiring: number;
    maintenanceDue: number;
    documentsMissing: number;
  };
  recentAssets: any[];
}

export const webApi = {
  // Base URLs & Helpers
  baseUrl: getApiBaseUrl('web'),
  endpoints: API_ENDPOINTS,
  buildUrl: (endpoint: string) => buildApiUrl(endpoint),

  // Assets
  async getAssets(category?: string, search?: string) {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(buildApiUrl(`${API_ENDPOINTS.ASSETS.LIST}${query}`));
    if (!res.ok) throw new Error(`Failed to fetch assets: ${res.statusText}`);
    const json = await res.json();
    return json.data || [];
  },

  async getAssetById(id: string) {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.ASSETS.DETAILS(id)));
    if (!res.ok) throw new Error(`Failed to fetch asset: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },

  async createAsset(assetData: any) {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.ASSETS.CREATE), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assetData),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to create asset: ${err}`);
    }
    const json = await res.json();
    return json.data;
  },

  async updateAsset(id: string, assetData: any) {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.ASSETS.UPDATE(id)), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assetData),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to update asset: ${err}`);
    }
    const json = await res.json();
    return json.data;
  },

  async deleteAsset(id: string) {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.ASSETS.DELETE(id)), {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete asset: ${res.statusText}`);
    return true;
  },

  // Invoices & AI OCR
  async processInvoice(imageBase64: string, mimeType = 'image/jpeg') {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.INVOICES.PROCESS), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to process invoice: ${err}`);
    }
    return await res.json();
  },

  // Documents
  async getDocuments(type?: string, assetId?: string) {
    const params = new URLSearchParams();
    if (type && type !== 'all') params.append('type', type);
    if (assetId) params.append('assetId', assetId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(buildApiUrl(`${API_ENDPOINTS.DOCUMENTS.LIST}${query}`));
    if (!res.ok) throw new Error(`Failed to fetch documents: ${res.statusText}`);
    const json = await res.json();
    return json.data || [];
  },

  async createDocument(docData: any) {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.DOCUMENTS.CREATE), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(docData),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to save document: ${err}`);
    }
    const json = await res.json();
    return json.data;
  },

  async updateDocument(id: string, docData: any) {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.DOCUMENTS.UPDATE(id)), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(docData),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to update document: ${err}`);
    }
    const json = await res.json();
    return json.data;
  },

  async deleteDocument(id: string) {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.DOCUMENTS.DELETE(id)), {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete document: ${res.statusText}`);
    return true;
  },

  // Reminders
  async getReminders(status?: string, type?: string, assetId?: string) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (type && type !== 'all') params.append('type', type);
    if (assetId) params.append('assetId', assetId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(buildApiUrl(`${API_ENDPOINTS.REMINDERS.LIST}${query}`));
    if (!res.ok) throw new Error(`Failed to fetch reminders: ${res.statusText}`);
    const json = await res.json();
    return json.data || [];
  },

  async createReminder(reminderData: any) {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.REMINDERS.CREATE), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reminderData),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to create reminder: ${err}`);
    }
    const json = await res.json();
    return json.data;
  },

  async updateReminder(id: string, patchData: any) {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.REMINDERS.UPDATE(id)), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patchData),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to update reminder: ${err}`);
    }
    const json = await res.json();
    return json.data;
  },

  async deleteReminder(id: string) {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.REMINDERS.DELETE(id)), {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete reminder: ${res.statusText}`);
    return true;
  },

  // Services
  async getServices(assetId?: string) {
    const params = new URLSearchParams();
    if (assetId) params.append('assetId', assetId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(buildApiUrl(`${API_ENDPOINTS.SERVICES.LIST}${query}`));
    if (!res.ok) throw new Error(`Failed to fetch services: ${res.statusText}`);
    const json = await res.json();
    return json.data || [];
  },

  async createService(serviceData: any) {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.SERVICES.CREATE), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serviceData),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to create service: ${err}`);
    }
    const json = await res.json();
    return json.data;
  },

  async updateService(id: string, serviceData: any) {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.SERVICES.UPDATE(id)), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serviceData),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to update service: ${err}`);
    }
    const json = await res.json();
    return json.data;
  },

  async deleteService(id: string) {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.SERVICES.DELETE(id)), {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete service: ${res.statusText}`);
    return true;
  },

  // Household
  async getHousehold() {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.HOUSEHOLD.DETAILS));
    if (!res.ok) throw new Error(`Failed to fetch household: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },

  async inviteMember(memberData: { name: string; emailOrPhone: string; role?: string }) {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.HOUSEHOLD.INVITE), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberData),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to invite member: ${err}`);
    }
    const json = await res.json();
    return json.data;
  },

  async updateMemberRole(memberId: string, role: string) {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.HOUSEHOLD.UPDATE_MEMBER(memberId)), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to update member role: ${err}`);
    }
    const json = await res.json();
    return json.data;
  },

  async removeMember(memberId: string) {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.HOUSEHOLD.REMOVE_MEMBER(memberId)), {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to remove member: ${res.statusText}`);
    return true;
  },

  getExportUrl(format: 'json' | 'csv' = 'json') {
    return buildApiUrl(API_ENDPOINTS.HOUSEHOLD.EXPORT(format));
  },

  // Analytics
  async getAnalytics() {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.ANALYTICS.SUMMARY));
    if (!res.ok) throw new Error(`Failed to fetch analytics: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },

  // Search
  async search(query: string) {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.SEARCH.QUERY(query)));
    if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },
};
