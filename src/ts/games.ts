import games from "./components/games";
import overlayDisconnect from "./components/overlay-disconnect";

import { loginWithRoninWallet } from "./components/ronin-login";

document.addEventListener("DOMContentLoaded", () => {
  games();
  overlayDisconnect();
  document.getElementById("connect-wallet")?.addEventListener("click", async () => {
    await loginWithRoninWallet();
  });
});
