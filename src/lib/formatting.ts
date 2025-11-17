export function formatPriceINR(value: number | string | undefined | null) {
  const num = Number(value ?? 0) || 0;
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(num);
  } catch (e) {
    // Fallback to bare number with rupee symbol
    return `₹${num.toFixed(2)}`;
  }
}

export default formatPriceINR;
