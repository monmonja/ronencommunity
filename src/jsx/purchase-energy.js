import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import {WagmiProvider, createConfig, http, useAccount, useSendTransaction} from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {AbstractWalletProvider, useLoginWithAbstract} from "@abstract-foundation/agw-react";
import { abstract } from "viem/chains";
import { parseEther } from "viem";

const queryClient = new QueryClient();

const config = createConfig({
  chains: [abstract],
  transports: {
    [abstract.id]: http(),
  },
});

const PurchaseEnergy = () => {
  const config = JSON.parse(document.getElementById('energy-config').value);
  const { login, logout } = useLoginWithAbstract();
  const { address, status } = useAccount();
  const { sendTransaction, isPending } = useSendTransaction();


  return <>
    <h2>Purchase Energy</h2>
    <p>Buy {config.energy} for {config.eth}ETH </p>

    {!address && (
      <button
        onClick={() => login()}
      >
        {status === 'disconnected' ? 'Connect to wallet first': status}
      </button>
    )}
    {address && (
      <button
        onClick={() =>
          sendTransaction({
            to: "0x8D1F5F48955aA23D3A376E7e26eD60F8745a3220",
            value: parseEther("0.0001"),
          })
        }
        disabled={isPending || status !== "connected"}
      >
        {isPending ? "Sending..." : "Send Transaction"}
      </button>
    )}
  </>;
}


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
