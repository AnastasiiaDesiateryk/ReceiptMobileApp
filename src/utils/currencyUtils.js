export function formatCurrency(amount, currencyCode) {
  try {
    if (typeof amount !== 'number') amount = Number(amount);
    if (isNaN(amount)) return '';
    return amount.toLocaleString(undefined, {
      style: 'currency',
      currency: currencyCode || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return '';
  }
}
