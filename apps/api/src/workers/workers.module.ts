import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ChainWatcherProcessor } from './chain-watcher.processor';
import { ExpiryProcessor } from './expiry.processor';
import { WebhookProcessor } from './webhook.processor';
import { PaymentModule } from '../modules/payment/payment.module';
import { ChainModule } from '../modules/chain/chain.module';
import {
  QUEUE_PAYMENT_CREATED,
  QUEUE_WEBHOOK_SEND,
} from '../modules/payment/payment.constants';

@Module({
  imports: [
    PaymentModule,
    ChainModule,
    BullModule.registerQueue(
      { name: QUEUE_PAYMENT_CREATED },
      { name: QUEUE_WEBHOOK_SEND },
    ),
  ],
  providers: [ChainWatcherProcessor, ExpiryProcessor, WebhookProcessor],
})
export class WorkersModule {}
