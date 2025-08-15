import { initAuth } from "./components/auth";
import { initOverlayRaffle } from "./components/overlay-raffle";
import { initRaffleCard } from "./components/raffle-card";

document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  initOverlayRaffle();
  initRaffleCard();
});
