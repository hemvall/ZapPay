import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Payment, Prisma } from '@prisma/client';
import { PaymentStatus } from '@prisma/client';
import type { InputJsonValue } from '@prisma/client/runtime/library';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.PaymentCreateInput): Promise<Payment> {
    return this.prisma.payment.create({ data });
  }

  async findById(id: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({ where: { id } });
  }

  async updateStatus(
    id: string,
    newStatus: PaymentStatus,
    extra?: Partial<Prisma.PaymentUpdateInput>,
  ): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id },
      data: { status: newStatus, ...extra },
    });
  }

  /**
   * Find payments past their expiry that are still in an open state.
   * Called by the expiry cron every minute.
   */
  async findExpired(): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: {
        status: { in: [PaymentStatus.CREATED, PaymentStatus.PENDING, PaymentStatus.UNDERPAID] },
        expiresAt: { lt: new Date() },
      },
    });
  }

  /**
   * Find payments actively being tracked (PENDING or CONFIRMING).
   */
  async findActive(): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: {
        status: { in: [PaymentStatus.PENDING, PaymentStatus.CONFIRMING] },
      },
    });
  }

  async recordEvent(
    paymentId: string,
    eventType: string,
    fromStatus: PaymentStatus | null,
    toStatus: PaymentStatus | null,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.paymentEvent.create({
      data: {
        paymentId,
        eventType,
        fromStatus: fromStatus ?? undefined,
        toStatus: toStatus ?? undefined,
        payload: payload as unknown as InputJsonValue,
      },
    });
  }
}
