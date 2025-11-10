export function initTopBanner (): void {
  const topBannerAddress:NodeListOf<HTMLElement> = document.querySelectorAll(".top-banner-address");

  if (topBannerAddress) {
    topBannerAddress.forEach((element) => {
      element.addEventListener("click", (e: Event) => {
        e.preventDefault();

        const content = element.innerHTML.trim();

        // Copy to clipboard
        navigator.clipboard.writeText(content)
          .then(() => alert("Copied to clipboard!"))
          .catch((err) => console.error("Failed to copy:", err));
      });
    });
  }
}
