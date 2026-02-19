import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IChainAdapter } from './interfaces/chain-adapter.interface';
import type { ChainConfig } from '@zappay/shared';

export const CHAIN_ADAPTERS = 'CHAIN_ADAPTERS';

@Injectable()
export class ChainService {
  constructor(
    @Inject(CHAIN_ADAPTERS)
    private readonly adapters: Map<number, IChainAdapter>,
  ) {}

  /**
   * Get adapter for a chain. Throws if not registered.
   * Use isChainSupported() to check before calling if needed.
   */
  getAdapter(chainId: number): IChainAdapter {
    const adapter = this.adapters.get(chainId);
    if (!adapter) {
      throw new NotFoundException(
        `Chain ${chainId} is not supported or not configured. ` +
          `Supported chains: ${[...this.adapters.keys()].join(', ')}`,
      );
    }
    return adapter;
  }

  getAllConfigs(): ChainConfig[] {
    return [...this.adapters.values()].map((a) => a.getConfig());
  }

  isChainSupported(chainId: number): boolean {
    return this.adapters.has(chainId);
  }
}
