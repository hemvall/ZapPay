import type { Payment } from '@prisma/client';

export class PaymentResponseDto {
  id: string;
  status: string;
  amountRequested: string;
  currency: string;
  chainId: number;
  paymentAddress: string;
  txHash: string | null;
  confirmations: number;
  confirmationsRequired: number;
  expiresAt: string;
  confirmedAt: string | null;
  paymentUrl: string;
  createdAt: string;

  constructor(payment: Payment, linkBaseUrl: string) {
    this.id = payment.id;
    this.status = payment.status;
    this.amountRequested = payment.amountRequested.toString();
    this.currency = payment.currency;
    this.chainId = payment.chainId;
    this.paymentAddress = payment.paymentAddress;
    this.txHash = payment.txHash;
    this.confirmations = payment.confirmations;
    this.confirmationsRequired = payment.confirmationsRequired;
    this.expiresAt = payment.expiresAt.toISOString();
    this.confirmedAt = payment.confirmedAt?.toISOString() ?? null;
    this.paymentUrl = `${linkBaseUrl}/${payment.id}`;
    this.createdAt = payment.createdAt.toISOString();
  }
}
