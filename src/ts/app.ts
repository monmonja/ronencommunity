import { initTopMenu } from "./components/top-menu";
import { initTopBanner } from "./components/top-banner";
import { initAuth } from "./components/auth";
import { initWikiMenu } from "./components/wiki-menu";

document.addEventListener("DOMContentLoaded", () => {
  initTopMenu();
  initTopBanner();
  initAuth();
  initWikiMenu();
});
