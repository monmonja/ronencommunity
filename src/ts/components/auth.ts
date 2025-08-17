import {initOverlayDisconnect, logout} from "./overlay-disconnect";
import { initOverlayLogin } from "./overlay-login";
import {loginWithRoninWallet} from "./ronin-login";

interface RoninWindow extends Window {
  // eslint-disable-next-line
  ronin?: { provider?: any };
  ethereum?: unknown;
}
declare const window: RoninWindow;

function listenToWalletChange() {
  const provider = window.ronin?.provider || window.ethereum;

  provider.on("accountsChanged", async (accounts: string[]) => {
    if (accounts.length > 0) {
      await loginWithRoninWallet();
    }
  });
}

export function initAuth() {
  initOverlayDisconnect();
  initOverlayLogin();
  listenToWalletChange();

  const disconnectOverlayEl = document.getElementById("overlay-disconnect");
  const loginOverlayEl = document.getElementById("overlay-login");

  document.getElementById("disconnect-wallet")?.addEventListener("click", () => {
    if (disconnectOverlayEl) {
      disconnectOverlayEl.classList.toggle("show");
    }
  });

  document.getElementById("connect-wallet")?.addEventListener("click", () => {
    if (loginOverlayEl) {
      loginOverlayEl.classList.toggle("show");
    }
  });
}
