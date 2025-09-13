import Phaser from "phaser";
import BootScenes from "../scene/boot-scene.mjs";
import CommonScenes from "../common-scenes.mjs";

export function getCookie(name) {
  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split("=");

    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }

  return null;
}