// ronin-send.ts
import {getProvider} from "./utils";
import evmModule from '../../common/evm-config.mjs';

interface RoninWindow extends Window {
  // eslint-disable-next-line
  ronin?: { provider?: any };
  ethereum?: unknown;
}
declare const window: RoninWindow;

export async function detectNetwork(network: string = 'ronin'): Promise<boolean> {
  let provider = await getProvider(network);

  if (provider) {
    const evmConfig = evmModule.getEvmConfig(network);
    const chainIdHex = await provider.request({ method: "eth_chainId" });

    if (chainIdHex.toLowerCase() !== evmConfig.chainId.toLowerCase()) {
      console.log(chainIdHex,{
        method: "wallet_switchEthereumChain",
        params: [{ chainId: evmConfig.chainId }]
      })
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: evmConfig.chainId }]
      });

      return false;
    }

    return true;
  }

  return false;
}
