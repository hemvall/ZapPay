import { http, createConfig } from 'wagmi';
import { mainnet, base, sepolia } from 'wagmi/chains';
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors';

const connectors = [
  injected(),
  coinbaseWallet({ appName: 'ZapPay' }),
  ...(import.meta.env.VITE_WALLETCONNECT_PROJECT_ID
    ? [walletConnect({ projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID })]
    : []),
];

export const config = createConfig({
  chains: [mainnet, base, sepolia],
  connectors,
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [sepolia.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
