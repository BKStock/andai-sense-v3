/**
 * Shared utility functions
 */

type Lang = 'ja' | 'en';

/**
 * Format a date string as a relative time (e.g. "5分前" / "5m ago")
 */
export function formatRelativeTime(dateStr: string | null | undefined, lang: Lang = 'ja'): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (lang === 'ja') {
    if (diff < 60) return `${diff}秒前`;
    if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
    return `${Math.floor(diff / 86400)}日前`;
  }
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
