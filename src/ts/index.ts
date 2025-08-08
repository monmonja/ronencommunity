import { loginWithRoninWallet } from "./ronin-login";
import wikiMenu from "./wiki-menu";
// import { sendRonSimple } from "./ronin-send";

document.addEventListener("DOMContentLoaded", () => {
  wikiMenu();
  document.getElementById("connect-wallet")?.addEventListener("click", async () => {
    await loginWithRoninWallet();
    // sendRonSimple("0xdBf31761A886CA3d8B207b787FD925A95dB997b5", "0.1");
  });
  document.getElementById("disconnect-wallet")?.addEventListener("click", async () => {
    const csrfToken = document.querySelector("meta[name=csrf-token]")?.getAttribute("content");
    const res = await fetch("/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csrfToken }),
    });

    const result = await res.json();

    if (result.success) {
      window.location.href = "/";
    } else {
      alert("Logout failed: " + result.error);
    }
  });
});
