import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsIn,
  IsOptional,
  IsUrl,
  IsPositive,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { SUPPORTED_TOKENS, SUPPORTED_CHAINS } from '@zappay/shared';

const CHAIN_IDS = Object.values(SUPPORTED_CHAINS) as number[];

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,18})?$/, {
    message: 'amountRequested must be a positive decimal string (e.g. "100" or "0.001")',
  })
  amountRequested!: string;

  @IsIn(SUPPORTED_TOKENS, { message: `currency must be one of: ${SUPPORTED_TOKENS.join(', ')}` })
  currency!: string;

  @IsNumber()
  @IsIn(CHAIN_IDS, { message: `chainId must be one of: ${CHAIN_IDS.join(', ')}` })
  chainId!: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(300)
  @Max(86400)
  expiresInSeconds?: number;

  @IsOptional()
  @IsUrl()
  webhookUrl?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
