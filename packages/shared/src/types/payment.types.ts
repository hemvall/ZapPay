import type { PaymentStatus } from '../constants/payment-status';
import type { TokenSymbol, FeeEstimate } from './chain.types';

export interface Payment {
  id: string;
  merchantId: string;
  status: PaymentStatus;
  amountRequested: string;
  amountReceived: string | null;
  currency: TokenSymbol;
  chainId: number;
  paymentAddress: string;
  txHash: string | null;
  blockNumber: bigint | null;
  confirmations: number;
  confirmationsRequired: number;
  expiresAt: Date;
  confirmedAt: Date | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentInput {
  merchantId: string;
  amountRequested: string;
  currency: TokenSymbol;
  chainId: number;
  expiresInSeconds?: number;
  metadata?: Record<string, unknown>;
  webhookUrl?: string;
}

export interface PaymentLink {
  paymentId: string;
  url: string;
  qrCodeData: string;
}

export interface PaymentStatusUpdate {
  paymentId: string;
  status: PaymentStatus;
  txHash: string | null;
  confirmations: number;
  timestamp: Date;
}

export interface PaymentEvent {
  id: string;
  paymentId: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: Date;
}

export { FeeEstimate };
