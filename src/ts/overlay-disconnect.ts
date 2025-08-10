interface RoninWindow extends Window {
  // eslint-disable-next-line
  ronin?: { provider?: any };
  ethereum?: unknown;
}
declare const window: RoninWindow;

async function logout() {
  const csrfToken = document.querySelector("meta[name=csrf-token]")?.getAttribute("content");
  const res:Response = await fetch("/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ csrfToken }),
  });

  const result:any = await res.json();

  if (result.success) {
    window.location.href = "/";
  } else {
    alert("Logout failed: " + result.error);
  }
}

export default function (): void {
  const overlay = document.getElementById("overlay-disconnect");

  if (overlay) {
    overlay.addEventListener("click", (e) => {
      e.stopPropagation();
      overlay.classList.remove('show');
    });

    document.getElementById("disconnect-wallet")?.addEventListener("click", () => {
      console.log("fds");
      overlay.classList.toggle('show');
    });

    overlay.querySelector(".button")?.addEventListener("click", async () => {
      await logout();
    });
  }
}
