import {getCookie} from "./cookies";

interface LogoutResponse {
  success: boolean;
  error: string;
}

export async function logout() {
  const res:Response = await fetch("/logout", {
    method: "POST",
    // @ts-expect-error Custom header
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": getCookie("XSRF-TOKEN"),
    },
  });

  const result:LogoutResponse = await res.json();

  if (result.success) {

    window.location.href = "/";
  } else {
    alert("Logout failed: " + result.error);
  }
}

export function initOverlayDisconnect(): void {
  const overlay = document.getElementById("overlay-disconnect");
  const walletAddress = document.querySelector(".wallet-address");
  const walletCopyBtn = document.getElementById("wallet-address-copy-btn");

  if (overlay) {
    overlay.addEventListener("click", (e) => {
      e.stopPropagation();
      overlay.classList.remove("show");
    });

    if (walletCopyBtn && walletAddress) {
      walletCopyBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        try {
          navigator.clipboard.writeText(walletAddress.getAttribute("data-wallet") ?? "");
          alert("Copied");
        } catch (err) {
          console.error("Failed to copy:", err);
        }
      });
    }

    overlay.querySelector(".button")?.addEventListener("click", async () => {
      await logout();
    });
  }
}
