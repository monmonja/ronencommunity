export default function (): void {
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
}
