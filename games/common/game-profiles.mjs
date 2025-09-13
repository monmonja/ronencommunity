import Phaser from "phaser";
import constants from "./constants.mjs";
import FetchUrl from "./utils/fetch-url.mjs";
import {getCookie} from "./utils/cookies.mjs";

export function fetchGameProfile(scene) {
  scene.load.addFile(new FetchUrl(scene.load, 'gameProfiles', `/game-profiles/get/${scene.game.customConfig.gameId}`, (gameProfile) => {
    scene.registry.set(constants.registry.gameProfile, gameProfile);
    scene.game.events.emit(constants.events.gameProfileChanged, gameProfile);
  }));
}

export function updateGameProfile({ scene, label, value } = {}) {
  return new Promise((resolve, reject) => {
    fetch("/game-profiles/set-value", {
      method: "POST",
      // @ts-expect-error Custom header
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": getCookie("XSRF-TOKEN"),
      },
      body: JSON.stringify({
        gameId: scene.game.customConfig.gameId,
        label,
        value,
      })
    }).then((res) => {
      resolve(res);
    });
  });
}


