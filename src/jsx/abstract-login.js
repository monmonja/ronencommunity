import React, { useState, useEffect, Component } from "react";
import ReactDOM from "react-dom/client";
import {WagmiProvider, createConfig, http, useAccount} from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AbstractWalletProvider, useLoginWithAbstract, useGlobalWalletSignerClient } from "@abstract-foundation/agw-react";
import { abstract } from "viem/chains";
import {getCookie} from "../ts/components/cookies.js";
import {loginWithEvmWallet} from "../ts/components/evm-login.js";

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    if (error?.name === "ProviderRpcError" || error?.message?.includes("Failed to initialize")) {
      alert("Failed to initialize Abstract wallet. Please refresh the page and try again.");
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red' }}>
          <h3>Wallet Connection Error</h3>
          <p>Failed to initialize the Abstract wallet provider.</p>
          <button onClick={() => window.location.reload()}>Refresh Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    console.log("window.onerror triggered:", { msg, err });
    if (
      err?.name === "ProviderRpcError" &&
      err?.message?.includes("Failed to initialize request")
    ) {
      alert("Provider initialization error detected (window.onerror)");
      console.warn("Suppressed provider init error:", err);
      setLoginStatus("error");
      return true; // prevents default logging
    }
    return false;
  };

  useEffect(() => {
    const handler = (event) => {
      console.log("unhandledrejection triggered:", event.reason);
      const err = event.reason;
      console.log("err", err);
      if (!err) return;

      console.log("err.name", err.name);
      console.log("err.message", err.message);

      if (err.name === "UserRejectedRequestError") {
        event.preventDefault();
        setLoginStatus("cancelled");
        alert("Wallet connection was cancelled. The page will reload.");
        location.reload();
      } else {
        event.preventDefault();
        setLoginStatus("error");
        alert("Abstract wallet provider failed to initialize. The page will reload.");
        location.reload();
      }
    }

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

      // Add a small delay to ensure provider is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      await login();
    } catch (err) {
      console.error("Login error:", err);
      setLoginStatus("error");

      // Show user-friendly error message
      if (err?.name === "ProviderRpcError" && err?.message?.includes("Failed to initialize request")) {
        alert("Failed to initialize Abstract wallet connection. Please refresh the page and try again.");
      } else if (err?.name === "UserRejectedRequestError") {
        alert("Wallet connection was cancelled.");
      } else {
        alert("Failed to connect wallet. Please try again.");
      }
    }
  };


  if (!isLoggedIn) {
    return <>
      <table className="rounded-table">
        <tbody>
        <tr><th><h2>Abstract Login</h2></th></tr>
        <tr>
          <td>
            <p>Because the Abstract Wallet is built with React, it requires a bit more bandwidth.
              <br />To keep performance smooth and stay within our server limits,
              <br />the abstract login runs on its own dedicated page.</p>
            <br />
            {(loginStatus === 'logging') ? <>
              Loading...
            </> : (loginStatus === 'error') ? <>
              <p style={{ color: 'red' }}>Connection failed. Please try again.</p>
              <div className="abstract-button login-btn" onClick={abstractLogin}>Retry Connection</div>
            </> : <>
              <div className="abstract-button login-btn" onClick={abstractLogin}>Abstract Network</div>
            </>}

          </td>
        </tr>
        </tbody>
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

// Global error handler for promises
const originalConsoleError = console.error;
console.error = (...args) => {
  const errorString = args.join(' ');
  if (errorString.includes('ProviderRpcError') || errorString.includes('Failed to initialize request')) {
    alert('Abstract wallet failed to load. Please refresh the page.');
  }
  originalConsoleError.apply(console, args);
};

root.render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <AbstractWalletProvider chain={abstract} appName="Ronen Community">
          <App />
        </AbstractWalletProvider>
      </WagmiProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);