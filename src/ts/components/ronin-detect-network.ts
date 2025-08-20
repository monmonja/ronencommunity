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

    if (chainId.toString() !== "{{config.web3.chainId}}") {
      alert("Change network to {{config.web3.chainName}}");

      return false;
    }

    return true;
  }

  return false;
}
