export function initRaffleCard (): void {
  const overlay = document.getElementById("overlay-raffle");
  const joinButton = document.getElementById("join-raffle-button");

  if (overlay && joinButton) {
    joinButton.addEventListener("click", (e) => {
      e.stopPropagation();
      overlay.classList.toggle("show");
    });
  }
}
