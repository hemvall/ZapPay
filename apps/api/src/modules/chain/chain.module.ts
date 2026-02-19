import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChainService, CHAIN_ADAPTERS } from './chain.service';
import { EthereumAdapter } from './adapters/ethereum.adapter';
import { SUPPORTED_CHAINS } from '@zappay/shared';

@Module({
  providers: [
    {
      provide: CHAIN_ADAPTERS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const adapters = new Map<number, EthereumAdapter>();

        // Ethereum Mainnet — only if RPC URL is configured
        const ethRpc = config.get<string>('ETHEREUM_RPC_URL');
        if (ethRpc) {
          adapters.set(
            SUPPORTED_CHAINS.ETHEREUM_MAINNET,
            new EthereumAdapter(SUPPORTED_CHAINS.ETHEREUM_MAINNET, ethRpc, config),
          );
        }

        // Ethereum Sepolia (testnet) — only if RPC URL is configured
        const sepoliaRpc = config.get<string>('ETHEREUM_SEPOLIA_RPC_URL');
        if (sepoliaRpc) {
          adapters.set(
            SUPPORTED_CHAINS.ETHEREUM_SEPOLIA,
            new EthereumAdapter(SUPPORTED_CHAINS.ETHEREUM_SEPOLIA, sepoliaRpc, config),
          );
        }

        // To add a new chain (e.g. Polygon):
        // 1. Create PolygonAdapter extends BaseChainAdapter
        // 2. Add POLYGON_MAINNET to SUPPORTED_CHAINS in @zappay/shared
        // 3. Instantiate here and set in the map
        // That's it — zero other files need to change.

        return adapters;
      },
    },
    ChainService,
  ],
  exports: [ChainService],
})
export class ChainModule {}
