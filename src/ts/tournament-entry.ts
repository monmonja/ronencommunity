import { initTopMenu } from "./components/top-menu";
import { initAuth } from "./components/auth";
import { initTournamentEntryCard } from "./components/tournament-entry-card";
import {initOverlayTournamentEntry} from "./components/overlay-tournament-entry";


document.addEventListener("DOMContentLoaded", () => {
  initTopMenu();
  initAuth();
  initTournamentEntryCard();
  initOverlayTournamentEntry();
});
