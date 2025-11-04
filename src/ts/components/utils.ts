// ronin-send.ts
interface RoninWindow extends Window {
  // eslint-disable-next-line
  ronin?: { provider?: any };
  ethereum?: unknown;
}
declare const window: RoninWindow;

export async function getProvider(network: string = 'ronin'): Promise<any> {
  let provider;

  if (network === 'ronin') {
    provider = window.ronin?.provider || window.ethereum;
  }

  if (network === 'abstract') {
    provider = window.ethereum;
  }

  return provider;
}
