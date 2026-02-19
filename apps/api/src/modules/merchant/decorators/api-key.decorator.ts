import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { Merchant } from '@prisma/client';

export const CurrentMerchant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Merchant => {
    const request = ctx.switchToHttp().getRequest<Request & { merchant: Merchant }>();
    return request.merchant;
  },
);
