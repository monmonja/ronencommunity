import {getCookie} from "./cookies";

export function initTournamentEntryCard (): void {
  const overlay = document.getElementById("overlay-tournament-entry");
  const joinButton = document.getElementById("join-tournament-entry-button");

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
