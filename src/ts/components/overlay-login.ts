import {loginWithEvmWallet} from "./evm-login";
import { createStore } from 'mipd'


export function initOverlayLogin(): void {
  const overlay = document.getElementById("overlay-login");

  if (overlay) {
    const overlayBody = overlay.querySelector(".overlay-body")!;
    const roninLoginBtn = overlay.querySelector(".ronin-button");
    const abstractLoginBtn = overlay.querySelector(".abstract-button");

    overlay.addEventListener("click", (e) => {
      e.stopPropagation();
      overlay.classList.remove("show");
    });

    if (roninLoginBtn) {
      roninLoginBtn.addEventListener("click", async () => {
        roninLoginBtn.classList.add("add-pulse");
        roninLoginBtn.innerHTML = "Logging in...";
        await loginWithEvmWallet();
      });
    }

    if (abstractLoginBtn) {
      abstractLoginBtn.setAttribute('href', abstractLoginBtn.getAttribute('href') + '?redirect=' + encodeURIComponent(window.location.href));
      // abstractLoginBtn.addEventListener("click", async () => {
      //   abstractLoginBtn.classList.add("add-pulse");
      //   abstractLoginBtn.innerHTML = "Logging in...";
      //   //await loginWithEvmWallet('abstract');
      // });
    }

    overlayBody?.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }
}
