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

    if (parseInt(chainIdHex, 16) !== evmConfig.chainId) {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + parseInt(evmConfig.chainId, 10).toString(16) }]
      });

      return false;
    }

    return true;
  }

  return false;
}
