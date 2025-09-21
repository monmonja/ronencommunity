export function initTopBanner (): void {
  const topBannerAddress:HTMLElement | null = document.querySelector("#top-banner-address");

  if (topBannerAddress) {
    topBannerAddress.addEventListener("click", (e: Event) => {
      e.preventDefault();

      const content = topBannerAddress.innerHTML.trim();


      // Copy to clipboard
      navigator.clipboard.writeText(content)
        .then(() => alert("Copied to clipboard!"))
        .catch((err) => console.error("Failed to copy:", err));
    });
  }
}
