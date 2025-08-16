import {loginWithRoninWallet} from "./ronin-login";

export function initOverlayLogin(): void {
  const overlay = document.getElementById("overlay-login");

  if (overlay) {
    const overlayBody = overlay.querySelector(".overlay-body")!;

    overlay.addEventListener("click", (e) => {
      e.stopPropagation();
      overlay.classList.remove("show");
    });

    overlay.querySelector(".button")?.addEventListener("click", async () => {
      await loginWithRoninWallet();
    });

    overlayBody?.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }
}
