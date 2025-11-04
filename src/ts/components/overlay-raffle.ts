import { sendToken } from "./ronin-send";
import {detectNetwork} from "./evm-detect-network";
import {getCookie} from "./cookies";

export function initOverlayRaffle (): void {
  const overlay = document.getElementById("overlay-raffle");
  const raffleAmount: HTMLInputElement| null = document.getElementById("raffle-amount") as HTMLInputElement | null;

  if (overlay && raffleAmount) {
    const joinBtn = overlay.querySelector(".join-button") as HTMLElement | null;
    const reloadBtn = overlay.querySelector(".reload-button") as HTMLElement | null;
    const overlayBody = overlay.querySelector(".overlay-body")!;

    overlay.addEventListener("click", (e) => {
      e.stopPropagation();
      overlay.classList.remove("show");
    });

    overlayBody?.addEventListener("click", (e) => {
      e.stopPropagation(); // prevents the overlay click handler from firing
    });

    reloadBtn?.addEventListener("click", async (e) => {
      e.stopPropagation();

      window.location.reload();
    });

    joinBtn?.addEventListener("click", async (e) => {
      e.stopPropagation();

      if (!await detectNetwork()) {
        return;
      }

      try {
        const amount = raffleAmount.value;
        const result = await sendToken("RON","{{config.web3.raffleAddress}}", amount);

        if (result) {
          const { txHash } = result;
          const { nonce } = await fetch("/raffle/nonce", { credentials: "include" }).then(r => r.json());

          const joinRafflePost = async function () {
            const response = await fetch("/join-raffle", {
              method: "POST",
              // @ts-expect-error Custom header
              headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": getCookie("XSRF-TOKEN"),
              },
              body: JSON.stringify({
                txHash, amount, nonce,
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
                overlay.querySelector(".start-block")?.classList.add("hide");
                overlay.querySelector(".thank-you-block")?.classList.add("show");
              }
            } else if (result.status === "failed") {
              alert(result.message);
            }
          };

          if (joinBtn) {
            joinBtn.classList.add("add-pulse");
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
