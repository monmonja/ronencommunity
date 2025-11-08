import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import {WagmiProvider, createConfig, http, useAccount} from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AbstractWalletProvider, useLoginWithAbstract, useGlobalWalletSignerClient } from "@abstract-foundation/agw-react";
import { abstract } from "viem/chains";
import {getCookie} from "../ts/components/cookies.js";
import {loginWithEvmWallet} from "../ts/components/evm-login.js";

const queryClient = new QueryClient();

const config = createConfig({
  chains: [abstract],
  transports: {
    [abstract.id]: http(),
  },
});

const WalletButton = () => {
  const { login, logout } = useLoginWithAbstract();
  const { status, address } = useAccount();
  const { data: signerClient } = useGlobalWalletSignerClient();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginStatus, setLoginStatus] = useState('normal');

  // Check session on load
  useEffect(() => {
    fetch("/auth/status", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setIsLoggedIn(data.loggedIn === true);
      })
      .catch(() => setIsLoggedIn(false));
  }, []);

  window.onerror = function (msg, src, line, col, err) {
    if (
      err?.name === "ProviderRpcError" &&
      err?.message?.includes("Failed to initialize request")
    ) {
      console.warn("Suppressed provider init error:", err);
      return true; // prevents default logging
    }
    return false;
  };

  useEffect(() => {
    const handler = (event) => {
      const err = event.reason;
      if (!err) return;

      if (err.name === "ProviderRpcError" && err.message.includes("Failed to initialize request")) {
        event.preventDefault();
        console.error("Abstract provider failed to initialize:", err);
        setLoginStatus("error");
      }

      if (err.name === "UserRejectedRequestError") {
        event.preventDefault();
        setLoginStatus("cancelled");
        location.reload();
      }
    };

    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);


  // Send wallet address to backend whenever it changes
  useEffect(() => {
    if (!address || status !== "connected") return;

    const sendAddress = async () => {
      const nonceResponse = await fetch(`/auth/nonce/${address}`, { credentials: "include" });
      const { nonce } = await nonceResponse.json();

      const timestamp = Math.floor(Date.now() / 1000);
      const message = `Login to Ronin Community\nWallet: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;

      const signature = await signerClient.signMessage({ account: address, message });

      try {
        const res = await fetch("/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": getCookie("XSRF-TOKEN"), // keep your CSRF setup
          },
          body: JSON.stringify({ address, signature, message, network: "abstract" }),
        });
        const result = await res.json();

        if (result.success) {
          const redirectUrl = new URL(window.location.href).searchParams.get('redirect');
          window.location = redirectUrl ? decodeURIComponent(redirectUrl) : '/';
        } else {
          // eslint-disable-next-line
          console.log("Login failed: " + result.error);
        }
      } catch (err) {
        console.error("Failed to send address:", err);
      }
    };

    if (signerClient !== undefined) {
      sendAddress();
    }
  }, [address, status, signerClient]); // Only runs when address or status changes

  const abstractLogin = async () => {
    try {
      setLoginStatus("logging");
      // setError(null);

      // Add a small delay to ensure provider is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      await login();
    } catch (err) {
      console.error("Login error:", err);
      // setError("Failed to connect wallet. Please try again.");
      setLoginStatus("error");
    }
  };


  if (!isLoggedIn) {
    return <>
      <table className="rounded-table">
        <tr><th><h2>Abstract Login</h2></th></tr>
        <tr>
          <td>
            <p>Because the Abstract Wallet is built with React, it requires a bit more bandwidth.
              <br />To keep performance smooth and stay within our server limits,
              <br />the abstract login runs on its own dedicated page.</p>
            <br />
            {(loginStatus === 'logging') ? <>
              Loading...
            </>: <>
              <div className="abstract-button login-btn" onClick={abstractLogin}>Abstract Network</div>
            </>}

          </td>
        </tr>


      </table>
    </>;
  }

  return (
    <div>
      <span>Connected: {address}</span>
      <button onClick={() => { logout(); setIsLoggedIn(false); }}>Disconnect</button>
    </div>
  );
};


const App = () => {
  return (
    <div>
      <WalletButton />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("abstract-login"));
root.render(
  <QueryClientProvider client={queryClient}>
    <WagmiProvider config={config}>
      <AbstractWalletProvider chain={abstract} appName="Ronen Community">
        <App />
      </AbstractWalletProvider>
    </WagmiProvider>
  </QueryClientProvider>
);
