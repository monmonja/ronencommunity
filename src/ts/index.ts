import { loginWithRoninWallet } from "./ronin-login";
import wikiMenu from "./wiki-menu";
import overlayDisconnect from "./overlay-disconnect";
// import { sendRonSimple } from "./ronin-send";

document.addEventListener("DOMContentLoaded", () => {
  wikiMenu();
  overlayDisconnect();
  document.getElementById("connect-wallet")?.addEventListener("click", async () => {
    await loginWithRoninWallet();
    // sendRonSimple("0xdBf31761A886CA3d8B207b787FD925A95dB997b5", "0.1");
  });

});
