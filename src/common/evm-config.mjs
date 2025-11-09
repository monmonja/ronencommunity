const evmConfig = {
  mainnet: {
    ronin: {
      chainName: "Ronin Mainnet",
      chainId: 0x07e4,                            // 2020 in hex
      rpcUrl: "https://api.roninchain.com/rpc",
      baxieContract: "0xb79f49ac669108426a69a26a6ca075a10c0cfe28",
      tokenMetadataBaseUrl: "https://metadata.ronen.network/0xb79f49ac669108426a69a26a6ca075a10c0cfe28/",
    },
    abstract: {
      chainName: "Abstract Mainnet",
      chainId: 0xab5,                            // 2741 in hex
      rpcUrl: "https://api.mainnet.abs.xyz",
      baxieContract: "0x651bb744ba77170e703f7c5c9512de53e40fb8d0",
      tokenMetadataBaseUrl: " https://metadata.ronen.network/0x651bb744ba77170e703f7c5c9512de53e40fb8d0/",
    },
  },
  testnet: {
    ronin: {
      chainName: "Ronin Mainnet",
      chainId: 0x07e4,                            // 2020 in hex
      rpcUrl: "https://api.roninchain.com/rpc",
      baxieContract: "0xb79f49ac669108426a69a26a6ca075a10c0cfe28",
      tokenMetadataBaseUrl: "https://metadata.ronen.network/0xb79f49ac669108426a69a26a6ca075a10c0cfe28/",
      // chainName: "Ronin Saigon Testnet",
      // chainId: 0x7E5,                            // 2021 in hex
      // rpcUrl: "https://saigon-testnet.roninchain.com/rpc",
      // baxieContract: "0xb79f49ac669108426a69a26a6ca075a10c0cfe28",
      // tokenMetadataBaseUrl: "https://metadata.ronen.network/0xb79f49ac669108426a69a26a6ca075a10c0cfe28/",
    },
    abstract: {
      chainName: "Abstract Mainnet",
      chainId: 0xAB5,                            // 2741 in hex
      rpcUrl: "https://api.mainnet.abs.xyz",
      baxieContract: "0x651bb744ba77170e703f7c5c9512de53e40fb8d0",
      tokenMetadataBaseUrl: " https://metadata.ronen.network/0x651bb744ba77170e703f7c5c9512de53e40fb8d0/",
      // chainName: "Abstract Testnet",
      // chainId: "0x2B74",                           // 11124 in hex
      // rpcUrl: "https://api.testnet.abs.xyz",
    },
  },
};

function getEvmConfig(network) {
  const env = '{{config.isProd}}' === 'true' ? 'mainnet' : 'testnet';

  return evmConfig[env][network];
}

export default {
  evmConfig,
  getEvmConfig
};