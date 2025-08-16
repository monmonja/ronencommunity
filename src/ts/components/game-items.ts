import { getCookie } from "./cookies";

export function initGameItems(): void {
  const overlay = document.getElementById("overlay-raffle");
  const buttons: Element[] = Array.from(document.querySelectorAll(".game-card .button"));

  if (overlay) {
    buttons.forEach((button: Element) => {
      button.addEventListener("click", () => {
        if (getCookie("has-user")) {
          if (getCookie("has-raffle-entry") === "true") {
            location.href = `/game/${button.getAttribute("data-slug")}`;
          } else {
            overlay.classList.toggle("show");
            overlay.setAttribute("data-slug", button.getAttribute("data-slug") ?? "");
          }
        } else {
          document.getElementById("connect-wallet")?.click();
        }
      });
    });
  }
}
