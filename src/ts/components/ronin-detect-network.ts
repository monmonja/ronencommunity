// ronin-send.ts
interface RoninWindow extends Window {
  // eslint-disable-next-line
  ronin?: { provider?: any };
  ethereum?: unknown;
}
declare const window: RoninWindow;

export async function detectNetwork(): Promise<boolean> {
  const provider = window.ronin?.provider || window.ethereum;

  if (provider) {
    const chainIdHex = await provider.request({ method: "eth_chainId" });
    const chainId = parseInt(chainIdHex, 16);
    const targetChainId = "{{config.web3.chainId}}";

    if (chainId.toString() !== targetChainId) {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + parseInt(targetChainId, 10).toString(16) }]
      });

      return false;
    }

    return true;
  }

  return false;
}
