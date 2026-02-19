import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Merchant } from '@prisma/client';

@Injectable()
export class MerchantService {
  constructor(private readonly prisma: PrismaService) {}

  async findByKeyHash(keyHash: string): Promise<Merchant | null> {
    return this.prisma.merchant.findUnique({ where: { apiKeyHash: keyHash } });
  }

  async findById(id: string): Promise<Merchant | null> {
    return this.prisma.merchant.findUnique({ where: { id } });
  }
}
