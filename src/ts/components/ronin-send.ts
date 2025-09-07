// ronin-send.ts
interface RoninWindow extends Window {
  // eslint-disable-next-line
  ronin?: { provider?: any };
  ethereum?: unknown;
}
declare const window: RoninWindow;

export async function sendToken(
  tokenSymbol: "RON" | "RONEN",
  toRoninAddress: string,
  amount: string
): Promise<{ txParams: object; txHash: string } | null> {
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

    // Convert Ronin address to Ethereum format
    const to = toRoninAddress.startsWith("ronin:")
      ? "0x" + toRoninAddress.slice(6)
      : toRoninAddress;

    const amountNum = Number(amount);

    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Invalid amount");
      return null;
    }

    if (tokenSymbol === "RON") {
      // Native RON transfer
      const amountWei = BigInt(Math.floor(amountNum * 1e18)).toString(16);
      const valueHex = "0x" + amountWei;

      const txParams = {
        from: fromAddress,
        to,
        value: valueHex,
        gas: "0x5208" // 21000
      };

      const txHash: string = await provider.request({
        method: "eth_sendTransaction",
        params: [txParams]
      });

      return { txParams, txHash };
    } else if (tokenSymbol === "RONEN") {
      // ERC-20 transfer
      const tokenAddress = "{{config.web3.ronenContract}}"; // replace with actual $RONEN address

      const decimalsHex = await provider.request({
        method: "eth_call",
        params: [
          {
            to: tokenAddress,
            data: "0x313ce567" // keccak256("decimals()") first 4 bytes
          },
          "latest"
        ]
      });
      const decimals = parseInt(decimalsHex, 16);

      function encodeTransfer(to: string, amountWei: bigint) {
        const functionSelector = "0xa9059cbb";
        const toPadded = to.toLowerCase().replace(/^0x/, "").padStart(64, "0");
        const amountPadded = amountWei.toString(16).padStart(64, "0");

        return functionSelector + toPadded + amountPadded;
      }

      // Encode transfer(address,uint256)
      const amountWei = BigInt(Math.floor(amountNum * Math.pow(10, decimals)));
      const data = encodeTransfer(to, amountWei);

      // Estimate the gas required
      const gasEstimateHex = await provider.request({
        method: "eth_estimateGas",
        params: [{
          from: fromAddress,
          to: tokenAddress,
          data: data,
        }]
      });

      const gasPriceHex = await provider.request({
        method: "eth_gasPrice",
        params: []
      });

      const txParams = {
        from: fromAddress,
        to: tokenAddress,
        data,
        gas: gasEstimateHex, // Use the estimated gas
        gasPrice: gasPriceHex, // Add the current gas price
      };

      const txHash: string = await provider.request({
        method: "eth_sendTransaction",
        params: [txParams]
      });

      return { txParams, txHash };
    } else {
      alert("Unsupported token");
      return null;
    }
  } catch (error: unknown) {
    alert("Transaction failed: " + (error instanceof Error ? error.message : error));
    return null;
  }
}
