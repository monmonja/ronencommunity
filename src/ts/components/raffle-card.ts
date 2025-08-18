import {getCookie} from "./cookies";

export function initRaffleCard (): void {
  const overlay = document.getElementById("overlay-raffle");
  const joinButton = document.getElementById("join-raffle-button");

  if (overlay && joinButton) {
    joinButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (getCookie("has-user")) {
        overlay.classList.toggle("show");
      } else {
        document.getElementById("connect-wallet")?.click();
      }
    });
  }
}
