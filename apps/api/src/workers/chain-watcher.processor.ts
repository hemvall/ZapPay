import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { ChainService } from '../modules/chain/chain.service';
import { PaymentService } from '../modules/payment/payment.service';
import { QUEUE_PAYMENT_CREATED, JOB_WATCH_ADDRESS } from '../modules/payment/payment.constants';
import { PAYMENT_STATUS } from '@zappay/shared';
import type { TokenSymbol } from '@zappay/shared';

interface WatchAddressJobData {
  paymentId: string;
  paymentAddress: string;
  chainId: number;
  amountRequested: string;
  currency: string;
  expiresAt: string;
}

@Processor(QUEUE_PAYMENT_CREATED)
export class ChainWatcherProcessor extends WorkerHost {
  private readonly logger = new Logger(ChainWatcherProcessor.name);

  constructor(
    private readonly chainService: ChainService,
    private readonly paymentService: PaymentService,
  ) {
    super();
  }

  async process(job: Job<WatchAddressJobData>): Promise<void> {
    const { paymentId, paymentAddress, chainId, amountRequested, currency, expiresAt } =
      job.data;

    if (new Date(expiresAt) < new Date()) {
      this.logger.warn({ paymentId }, 'Payment already expired, skipping watch');
      return;
    }

    // First attempt: transition to PENDING
    if (job.attemptsMade === 0) {
      try {
        await this.paymentService.transitionStatus(paymentId, PAYMENT_STATUS.PENDING);
      } catch {
        // May already be PENDING from a previous attempt — safe to ignore
      }
    }

    const adapter = this.chainService.getAdapter(chainId);
    const result = await adapter.verifyConfirmation(
      paymentAddress,
      amountRequested,
      currency as TokenSymbol,
    );

    if (result.isConfirmed) {
      this.logger.log({ paymentId }, 'Funds detected, transitioning to CONFIRMING');
      await this.paymentService.transitionStatus(paymentId, PAYMENT_STATUS.CONFIRMING, {
        confirmations: result.confirmations,
      });
      return;
    }

    // No funds yet — throw to trigger BullMQ retry with backoff
    this.logger.debug({ paymentId, chainId }, 'No funds detected yet, will retry');
    throw new Error(`No funds at ${paymentAddress} yet (attempt ${job.attemptsMade + 1})`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<WatchAddressJobData>, err: Error): void {
    if (job.attemptsMade >= (job.opts?.attempts ?? 5)) {
      this.logger.warn(
        { paymentId: job.data.paymentId, attempts: job.attemptsMade },
        'Chain watcher exhausted retries — payment will expire via cron',
      );
    } else {
      this.logger.debug(
        { paymentId: job.data.paymentId, err: err.message },
        'Chain watcher retry scheduled',
      );
    }
  }
}
