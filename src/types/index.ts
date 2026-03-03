export type Crypto = 'USDC' | 'USDT' | 'ETH'
export type Network = 'Ethereum' | 'Base' | 'Sepolia'

export interface Payment {
  id: string
  amount: string
  token: string
  network: string
  recipientAddress: string
  label: string | null
  merchantName: string | null
  status: string
  txHash: string | null
  payer: string | null
  createdAt: string
  updatedAt: string
}
