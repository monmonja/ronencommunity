async function loadPage(url: string): Promise<string> {
  try {
    const response: Response = await fetch(url, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Failed to load page:', error);

    throw error;
  }
}

export default function (): void {
  const wikiMenu:HTMLElement | null = document.querySelector('.wiki-menu');
  const wikiMenuLabels: Element[] = wikiMenu
    ? Array.from(wikiMenu.querySelectorAll('li label'))
    : [];
  const menu:HTMLInputElement | null = document.querySelector('input[name=menu]');

  wikiMenuLabels.forEach((wikiItem: Element) => {
    wikiItem.querySelector('input')?.addEventListener('change', (e: Event) => {
      e.stopPropagation();

      const input:HTMLInputElement | null = wikiItem.querySelector('input[type=radio]');

      if (menu && input !== null) {
        // hide the menu when the user click on any item
        menu.checked = false;
      }

      if (input) {
        loadPage(input.value ?? '/wiki/ronen')
          .then((html) => {
            const content: HTMLElement | null = document.getElementById('content');

            history.pushState({}, '', input.value ?? '/wiki/ronen');

            if (content) {
              content.innerHTML = html;
            } else {
              console.warn('Element with ID "content" not found.');
            }
          });
      }
    });
  });

  if (menu) {
    menu.addEventListener('change', (e: Event) => {
      const input:HTMLInputElement | null | undefined = wikiMenu?.querySelector('input[type=radio]:checked');

      if (input) {
        input.checked = false;
      }
    });
  }

  window.addEventListener('popstate', (event) => {
    const path:string = location.pathname;

    const radioToCheck: HTMLInputElement | null = document.querySelector<HTMLInputElement>(
      `input[name="wiki-menu"][value="${path}"]`
    );

    if (radioToCheck) {
      radioToCheck.checked = true;
    }

    loadPage(path)
      .then((html) => {
        const content:HTMLElement | null = document.getElementById('content');

        if (content) {
          content.innerHTML = html;
        } else {
          console.warn('Element with ID "content" not found.');
        }
      });
  });
}
