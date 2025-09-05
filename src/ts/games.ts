import { initTopMenu } from "./components/top-menu";
import { initAuth } from "./components/auth";
import { initGameItems } from "./components/game-items";
import { initOverlayRaffle } from "./components/overlay-raffle";
import { initRaffleCard } from "./components/raffle-card";
import {initEnergy} from "./components/energy";

document.addEventListener("DOMContentLoaded", () => {
  initTopMenu();
  initAuth();
  initGameItems();
  initOverlayRaffle();
  initRaffleCard();
  initEnergy();
});
