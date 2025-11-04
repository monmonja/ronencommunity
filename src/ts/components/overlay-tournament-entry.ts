import { sendToken } from "./ronin-send";
import {detectNetwork} from "./evm-detect-network";
import {getCookie} from "./cookies";

export function initOverlayTournamentEntry (): void {
  const overlay = document.getElementById("overlay-tournament-entry");
  const tournamentEntryAmount: HTMLInputElement| null = document.getElementById("tournament-entry-amount") as HTMLInputElement | null;
  const discordUsernameAmount: HTMLInputElement| null = document.getElementById("discord-username") as HTMLInputElement | null;

  if (overlay && tournamentEntryAmount && discordUsernameAmount) {
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
        const amount = tournamentEntryAmount.value;
        const result = await sendToken("RON","{{config.web3.tournamentAddress}}", amount);

        if (result) {
          const { txHash } = result;
          const { nonce } = await fetch("/tournament-entry/nonce", { credentials: "include" }).then(r => r.json());

          const joinTournamentEntryPost = async function () {
            const response = await fetch("/tournament-entry/join", {
              method: "POST",
              // @ts-expect-error Custom header
              headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": getCookie("XSRF-TOKEN"),
              },
              body: JSON.stringify({
                txHash, amount, nonce,
                discord: discordUsernameAmount.value,
              })
            });

            if (!response.ok) {
              throw new Error(`Verify failed: ${response.statusText}`);
            }

            const result = await response.json();
console.log(result)
            if (result.status === "pending") {
              setTimeout(joinTournamentEntryPost, 1000);
            } else if (result.status === "success") {

              overlay.querySelector(".start-block")?.classList.add("hide");
              overlay.querySelector(".thank-you-block")?.classList.add("show");
            } else if (result.status === "failed") {
              alert(result.message);
            }
          };

          if (joinBtn) {
            joinBtn.classList.add("add-pulse");
            joinBtn.innerHTML = "Verifying Transaction...";
          }

          await joinTournamentEntryPost();
        }
      } catch (err) {
        console.error("Error sending or verifying tx:", err);
      }
    });
  }
}
