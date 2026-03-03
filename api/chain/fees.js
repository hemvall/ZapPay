/**
 * Compute the ZapPay platform fee in USD.
 * Shared logic — must match the frontend `estimateFees.ts`.
 *
 * @param {number} amountUsd  Payment amount in USD
 * @param {string} network    Network name (e.g. 'ethereum', 'base')
 * @returns {number} Fee in USD
 */
function computePlatformFee(amountUsd, network) {
  const isL1 = network.toLowerCase() === 'ethereum';
  if (amountUsd < 5) return isL1 ? 0.50 : 0.20;
  if (amountUsd < 10) return isL1 ? 0.80 : 0.30;
  if (amountUsd < 30) return isL1 ? 1.20 : 0.50;
  if (amountUsd < 500) return amountUsd * (isL1 ? 0.02 : 0.01);
  return amountUsd * (isL1 ? 0.01 : 0.005);
}

module.exports = { computePlatformFee };
