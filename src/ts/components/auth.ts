import { initOverlayDisconnect } from "./overlay-disconnect";
import { initOverlayLogin } from "./overlay-login";

export function initAuth() {
  initOverlayDisconnect();
  initOverlayLogin();

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
