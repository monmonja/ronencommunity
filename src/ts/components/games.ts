import { sendRonSimple } from "./ronin-send";

function hasRaffleEntry(): boolean {
  const cookies = document.cookie.split(";"); // split all cookies

  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");

    if (name === "has-raffle-entry" && value === "true") {
      return true;
    }
  }
  return false;
}

export default function (): void {
  const overlay = document.getElementById("overlay-raffle");
  const buttons: Element[] = Array.from(document.querySelectorAll(".game-card .button"));
  const joinButton = document.getElementById("join-raffle-button");
  const raffleAmount: HTMLInputElement| null = document.getElementById("raffle-amount") as HTMLInputElement | null;

  if (overlay && raffleAmount) {
    const joinBtn = overlay.querySelector(".button") as HTMLElement | null;

    overlay.addEventListener("click", (e) => {
      e.stopPropagation();
      overlay.classList.remove("show");
    });

    if (joinButton) {
      joinButton.addEventListener("click", (e) => {
        e.stopPropagation();
        overlay.classList.toggle("show");
      });
    }

    buttons.forEach((button: Element) => {
      button.addEventListener("click", () => {
        if (hasRaffleEntry()) {
          location.href = `/game/${button.getAttribute("data-slug")}`;
        } else {
          overlay.classList.toggle("show");
          overlay.setAttribute("data-slug", button.getAttribute("data-slug") ?? "");
        }
      });
    });

    joinBtn?.addEventListener("click", async (e) => {
      e.stopPropagation();

      try {
        const amount = raffleAmount.value;
        const result = await sendRonSimple("0xdBf31761A886CA3d8B207b787FD925A95dB997b5", "0.1");
        const csrfToken = document.querySelector("meta[name=csrf-token]")?.getAttribute("content");

        if (result) {
          const { txParams, txHash } = result;

          const joinRafflePost = async function (verifyOnly:boolean = false) {
            const response = await fetch("/join-raffle", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                txParams, txHash, csrfToken, verifyOnly, amount,
              })
            });

            if (!response.ok) {
              throw new Error(`Verify failed: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.status === "pending") {
              setTimeout(joinRafflePost, 1000);
            } else if (result.status === "success") {
              if (overlay.getAttribute("data-slug")) {
                location.href = `/game/${overlay.getAttribute("data-slug")}`;
              }
            } else if (result.status === "failed") {
              alert(result.message);
            }
          };

          if (joinBtn) {
            joinBtn.innerHTML = "Verifying Transaction...";
          }

          await joinRafflePost();
        }
      } catch (err) {
        console.error("Error sending or verifying tx:", err);
      }
    });
  }
}
