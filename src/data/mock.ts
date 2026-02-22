export const FEES: Record<string, number> = {
  'USDC-Base': 0.002,
  'USDT-Base': 0.002,
  'ETH-Base': 0.005,
  'USDC-Ethereum': 0.01,
  'USDT-Ethereum': 0.01,
  'ETH-Ethereum': 0.008,
}

export function estimateFees(amount: number, crypto: string, network: string): number {
  const rate = FEES[`${crypto}-${network}`] ?? 0.01
  return parseFloat((amount * rate).toFixed(4))
}

export function generateId(): string {
  return 'pay_' + Math.random().toString(36).substring(2, 9)
}

export function shortAddr(addr: string): string {
  if (addr.length <= 12) return addr
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}
