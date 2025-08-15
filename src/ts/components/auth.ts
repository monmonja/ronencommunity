import { initOverlayDisconnect } from "./overlay-disconnect";
import { loginWithRoninWallet } from "./ronin-login";

export function initAuth() {
  initOverlayDisconnect();

  const disconnectOverlayEl = document.getElementById("overlay-disconnect");

  document.getElementById("disconnect-wallet")?.addEventListener("click", () => {
    if (disconnectOverlayEl) {
      disconnectOverlayEl.classList.toggle("show");
    }
  });

  document.getElementById("connect-wallet")?.addEventListener("click", () => {
      loginWithRoninWallet();
  });
}
