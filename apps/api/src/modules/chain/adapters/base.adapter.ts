import { Logger } from '@nestjs/common';
import type {
  IChainAdapter,
  CreatePaymentIntentInput,
  CreatePaymentIntentResult,
  WatchTransactionInput,
  VerifyConfirmationResult,
} from '../interfaces/chain-adapter.interface';
import type { ChainConfig, FeeEstimate, TokenSymbol } from '@zappay/shared';

export abstract class BaseChainAdapter implements IChainAdapter {
  protected readonly logger: Logger;
  abstract readonly chainId: number;

  constructor(adapterName: string) {
    this.logger = new Logger(adapterName);
  }

  abstract getConfig(): ChainConfig;

  abstract createPaymentIntent(
    input: CreatePaymentIntentInput,
  ): Promise<CreatePaymentIntentResult>;

  abstract estimateFees(
    currency: TokenSymbol,
    amountRequested: string,
  ): Promise<FeeEstimate | null>;

  abstract watchTransaction(input: WatchTransactionInput): Promise<VerifyConfirmationResult>;

  abstract verifyConfirmation(
    paymentAddress: string,
    amountRequested: string,
    currency: TokenSymbol,
  ): Promise<VerifyConfirmationResult>;

  /**
   * Parse decimal string to bigint with given decimals.
   * e.g. parseAmount("100.50", 6) → 100500000n
   */
  protected parseAmount(amount: string, decimals: number): bigint {
    const [integer, fraction = ''] = amount.split('.');
    const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(`${integer ?? '0'}${paddedFraction}`);
  }

  /**
   * Format bigint back to decimal string.
   * e.g. formatAmount(100500000n, 6) → "100.5"
   */
  protected formatAmount(value: bigint, decimals: number): string {
    const str = value.toString().padStart(decimals + 1, '0');
    const intPart = str.slice(0, -decimals) || '0';
    const fracPart = str.slice(-decimals).replace(/0+$/, '');
    return fracPart ? `${intPart}.${fracPart}` : intPart;
  }
}
