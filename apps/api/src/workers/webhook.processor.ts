import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUE_WEBHOOK_SEND } from '../modules/payment/payment.constants';

interface SendWebhookJobData {
  paymentId: string;
  merchantId: string;
  webhookUrl: string;
  event: string;
  payload: Record<string, unknown>;
}

@Processor(QUEUE_WEBHOOK_SEND)
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<SendWebhookJobData>): Promise<void> {
    const { paymentId, merchantId, webhookUrl, event, payload } = job.data;

    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        merchantId,
        paymentId,
        url: webhookUrl,
        payload: { event, ...payload },
      },
    });

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ZapPay-Event': event,
          'X-ZapPay-PaymentId': paymentId,
        },
        body: JSON.stringify({ event, paymentId, ...payload }),
        signal: AbortSignal.timeout(10_000),
      });

      const httpCode = response.status;

      await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: response.ok ? 'SUCCESS' : 'FAILED',
          attemptCount: { increment: 1 },
          lastHttpCode: httpCode,
        },
      });

      if (!response.ok) {
        throw new Error(`Webhook endpoint returned HTTP ${httpCode}`);
      }

      this.logger.log({ paymentId, webhookUrl, status: httpCode }, 'Webhook delivered');
    } catch (err) {
      const attemptCount = (job.attemptsMade ?? 0) + 1;
      const maxAttempts = 5;
      const isExhausted = attemptCount >= maxAttempts;

      await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: isExhausted ? 'EXHAUSTED' : 'FAILED',
          attemptCount,
          lastError: err instanceof Error ? err.message : String(err),
          nextRetryAt: isExhausted
            ? null
            : new Date(Date.now() + Math.pow(2, attemptCount) * 1000),
        },
      });

      this.logger.warn(
        { paymentId, webhookUrl, attempt: attemptCount, err: err instanceof Error ? err.message : err },
        'Webhook delivery failed',
      );
      throw err;
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<SendWebhookJobData>, err: Error): void {
    this.logger.error(
      { jobId: job.id, paymentId: job.data.paymentId, err: err.message },
      'Webhook job exhausted all retries',
    );
  }
}
