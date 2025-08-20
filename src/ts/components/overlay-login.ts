import {loginWithRoninWallet} from "./ronin-login";

export function initOverlayLogin(): void {
  const overlay = document.getElementById("overlay-login");

  if (overlay) {
    const overlayBody = overlay.querySelector(".overlay-body")!;
    const loginBtn = overlay.querySelector(".button");

    overlay.addEventListener("click", (e) => {
      e.stopPropagation();
      overlay.classList.remove("show");
    });

    if (loginBtn) {
      loginBtn.addEventListener("click", async () => {
        loginBtn.classList.add("add-pulse");
        loginBtn.innerHTML = "Logging in...";
        await loginWithRoninWallet();
      });
    }

    overlayBody?.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }
}
