import { initTopMenu } from "./components/top-menu";
import { initAuth } from "./components/auth";
import { initOverlayRaffle } from "./components/overlay-raffle";
import { initRaffleCard } from "./components/raffle-card";

document.addEventListener("DOMContentLoaded", () => {
  initTopMenu();
  initAuth();
  initOverlayRaffle();
  initRaffleCard();
});
