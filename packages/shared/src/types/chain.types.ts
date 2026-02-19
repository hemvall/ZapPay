export const SUPPORTED_CHAINS = {
  ETHEREUM_MAINNET: 1,
  ETHEREUM_SEPOLIA: 11155111,
} as const;

export type ChainId = (typeof SUPPORTED_CHAINS)[keyof typeof SUPPORTED_CHAINS];

export const SUPPORTED_TOKENS = ['USDC', 'USDT', 'ETH'] as const;
export type TokenSymbol = (typeof SUPPORTED_TOKENS)[number];

export interface ChainConfig {
  chainId: number;
  name: string;
  nativeCurrency: string;
  explorerUrl: string;
  confirmationsRequired: number;
  isEnabled: boolean;
  tokens: TokenConfig[];
}

export interface TokenConfig {
  symbol: TokenSymbol;
  address: string | null; // null = native token
  decimals: number;
}

export interface FeeEstimate {
  gasPriceGwei: string;
  estimatedGasUnits: bigint;
  totalFeeNative: string;
  totalFeeUsd: string | null;
  confidence: 'low' | 'medium' | 'high';
  estimatedAt: Date;
}

export interface TransactionReceipt {
  txHash: string;
  blockNumber: bigint;
  blockHash: string;
  confirmations: number;
  status: 'success' | 'reverted';
  from: string;
  to: string;
  value: bigint;
  gasUsed: bigint;
}
