import { initTopMenu } from "./components/top-menu";
import { initAuth } from "./components/auth";
import {initEnergy} from "./components/energy";

document.addEventListener("DOMContentLoaded", () => {
  initTopMenu();
  initAuth();
  initEnergy();
});
