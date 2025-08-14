// ronin-send.ts
interface RoninWindow extends Window {
  // eslint-disable-next-line
  ronin?: { provider?: any };
  ethereum?: unknown;
}
declare const window: RoninWindow;

export async function sendRonSimple(toRoninAddress: string, amountRon: string): Promise<{ txParams: object; txHash: string } | null> {
  const provider = window.ronin?.provider || window.ethereum;

  if (!provider) {
    alert("Ronin Wallet or compatible Ethereum wallet not found.");
    return null;
  }

  try {
    const accounts: string[] = await provider.request({ method: "eth_accounts" });
    const fromAddress = accounts[0];

    if (!fromAddress) {
      alert("Please connect your wallet first");
      return null;
    }

    // Convert Ronin address (ronin:...) to Ethereum hex address (0x...)
    const to = toRoninAddress.startsWith("ronin:")
      ? "0x" + toRoninAddress.slice(6)
      : toRoninAddress;

    // Convert amount from RON to hex Wei string
    const amountNum = Number(amountRon);

    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Invalid amount");
      
      return null;
    }

    // Multiply by 1e18 and convert to hex
    const amountWei = BigInt(Math.floor(amountNum * 1e18)).toString(16);
    const valueHex = "0x" + amountWei;

    const txParams = {
      from: fromAddress,
      to,
      value: valueHex,
      gas: "0x5208", // 21000 gas limit
    };

    const txHash: string = await provider.request({
      method: "eth_sendTransaction",
      params: [txParams],
    });

    console.log("Transaction sent. Hash:", txHash);
    return { txParams, txHash };

    // todo fetch to backend to verify ( https://chatgpt.com/c/688deeaf-0d24-800b-8291-789ac7cb15a3)
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Send transaction failed", error);
      alert("Transaction failed: " + (error?.message || error));
    }
  }

  return null;
}
