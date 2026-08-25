/**
 * Formats a numeric amount into Nigerian Naira (NGN / ₦) currency string.
 * Example: 150000 -> "₦150,000.00"
 */
export function formatNaira(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '₦0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₦0.00';
  return '₦' + num.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
