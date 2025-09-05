import { initTopMenu } from "./components/top-menu";
import { initAuth } from "./components/auth";
import { initWikiMenu } from "./components/wiki-menu";

document.addEventListener("DOMContentLoaded", () => {
  initTopMenu();
  initAuth();
  initWikiMenu();
});
