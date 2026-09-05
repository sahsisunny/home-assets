/**
 * Formats a number to Indian Rupee representation (e.g. ₹12,45,000 or ₹69,999)
 */
export function formatINR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '₹0';
  }
  const numericAmount = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(numericAmount);
}

/**
 * Formats a date to standard display format (e.g. "03 Sep 2025")
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(parsedDate.getTime())) return 'Invalid Date';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate);
}

/**
 * Calculates remaining days from today until target date
 */
export function getDaysRemaining(targetDate: Date | string | null | undefined): number {
  if (!targetDate) return 0;
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Returns humanized remaining label (e.g. "Expires in 43 days", "Due today", "Expired 5 days ago")
 */
export function formatRemainingDaysLabel(targetDate: Date | string | null | undefined, type: 'warranty' | 'service' = 'warranty'): string {
  const days = getDaysRemaining(targetDate);
  const actionPrefix = type === 'warranty' ? 'Expires' : 'Due';

  if (days < 0) {
    return `${type === 'warranty' ? 'Expired' : 'Overdue'} ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
  }
  if (days === 0) {
    return `${actionPrefix} today`;
  }
  if (days === 1) {
    return `${actionPrefix} tomorrow`;
  }
  if (days > 30 && days <= 365) {
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? '' : 's'} left`;
  }
  return `${actionPrefix} in ${days} days`;
}
