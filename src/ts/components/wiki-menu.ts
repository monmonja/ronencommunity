export function initWikiMenu (): void {
  const wikiMenu:HTMLElement | null = document.querySelector(".wiki-menu");
  const wikiMenuLabels: Element[] = wikiMenu
    ? Array.from(wikiMenu.querySelectorAll("li label"))
    : [];
  const menu:HTMLInputElement | null = document.querySelector("input[name=menu]");

  wikiMenuLabels.forEach((wikiItem: Element) => {
    wikiItem.querySelector("input")?.addEventListener("change", (e: Event) => {
      e.stopPropagation();

      const input:HTMLInputElement | null = wikiItem.querySelector("input[type=radio]");

      if (menu && input !== null) {
        // hide the menu when the user click on any item
        menu.checked = false;
      }

      if (input) {
        location.href = input.value;

        return;
      }
    });
  });

  if (menu) {
    menu.addEventListener("change", () => {
      const input:HTMLInputElement | null | undefined = wikiMenu?.querySelector("input[type=radio]:checked");

      if (input) {
        input.checked = false;
      }
    });
  }

  document.querySelectorAll('.header-title').forEach((element) => {
    if (element.hasAttribute('id')) {
      element.innerHTML = `<a href="#${element.getAttribute('id')}" class="direct-link">
    <svg viewBox="0 0 22 23" focusable="false" class="header--tag__icon"><path stroke="currentColor" fill="none" d="M9 12.3a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M13 10.3a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.7" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg>
  </a>` + element.innerHTML;
    }
  });
}
