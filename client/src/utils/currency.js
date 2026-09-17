/**
 * Formats a numeric value into Indian Rupee currency format (e.g. ₹1,25,000 or ₹250)
 * 
 * @param {number} amount - The numeric value to format
 * @param {Object} options - Formatting options
 * @param {boolean} [options.showSign=false] - Whether to prepend + or - sign
 * @param {string} [options.type] - 'SPENT' or 'RECEIVED' to force sign
 * @param {boolean} [options.forceDecimals=false] - Whether to always show .00
 * @returns {string} Formatted currency string
 */
export function formatINR(amount, options = {}) {
  const { showSign = false, type = null, forceDecimals = false } = options;

  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '₹0';
  }

  const num = Math.abs(Number(amount));
  
  // Decide decimal places: show 2 decimals if it has cents or if forceDecimals is true
  const hasDecimals = !Number.isInteger(num);
  const fractionDigits = forceDecimals ? 2 : (hasDecimals ? 2 : 0);

  const formattedNumber = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(num);

  const base = `₹${formattedNumber}`;

  if (type === 'RECEIVED' || (showSign && Number(amount) > 0)) {
    return `+ ${base}`;
  }

  if (type === 'SPENT' || (showSign && Number(amount) < 0)) {
    return `- ${base}`;
  }

  return base;
}
