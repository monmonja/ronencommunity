import { sendToken } from "./ronin-send";
import {detectNetwork} from "./evm-detect-network";
import {getCookie} from "./cookies";

export function initEnergy (): void {
  // @ts-expect-error Will call from game
  window.purchaseEnergy = async (price:string, token:"RON" | "RONEN", network: string, gameId: string) => {
    if (network === 'abstract') {
      location.href = `/energy/abstract-purchase/${gameId}/${price}/${token.toLowerCase()}`;
    } else {
      if (!await detectNetwork()) {
        return;
      }

      return new Promise(async (resolve) => {
        const result = await sendToken(token, "{{config.web3.purchaseAddress}}", price);

        resolve(result);
      });
    }
  };

  // @ts-expect-error Will call from game
  window.verifyEnergyTx = async (txHash:string) => {
    if (!await detectNetwork()) {
      return;
    }

    return new Promise(async (resolve) => {
      const { nonce } = await fetch("/energy/nonce", { credentials: "include" }).then(r => r.json());

      const buyEnergyPost = async function () {
        const response = await fetch("/energy/buy", {
          method: "POST",
          // @ts-expect-error Custom header
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": getCookie("XSRF-TOKEN"),
          },
          body: JSON.stringify({
            txHash, nonce,
          })
        });

        if (!response.ok) {
          throw new Error(`Verify failed: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.status === "pending") {
          setTimeout(buyEnergyPost, 1000);
        } else if (result.status === "success") {
          resolve(result);
        } else if (result.status === "failed") {
          alert(result.message);
        }
      };

      await buyEnergyPost();
    });
  };
}
