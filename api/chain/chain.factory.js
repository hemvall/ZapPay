const { ethereumAdapter } = require('./Adapters/ethereum.adapter');
const { baseAdapter } = require('./Adapters/base.adapter');

const adapters = {
  ethereum: ethereumAdapter,
  base: baseAdapter,
};

function getChainAdapter(network) {
  const adapter = adapters[network.toLowerCase()];
  if (!adapter) throw new Error(`Unsupported network: ${network}`);
  return adapter;
}

module.exports = { getChainAdapter };
