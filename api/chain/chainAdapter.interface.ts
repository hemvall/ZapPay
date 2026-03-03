export interface TransactionReceipt {
  txHash: string;
  status: 'success' | 'reverted';
  blockNumber: bigint;
  from: string;
  to: string;
  gasUsed: bigint;
}

export interface ChainAdapter {
  /** Human-readable chain name */
  readonly name: string;

  /** Wait for a tx to be mined and return the receipt */
  waitForTransaction(txHash: string): Promise<TransactionReceipt>;

  /** Get current block number */
  getBlockNumber(): Promise<bigint>;

  /** Check if an address has enough balance for a given token+amount */
  getBalance(address: string, tokenAddress?: string): Promise<bigint>;

  /** Estimate gas cost in native token (wei) */
  estimateGasCost(): Promise<bigint>;
}
