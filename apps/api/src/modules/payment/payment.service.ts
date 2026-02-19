import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { Merchant, Payment } from '@prisma/client';
import { PaymentStatus } from '@prisma/client';
import type { InputJsonValue } from '@prisma/client/runtime/library';
import { PaymentRepository } from './payment.repository';
import { PaymentSseService } from './payment-sse.service';
import { ChainService } from '../chain/chain.service';
import type { CreatePaymentDto } from './dto/create-payment.dto';
import {
  QUEUE_PAYMENT_CREATED,
  QUEUE_WEBHOOK_SEND,
  JOB_WATCH_ADDRESS,
  JOB_SEND_WEBHOOK,
} from './payment.constants';
import { PAYMENT_STATUS, PAYMENT_STATUS_TRANSITIONS } from '@zappay/shared';
import type { PaymentStatus as SharedPaymentStatus, TokenSymbol } from '@zappay/shared';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly repo: PaymentRepository,
    private readonly chainService: ChainService,
    private readonly sse: PaymentSseService,
    private readonly config: ConfigService,
    @InjectQueue(QUEUE_PAYMENT_CREATED) private readonly paymentCreatedQueue: Queue,
    @InjectQueue(QUEUE_WEBHOOK_SEND) private readonly webhookQueue: Queue,
  ) {}

  async createPayment(dto: CreatePaymentDto, merchant: Merchant): Promise<Payment> {
    const adapter = this.chainService.getAdapter(dto.chainId);

    const { paymentAddress } = await adapter.createPaymentIntent({
      paymentId: `tmp-${Date.now()}`,
      amountRequested: dto.amountRequested,
      currency: dto.currency as TokenSymbol,
      merchantId: merchant.id,
    });

    const defaultExpiry = this.config.get<number>('PAYMENT_DEFAULT_EXPIRY_SECONDS', 1800);
    const expiresInSeconds = dto.expiresInSeconds ?? defaultExpiry;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    const confirmationsRequired = adapter.getConfig().confirmationsRequired;

    const payment = await this.repo.create({
      merchant: { connect: { id: merchant.id } },
      status: PaymentStatus.CREATED,
      amountRequested: dto.amountRequested,
      currency: dto.currency as TokenSymbol,
      chainId: dto.chainId,
      paymentAddress,
      confirmationsRequired,
      expiresAt,
      webhookUrl: dto.webhookUrl ?? merchant.webhookUrl,
      metadata: (dto.metadata ?? {}) as unknown as InputJsonValue,
    });

    await this.repo.recordEvent(payment.id, 'PAYMENT_CREATED', null, PaymentStatus.CREATED, {
      merchantId: merchant.id,
    });

    await this.paymentCreatedQueue.add(
      JOB_WATCH_ADDRESS,
      {
        paymentId: payment.id,
        paymentAddress,
        chainId: dto.chainId,
        amountRequested: dto.amountRequested,
        currency: dto.currency,
        expiresAt: expiresAt.toISOString(),
      },
      {
        jobId: `watch-${payment.id}`,
        delay: 15000, // start watching after 15s (allow tx propagation)
      },
    );

    this.logger.log({ paymentId: payment.id, chainId: dto.chainId }, 'Payment created');
    return payment;
  }

  async findById(id: string): Promise<Payment> {
    const payment = await this.repo.findById(id);
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);
    return payment;
  }

  /**
   * Transitions payment status following the state machine.
   * Throws if transition is invalid.
   * Emits SSE event + enqueues webhook on every valid transition.
   */
  async transitionStatus(
    paymentId: string,
    newStatus: SharedPaymentStatus,
    extra?: {
      txHash?: string;
      blockNumber?: bigint;
      confirmations?: number;
    },
  ): Promise<Payment> {
    const payment = await this.findById(paymentId);
    const currentStatus = payment.status as SharedPaymentStatus;

    const allowed = PAYMENT_STATUS_TRANSITIONS[currentStatus];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition: ${currentStatus} → ${newStatus}`,
      );
    }

    const updated = await this.repo.updateStatus(
      paymentId,
      newStatus as PaymentStatus,
      {
        txHash: extra?.txHash,
        blockNumber: extra?.blockNumber,
        confirmations: extra?.confirmations,
        confirmedAt: newStatus === PAYMENT_STATUS.CONFIRMED ? new Date() : undefined,
      },
    );

    await this.repo.recordEvent(paymentId, 'STATUS_CHANGED', currentStatus as PaymentStatus, newStatus as PaymentStatus, {
      txHash: extra?.txHash,
      confirmations: extra?.confirmations,
      blockNumber: extra?.blockNumber?.toString(),
    });

    this.sse.emitStatusChange({
      paymentId,
      status: newStatus,
      txHash: extra?.txHash ?? null,
      confirmations: extra?.confirmations ?? 0,
      timestamp: new Date(),
    });

    const TERMINAL_STATUSES: string[] = [
      PAYMENT_STATUS.CONFIRMED,
      PAYMENT_STATUS.FAILED,
      PAYMENT_STATUS.EXPIRED,
    ];
    const isTerminal = TERMINAL_STATUSES.includes(newStatus);

    if (isTerminal && payment.webhookUrl) {
      await this.webhookQueue.add(JOB_SEND_WEBHOOK, {
        paymentId,
        merchantId: payment.merchantId,
        webhookUrl: payment.webhookUrl,
        event: `payment.${newStatus.toLowerCase()}`,
        payload: {
          paymentId,
          status: newStatus,
          timestamp: new Date().toISOString(),
          txHash: extra?.txHash ?? null,
        },
      });
    }

    this.logger.log({ paymentId, from: currentStatus, to: newStatus }, 'Payment status changed');
    return updated;
  }
}
