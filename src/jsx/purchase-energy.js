import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import {WagmiProvider, createConfig, http, useAccount, useSendTransaction, useWaitForTransactionReceipt} from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {AbstractWalletProvider, useLoginWithAbstract} from "@abstract-foundation/agw-react";
import { abstract } from "viem/chains";
import { parseEther } from "viem";
import  "../ts/components/energy.js";
import {waitForTransactionReceipt} from "viem/actions";

const queryClient = new QueryClient();

const config = createConfig({
  chains: [abstract],
  transports: {
    [abstract.id]: http(),
  },
});

const PurchaseEnergy = () => {
  const config = JSON.parse(document.getElementById("energy-config").value);
  const { login } = useLoginWithAbstract();
  const { address, status } = useAccount();

  const { data: txHash, sendTransaction, isPending } = useSendTransaction();
  const { data: receipt, isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isSuccess && receipt) {
      // Call your verification logic once the transaction is confirmed
      console.log("✅ Transaction confirmed:", receipt.transactionHash);
      window.verifyEnergyTx(receipt.transactionHash, 'abstract')
        .then(() => {
          alert('Thank you for purchasing energy! You will be redirected back.');
          history.go(-1);
        })
        .catch((err) => console.error("Verification failed:", err));
    }
  }, [isSuccess, receipt]);

  const handleSend = async () => {
    try {
      await sendTransaction({
        to: "0x8D1F5F48955aA23D3A376E7e26eD60F8745a3220",
        value: parseEther(config.eth),
      });
      console.log("Waiting for wallet confirmation...");
    } catch (err) {
      console.error("Transaction failed:", err);
    }
  };

  return (
    <>
      <table className="rounded-table">
        <tbody>
        <tr><th><h2>Purchase Energy</h2></th></tr>
        <tr>
          <td>
            Buy {config.energy} for {config.eth} ETH
            <br />
            <br />


            {!address && (
              <button className="abstract-button login-btn" onClick={() => login()}>
                {status === "disconnected" ? "Connect to wallet first" : status}
              </button>
            )}

            {address && (
              <button className="abstract-button login-btn" onClick={handleSend} disabled={isPending || status !== "connected"}>
                {isPending
                  ? "Awaiting wallet..."
                  : isWaiting
                    ? "Waiting for confirmation..."
                    : "Send Transaction"}
              </button>
            )}
          </td>
        </tr>
        </tbody>
      </table>
      <h2></h2>

    </>
  );
};

export default PurchaseEnergy;


const App = () => {
  return (
    <div>
      <PurchaseEnergy />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("purchase-energy"));
root.render(
  <QueryClientProvider client={queryClient}>
    <WagmiProvider config={config}>
      <AbstractWalletProvider chain={abstract} appName="Ronen Community">
        <App />
      </AbstractWalletProvider>
    </WagmiProvider>
  </QueryClientProvider>
);
