import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { MerchantService } from '../merchant.service';
import type { Request } from 'express';
import type { Merchant } from '@prisma/client';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly merchantService: MerchantService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const rawKey = request.headers['x-api-key'];

    if (!rawKey || typeof rawKey !== 'string') {
      throw new UnauthorizedException('Missing X-Api-Key header');
    }

    const hmacSecret = this.config.getOrThrow<string>('API_KEY_HMAC_SECRET');
    const keyHash = createHmac('sha256', hmacSecret).update(rawKey).digest('hex');

    const merchant = await this.merchantService.findByKeyHash(keyHash);
    if (!merchant || !merchant.isActive) {
      throw new UnauthorizedException('Invalid or inactive API key');
    }

    (request as Request & { merchant: Merchant }).merchant = merchant;
    return true;
  }
}
