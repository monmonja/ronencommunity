import {getCookie} from "./cookies";

interface LogoutResponse {
  success: boolean;
  error: string;
}

export async function logout() {
  const res:Response = await fetch("/logout", {
    method: "POST",
    // @ts-ignore
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": getCookie('XSRF-TOKEN'),
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

  if (overlay) {
    overlay.addEventListener("click", (e) => {
      e.stopPropagation();
      overlay.classList.remove("show");
    });

    overlay.querySelector(".button")?.addEventListener("click", async () => {
      await logout();
    });
  }
}
