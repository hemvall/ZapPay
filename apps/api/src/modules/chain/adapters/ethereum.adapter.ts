import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPublicClient, http, parseUnits, type PublicClient, type Chain } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { BaseChainAdapter } from './base.adapter';
import type {
  CreatePaymentIntentInput,
  CreatePaymentIntentResult,
  WatchTransactionInput,
  VerifyConfirmationResult,
} from '../interfaces/chain-adapter.interface';
import type { ChainConfig, FeeEstimate, TokenSymbol } from '@zappay/shared';

const ERC20_BALANCE_OF_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const TOKEN_ADDRESSES: Record<number, Partial<Record<string, `0x${string}`>>> = {
  1: {
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  },
  11155111: {
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    USDT: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
  },
};

@Injectable()
export class EthereumAdapter extends BaseChainAdapter {
  readonly chainId: number;
  private readonly client: PublicClient;
  private readonly viemChain: Chain;
  private readonly confirmationsRequired: number;
  private readonly staticPaymentAddress: `0x${string}`;

  constructor(chainId: number, rpcUrl: string, config: ConfigService) {
    super(`EthereumAdapter[chainId=${chainId}]`);
    this.chainId = chainId;
    this.viemChain = chainId === 1 ? mainnet : sepolia;
    this.confirmationsRequired = config.get<number>('ETHEREUM_CONFIRMATIONS_REQUIRED', 12);
    this.staticPaymentAddress = config.getOrThrow<string>(
      'ETHEREUM_PAYMENT_ADDRESS',
    ) as `0x${string}`;

    this.client = createPublicClient({
      chain: this.viemChain,
      transport: http(rpcUrl, { batch: true, retryCount: 3 }),
    });
  }

  getConfig(): ChainConfig {
    return {
      chainId: this.chainId,
      name: this.chainId === 1 ? 'Ethereum Mainnet' : 'Ethereum Sepolia',
      nativeCurrency: 'ETH',
      explorerUrl:
        this.chainId === 1 ? 'https://etherscan.io' : 'https://sepolia.etherscan.io',
      confirmationsRequired: this.confirmationsRequired,
      isEnabled: true,
      tokens: [
        { symbol: 'ETH', address: null, decimals: 18 },
        {
          symbol: 'USDC',
          address: TOKEN_ADDRESSES[this.chainId]?.['USDC'] ?? null,
          decimals: 6,
        },
        {
          symbol: 'USDT',
          address: TOKEN_ADDRESSES[this.chainId]?.['USDT'] ?? null,
          decimals: 6,
        },
      ],
    };
  }

  async createPaymentIntent(
    input: CreatePaymentIntentInput,
  ): Promise<CreatePaymentIntentResult> {
    // Sprint 1: static address per chain.
    // Phase 2: derive unique child address per payment via HD wallet.
    this.logger.log(`Returning static payment address for paymentId=${input.paymentId}`);
    return { paymentAddress: this.staticPaymentAddress };
  }

  async estimateFees(
    currency: TokenSymbol,
    _amountRequested: string,
  ): Promise<FeeEstimate | null> {
    try {
      const gasPrice = await this.client.getGasPrice();
      const gasPriceGwei = (Number(gasPrice) / 1e9).toFixed(2);
      const estimatedGasUnits = currency === 'ETH' ? 21000n : 65000n;
      const totalFeeWei = gasPrice * estimatedGasUnits;
      const totalFeeEth = (Number(totalFeeWei) / 1e18).toFixed(8);

      return {
        gasPriceGwei,
        estimatedGasUnits,
        totalFeeNative: totalFeeEth,
        totalFeeUsd: null,
        confidence: 'medium',
        estimatedAt: new Date(),
      };
    } catch (err) {
      this.logger.warn({ err }, 'Fee estimation failed');
      return null;
    }
  }

  async watchTransaction(input: WatchTransactionInput): Promise<VerifyConfirmationResult> {
    try {
      const receipt = await this.client.getTransactionReceipt({
        hash: input.txHash as `0x${string}`,
      });

      if (!receipt) {
        return { isConfirmed: false, confirmations: 0, receipt: null };
      }

      const latestBlock = await this.client.getBlockNumber();
      const confirmations = Number(latestBlock - receipt.blockNumber) + 1;
      const isConfirmed = confirmations >= this.confirmationsRequired;

      return {
        isConfirmed,
        confirmations,
        receipt: {
          txHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          blockHash: receipt.blockHash,
          confirmations,
          status: receipt.status === 'success' ? 'success' : 'reverted',
          from: receipt.from,
          to: receipt.to ?? '',
          value: 0n,
          gasUsed: receipt.gasUsed,
        },
      };
    } catch (err) {
      this.logger.warn({ err, txHash: input.txHash }, 'watchTransaction failed');
      return { isConfirmed: false, confirmations: 0, receipt: null };
    }
  }

  async verifyConfirmation(
    paymentAddress: string,
    amountRequested: string,
    currency: TokenSymbol,
  ): Promise<VerifyConfirmationResult> {
    try {
      if (currency === 'ETH') {
        const balance = await this.client.getBalance({
          address: paymentAddress as `0x${string}`,
        });
        const required = parseUnits(amountRequested, 18);
        if (balance >= required) {
          return {
            isConfirmed: true,
            confirmations: this.confirmationsRequired,
            receipt: null,
          };
        }
      } else {
        const tokenAddress = TOKEN_ADDRESSES[this.chainId]?.[currency];
        if (!tokenAddress) {
          throw new Error(
            `No token address for ${currency} on chain ${this.chainId}`,
          );
        }

        const decimals = 6; // USDC + USDT both use 6 decimals
        const balance = await this.client.readContract({
          address: tokenAddress,
          abi: ERC20_BALANCE_OF_ABI,
          functionName: 'balanceOf',
          args: [paymentAddress as `0x${string}`],
        });
        const required = parseUnits(amountRequested, decimals);
        if (balance >= required) {
          return {
            isConfirmed: true,
            confirmations: this.confirmationsRequired,
            receipt: null,
          };
        }
      }

      return { isConfirmed: false, confirmations: 0, receipt: null };
    } catch (err) {
      this.logger.warn({ err, paymentAddress }, 'verifyConfirmation failed');
      return { isConfirmed: false, confirmations: 0, receipt: null };
    }
  }
}
