import { Module } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { ApiKeyGuard } from './guards/api-key.guard';

@Module({
  providers: [MerchantService, ApiKeyGuard],
  exports: [MerchantService, ApiKeyGuard],
})
export class MerchantModule {}
