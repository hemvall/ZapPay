// ZapPayRouter Solidity contract ABI for frontend interaction
// The actual contract should be deployed separately using Hardhat/Foundry
//
// Contract: ZapPayRouter
// - pay(bytes32 paymentId, address merchant, address token, uint256 totalAmount, uint256 feeAmount)
// - token = address(0) for native ETH
// - For ERC-20: payer must approve() the router contract first

const ZAPPAY_ROUTER_ABI = [
  {
    inputs: [{ name: '_treasury', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'treasury',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'paymentId', type: 'bytes32' },
      { name: 'merchant', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'totalAmount', type: 'uint256' },
      { name: 'feeAmount', type: 'uint256' },
    ],
    name: 'pay',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'paymentId', type: 'bytes32' },
      { indexed: true, name: 'payer', type: 'address' },
      { indexed: true, name: 'merchant', type: 'address' },
      { indexed: false, name: 'token', type: 'address' },
      { indexed: false, name: 'merchantAmount', type: 'uint256' },
      { indexed: false, name: 'feeAmount', type: 'uint256' },
    ],
    name: 'PaymentRouted',
    type: 'event',
  },
];

// Contract addresses per network (to be filled after deployment)
const ROUTER_ADDRESSES = {
  ethereum: process.env.ZAPPAY_ROUTER_ADDRESS_ETHEREUM || null,
  base: process.env.ZAPPAY_ROUTER_ADDRESS_BASE || null,
};

module.exports = { ZAPPAY_ROUTER_ABI, ROUTER_ADDRESSES };
