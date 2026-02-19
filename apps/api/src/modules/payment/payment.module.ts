import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';
import { PaymentSseService } from './payment-sse.service';
import { MerchantModule } from '../merchant/merchant.module';
import { ChainModule } from '../chain/chain.module';
import {
  QUEUE_PAYMENT_CREATED,
  QUEUE_TX_DETECTED,
  QUEUE_TX_CONFIRMED,
  QUEUE_WEBHOOK_SEND,
} from './payment.constants';

@Module({
  imports: [
    MerchantModule,
    ChainModule,
    BullModule.registerQueue(
      { name: QUEUE_PAYMENT_CREATED },
      { name: QUEUE_TX_DETECTED },
      { name: QUEUE_TX_CONFIRMED },
      { name: QUEUE_WEBHOOK_SEND },
    ),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository, PaymentSseService],
  exports: [PaymentService, PaymentRepository],
})
export class PaymentModule {}
