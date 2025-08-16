import { sendRonSimple } from "./ronin-send";

export function initOverlayRaffle (): void {
  const overlay = document.getElementById("overlay-raffle");
  const raffleAmount: HTMLInputElement| null = document.getElementById("raffle-amount") as HTMLInputElement | null;

  if (overlay && raffleAmount) {
    const joinBtn = overlay.querySelector(".button") as HTMLElement | null;
    const overlayBody = overlay.querySelector(".overlay-body")!;

    overlay.addEventListener("click", (e) => {
      e.stopPropagation();
      overlay.classList.remove("show");
    });

    overlayBody?.addEventListener("click", (e) => {
      e.stopPropagation(); // prevents the overlay click handler from firing
    });

    joinBtn?.addEventListener("click", async (e) => {
      e.stopPropagation();

      try {
        const amount = raffleAmount.value;
        const result = await sendRonSimple("0xdBf31761A886CA3d8B207b787FD925A95dB997b5", amount);
        const csrfToken = document.querySelector("meta[name=csrf-token]")?.getAttribute("content");

        if (result) {
          const { txHash } = result;
          const { nonce } = await fetch("/raffle/nonce", { credentials: "include" }).then(r => r.json());

          const joinRafflePost = async function () {
            const response = await fetch("/join-raffle", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                txHash, csrfToken, amount, nonce,
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
              } else {
                overlay.querySelector(".start-raffle")?.classList.add("hide");
                overlay.querySelector(".thank-you-raffle")?.classList.add("show");
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
