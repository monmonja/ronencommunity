import { initAuth } from "./components/auth";
import { initWikiMenu } from "./components/wiki-menu";

document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  initWikiMenu();
});
