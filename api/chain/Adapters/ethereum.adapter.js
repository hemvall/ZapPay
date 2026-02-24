const { createPublicClient, http, erc20Abi } = require('viem');
const { mainnet } = require('viem/chains');

const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.ETHEREUM_RPC_URL),
});

const ethereumAdapter = {
  name: 'ethereum',

  async waitForTransaction(txHash) {
    const receipt = await client.waitForTransactionReceipt({
      hash: txHash,
      confirmations: Number(process.env.CONFIRMATION_COUNT_ETHEREUM || 2),
      timeout: 120_000,
    });
    return {
      txHash: receipt.transactionHash,
      status: receipt.status,
      blockNumber: receipt.blockNumber,
      from: receipt.from,
      to: receipt.to,
      gasUsed: receipt.gasUsed,
    };
  },

  async getBlockNumber() {
    return client.getBlockNumber();
  },

  async getBalance(address, tokenAddress) {
    if (!tokenAddress) {
      return client.getBalance({ address });
    }
    return client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address],
    });
  },

  async estimateGasCost() {
    const gasPrice = await client.getGasPrice();
    return gasPrice * 21000n;
  },
};

module.exports = { ethereumAdapter };
