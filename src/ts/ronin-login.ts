export async function loginWithRoninWallet() {
  const provider = (window as any).ronin?.provider || (window as any).ethereum;

  if (!provider) {
    alert("Ronin Wallet or compatible Ethereum wallet not found.");
    return;
  }

  try {
    const accounts: string[] = await provider.request({
      method: 'eth_requestAccounts',
    });
;
    if (!accounts || accounts.length === 0) {
      return;
    }

    const address = accounts[0];
    const csrfToken = document.querySelector('meta[name=csrf-token]')?.getAttribute('content');
    const timestamp = Math.floor(Date.now() / 1000);
    const message = `Login to Ronin Community\nWallet: ${address}\nNonce: ${csrfToken}\nTimestamp: ${timestamp}`;

    const signature: string = await provider.request({
      method: 'personal_sign',
      params: [message, address],
    });

    const res = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address, signature, message, csrfToken }),
    });

    const result = await res.json();

    if (result.success) {
      window.location.href = '/games';
    } else {
      alert('Login failed: ' + result.error);
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('Login failed');
  }
}
