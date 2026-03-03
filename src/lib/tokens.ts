import type { Address } from 'viem';

export const TOKEN_ADDRESSES: Record<string, Record<number, Address>> = {
  USDC: {
    1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',      // Ethereum mainnet
    8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',    // Base
    11155111: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia
  },
  USDT: {
    1: '0xdAC17F958D2ee523a2206206994597C13D831ec7',      // Ethereum mainnet
    8453: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',    // Base
    11155111: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06', // Sepolia
  },
};

export const TOKEN_DECIMALS: Record<string, number> = {
  ETH: 18,
  USDC: 6,
  USDT: 6,
};

export const NETWORK_CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  base: 8453,
  sepolia: 11155111,
};

export const ZAPPAY_TREASURY = import.meta.env.VITE_ZAPPAY_TREASURY_ADDRESS || '0x0000000000000000000000000000000000000000';
