import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, fromEvent, filter, map, takeUntil, timer, merge } from 'rxjs';
import type { MessageEvent } from '@nestjs/common';
import { PAYMENT_STATUS } from '@zappay/shared';
import type { PaymentStatusUpdate } from '@zappay/shared';
import { EVENT_PAYMENT_STATUS_CHANGED } from './payment.constants';

const TERMINAL_STATUSES = [
  PAYMENT_STATUS.CONFIRMED,
  PAYMENT_STATUS.FAILED,
  PAYMENT_STATUS.EXPIRED,
] as const;

@Injectable()
export class PaymentSseService {
  constructor(private readonly emitter: EventEmitter2) {}

  /**
   * Returns an Observable of SSE MessageEvents for a given payment.
   * Completes automatically on terminal status or after 30 minutes.
   */
  getStatusStream(paymentId: string): Observable<MessageEvent> {
    const TIMEOUT_MS = 30 * 60 * 1000;

    const updates$ = fromEvent<PaymentStatusUpdate>(
      this.emitter,
      EVENT_PAYMENT_STATUS_CHANGED,
    ).pipe(filter((update) => update.paymentId === paymentId));

    const events$: Observable<MessageEvent> = updates$.pipe(
      map(
        (update): MessageEvent => ({
          data: JSON.stringify(update),
          type: 'payment.status',
          id: `${paymentId}-${Date.now()}`,
        }),
      ),
    );

    const timeout$: Observable<MessageEvent> = timer(TIMEOUT_MS).pipe(
      map(
        (): MessageEvent => ({
          data: JSON.stringify({ paymentId, type: 'stream.timeout' }),
          type: 'stream.timeout',
        }),
      ),
    );

    const terminal$ = updates$.pipe(
      filter((u) => TERMINAL_STATUSES.includes(u.status as (typeof TERMINAL_STATUSES)[number])),
    );

    return merge(events$, timeout$).pipe(takeUntil(terminal$));
  }

  emitStatusChange(update: PaymentStatusUpdate): void {
    this.emitter.emit(EVENT_PAYMENT_STATUS_CHANGED, update);
  }
}
