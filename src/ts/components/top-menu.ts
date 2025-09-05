export function initTopMenu (): void {
  const mobileMenu:HTMLElement | null = document.querySelector("#mobile-menu");
  const topMenu:HTMLElement | null = document.querySelector("#top-menu");

  if (mobileMenu && topMenu) {
    mobileMenu.addEventListener("click", (e: Event) => {
      e.stopPropagation();

      topMenu.classList.toggle('open');
    });
  }
}
