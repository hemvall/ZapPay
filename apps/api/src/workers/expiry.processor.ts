import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentRepository } from '../modules/payment/payment.repository';
import { PaymentService } from '../modules/payment/payment.service';
import { PAYMENT_STATUS } from '@zappay/shared';

@Injectable()
export class ExpiryProcessor {
  private readonly logger = new Logger(ExpiryProcessor.name);

  constructor(
    private readonly repo: PaymentRepository,
    private readonly paymentService: PaymentService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredPayments(): Promise<void> {
    const expired = await this.repo.findExpired();

    if (expired.length === 0) return;

    this.logger.log({ count: expired.length }, 'Processing expired payments');

    await Promise.allSettled(
      expired.map(async (p) => {
        try {
          await this.paymentService.transitionStatus(p.id, PAYMENT_STATUS.EXPIRED);
          this.logger.log({ paymentId: p.id }, 'Payment expired');
        } catch (err) {
          this.logger.error({ paymentId: p.id, err }, 'Failed to expire payment');
        }
      }),
    );
  }
}
