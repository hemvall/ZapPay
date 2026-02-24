// Fee schedule (USD amounts):
// 0.5–5     => Base: $0.20   | ETH: $0.50
// 5–10      => Base: $0.30   | ETH: $0.80
// 10–30     => Base: $0.50   | ETH: $1.20
// 30–500    => Base: 1%       | ETH: 2%
// 500+      => Base: 0.5%     | ETH: 1%

/**
 * Estimate fees in USD for a payment amount.
 * - `amount` is the payment amount in USD.
 * - `crypto` is the asset symbol (e.g. 'ETH', 'USDC').
 * - `network` is a network identifier (not required for current logic but kept for compatibility).
 *
 * For ETH payments we apply the "ETH" column (fixed-dollar tiers for small amounts,
 * percentage tiers for larger amounts). For other cryptos we apply the "Base" column.
 */


/// TODO : AutoUpdate fee when changing amount or crypto, and show breakdown of fee calculation (e.g. "0.5% of $600 = $3.00")
export function estimateFees(amount: number, crypto: string, network: string): number {
	const a = Math.max(0, amount)
	const isEth = typeof crypto === 'string' && crypto.trim().toLowerCase() === 'eth'

	// small absolute fees (USD)
	if (a < 5) {
		return parseFloat((isEth ? 0.5 : 0.2).toFixed(4))
	}
	if (a < 10) {
		return parseFloat((isEth ? 0.8 : 0.3).toFixed(4))
	}
	if (a < 30) {
		return parseFloat((isEth ? 1.2 : 0.5).toFixed(4))
	}

	// percentage tiers for larger amounts
	if (a < 500) {
		const rate = isEth ? 0.02 : 0.01
		return parseFloat((a * rate).toFixed(4))
	}

	// 500+
	const rate = isEth ? 0.01 : 0.005
	return parseFloat((a * rate).toFixed(4))
}



