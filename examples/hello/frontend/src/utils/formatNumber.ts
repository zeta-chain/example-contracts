/**
 * Formats a number with comma separators
 * @param num - The number to format
 * @returns The formatted number string
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};

/**
 * Formats a number with custom locale
 * @param num - The number to format
 * @param locale - The locale to use (default: 'en-US')
 * @returns The formatted number string
 */
export const formatNumberWithLocale = (
  num: number,
  locale: string = 'en-US'
): string => {
  return num.toLocaleString(locale);
};

/**
 * Formats a number with a limited number of significant digits
 * @param num - The number to format
 * @param maxSignificantDigits - Maximum significant digits to keep (default: 4)
 * @param locale - The locale to use (default: 'en-US')
 * @returns The formatted number string
 */
export const formatNumberSignificant = (
  num: number,
  maxSignificantDigits: number = 4,
  locale: string = 'en-US'
): string => {
  if (!Number.isFinite(num)) return '';
  return new Intl.NumberFormat(locale, {
    maximumSignificantDigits: maxSignificantDigits,
  }).format(num);
};
