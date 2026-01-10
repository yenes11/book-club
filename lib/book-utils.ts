/**
 * Kitap ile ilgili utility fonksiyonları
 */

/**
 * Tarih string'ini "YYYY-MM" formatına çevirir
 */
export function getMonthKey(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

