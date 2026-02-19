import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Sse,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { MessageEvent } from '@nestjs/common';
import { ApiKeyGuard } from '../merchant/guards/api-key.guard';
import { CurrentMerchant } from '../merchant/decorators/api-key.decorator';
import { PaymentService } from './payment.service';
import { PaymentSseService } from './payment-sse.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import type { Merchant } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Controller({ path: 'payments', version: '1' })
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly sseService: PaymentSseService,
    private readonly config: ConfigService,
  ) {}

  /**
   * POST /v1/payments
   * Requires X-Api-Key header. Creates payment + returns address + URL.
   */
  @Post()
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.CREATED)
  async createPayment(
    @Body() dto: CreatePaymentDto,
    @CurrentMerchant() merchant: Merchant,
  ): Promise<PaymentResponseDto> {
    const payment = await this.paymentService.createPayment(dto, merchant);
    const baseUrl = this.config.getOrThrow<string>('PAYMENT_LINK_BASE_URL');
    return new PaymentResponseDto(payment, baseUrl);
  }

  /**
   * GET /v1/payments/:id
   * Public — payers use this to display the payment page.
   */
  @Get(':id')
  async getPayment(@Param('id') id: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentService.findById(id);
    const baseUrl = this.config.getOrThrow<string>('PAYMENT_LINK_BASE_URL');
    return new PaymentResponseDto(payment, baseUrl);
  }

  /**
   * GET /v1/payments/:id/status/stream
   * SSE stream — broadcasts live status updates to the payer's browser.
   * No auth: payment ID is the natural access credential for the payer.
   */
  @Sse(':id/status/stream')
  streamStatus(@Param('id') id: string): Observable<MessageEvent> {
    return this.sseService.getStatusStream(id);
  }
}
