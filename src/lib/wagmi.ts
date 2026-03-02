import { http, createConfig } from 'wagmi';
import { mainnet, base } from 'wagmi/chains';
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors';

const connectors = [
  injected(),
  coinbaseWallet({ appName: 'ZapPay' }),
  ...(import.meta.env.VITE_WALLETCONNECT_PROJECT_ID
    ? [walletConnect({ projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID })]
    : []),
];

export const config = createConfig({
  chains: [mainnet, base],
  connectors,
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
