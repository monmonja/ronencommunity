import { loginWithRoninWallet } from "./components/ronin-login";
import wikiMenu from "./components/wiki-menu";
import overlayDisconnect from "./components/overlay-disconnect";

document.addEventListener("DOMContentLoaded", () => {
  wikiMenu();
  overlayDisconnect();
  document.getElementById("connect-wallet")?.addEventListener("click", async () => {
    await loginWithRoninWallet();
  });
});
