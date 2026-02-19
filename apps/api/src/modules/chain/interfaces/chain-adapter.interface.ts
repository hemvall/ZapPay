import type { FeeEstimate, TransactionReceipt, ChainConfig, TokenSymbol } from '@zappay/shared';

export interface CreatePaymentIntentInput {
  paymentId: string;
  amountRequested: string;
  currency: TokenSymbol;
  merchantId: string;
}

export interface CreatePaymentIntentResult {
  paymentAddress: string;
  derivationIndex?: number;
}

export interface WatchTransactionInput {
  txHash: string;
  paymentAddress: string;
  amountRequested: string;
  currency: TokenSymbol;
}

export interface VerifyConfirmationResult {
  isConfirmed: boolean;
  confirmations: number;
  receipt: TransactionReceipt | null;
}

/**
 * Core abstraction for blockchain interactions.
 * Every supported chain implements this interface.
 * Adding a new chain = create adapter + register in ChainModule. Zero core changes.
 */
export interface IChainAdapter {
  readonly chainId: number;

  getConfig(): ChainConfig;

  createPaymentIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult>;

  estimateFees(currency: TokenSymbol, amountRequested: string): Promise<FeeEstimate | null>;

  watchTransaction(input: WatchTransactionInput): Promise<VerifyConfirmationResult>;

  verifyConfirmation(
    paymentAddress: string,
    amountRequested: string,
    currency: TokenSymbol,
  ): Promise<VerifyConfirmationResult>;
}
