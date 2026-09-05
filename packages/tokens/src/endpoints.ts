declare const process: any;

/**
 * Default API Ports and Hosts
 */
export const DEFAULT_API_PORT = 4005;
export const DEFAULT_API_HOST = 'localhost';
export const DEFAULT_WEB_PORT = 3010;

/**
 * Base API URL definitions
 */
export const API_BASE_URL = {
  WEB: (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || 'http://localhost:4005/api',
  MOBILE_LOCAL: 'http://localhost:4005/api',
  MOBILE_ANDROID_EMULATOR: 'http://10.0.2.2:4005/api',
  SERVER: `http://localhost:${(typeof process !== 'undefined' && process.env?.PORT) || 4005}/api`,
} as const;

/**
 * Helper function to get base API URL based on platform/environment
 */
export function getApiBaseUrl(platform?: 'android' | 'ios' | 'web' | string): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (platform === 'android') {
    return API_BASE_URL.MOBILE_ANDROID_EMULATOR;
  }
  return API_BASE_URL.WEB;
}

/**
 * Unified API Endpoints Map
 */
export const API_ENDPOINTS = {
  // Health
  HEALTH: '/health',

  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_OTP: '/auth/verify-otp',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
    UPDATE_PROFILE: '/auth/profile',
  },

  // Assets
  ASSETS: {
    LIST: '/assets',
    CREATE: '/assets',
    DETAILS: (id: string) => `/assets/${id}`,
    UPDATE: (id: string) => `/assets/${id}`,
    DELETE: (id: string) => `/assets/${id}`,
    DASHBOARD_SUMMARY: '/assets/dashboard/summary',
  },

  // Invoices & AI OCR
  INVOICES: {
    PROCESS: '/invoices/process',
    EXTRACT: '/invoices/extract',
  },

  // Documents
  DOCUMENTS: {
    LIST: '/documents',
    CREATE: '/documents',
    DETAILS: (id: string) => `/documents/${id}`,
    UPDATE: (id: string) => `/documents/${id}`,
    DELETE: (id: string) => `/documents/${id}`,
    BY_ASSET: (assetId: string) => `/documents?assetId=${encodeURIComponent(assetId)}`,
  },

  // Reminders
  REMINDERS: {
    LIST: '/reminders',
    CREATE: '/reminders',
    DETAILS: (id: string) => `/reminders/${id}`,
    UPDATE: (id: string) => `/reminders/${id}`,
    DELETE: (id: string) => `/reminders/${id}`,
    COMPLETE: (id: string) => `/reminders/${id}`,
    SNOOZE: (id: string) => `/reminders/${id}`,
  },

  // Services / Maintenance Records
  SERVICES: {
    LIST: '/services',
    CREATE: '/services',
    DETAILS: (id: string) => `/services/${id}`,
    UPDATE: (id: string) => `/services/${id}`,
    DELETE: (id: string) => `/services/${id}`,
    BY_ASSET: (assetId: string) => `/services?assetId=${encodeURIComponent(assetId)}`,
  },

  // Household & Sharing
  HOUSEHOLD: {
    DETAILS: '/household',
    MEMBERS: '/household/members',
    INVITE: '/household/members',
    UPDATE_MEMBER: (id: string) => `/household/members/${id}`,
    REMOVE_MEMBER: (id: string) => `/household/members/${id}`,
    EXPORT: (format: 'json' | 'csv' = 'json') => `/household/export?format=${format}`,
  },

  // Analytics
  ANALYTICS: {
    SUMMARY: '/analytics',
    SPEND: '/analytics/spend',
    CATEGORIES: '/analytics/categories',
  },

  // Search
  SEARCH: {
    QUERY: (query: string) => `/search?q=${encodeURIComponent(query)}`,
  },
} as const;

/**
 * Utility helper to build full URL from endpoint and optional baseUrl
 */
export function buildApiUrl(endpoint: string, baseUrl?: string): string {
  const base = baseUrl || getApiBaseUrl();
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${cleanBase}${cleanEndpoint}`;
}
