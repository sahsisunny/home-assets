/**
 * Design system colors matching Home Asset Manager Figma / UI mockups
 */
export const colors = {
  primary: {
    DEFAULT: '#5C4EBA',
    hover: '#4C3FA3',
    active: '#3E328A',
    light: '#EEF0FF',
    subtle: '#F4F5FF',
  },
  status: {
    active: {
      text: '#059669',
      bg: '#ECFDF5',
      border: '#A7F3D0',
      dot: '#10B981',
    },
    warning: {
      text: '#D97706',
      bg: '#FFFBEB',
      border: '#FDE68A',
      dot: '#F59E0B',
    },
    danger: {
      text: '#DC2626',
      bg: '#FEF2F2',
      border: '#FECACA',
      dot: '#EF4444',
    },
    info: {
      text: '#2563EB',
      bg: '#EFF6FF',
      border: '#BFDBFE',
      dot: '#3B82F6',
    },
  },
  neutral: {
    50: '#F8F9FD',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    white: '#FFFFFF',
    black: '#000000',
  },
  card: {
    bg: '#FFFFFF',
    border: '#E2E8F0',
    shadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  },
} as const;

export type Colors = typeof colors;
