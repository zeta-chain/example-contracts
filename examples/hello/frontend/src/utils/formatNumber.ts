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
