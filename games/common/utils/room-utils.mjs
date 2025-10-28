import Phaser from "phaser";
import BootScenes from "../scene/boot-scene.mjs";
import CommonScenes from "../common-scenes.mjs";

export function createGameRoom({ gameId, gameMode } = {}) {
  return new Promise((resolve, reject) => {
    fetch(`/game-rooms/create/${gameId}/${gameMode}`, {
      headers: {
        "Content-Type": "application/json",
      }
    })
      .then((res) => res.json())
      .then((result) => {
        resolve(result);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function createCpuGameRoom({ gameId, gameMode, characterIds } = {}) {
  return new Promise((resolve, reject) => {
    fetch(`/game-rooms/create-cpu/${gameId}`, {
      method: "POST",
      // @ts-expect-error Custom header
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        gameMode,
        characterIds,
      })
    })
      .then((res) => res.json())
      .then((result) => {
        resolve(result);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function joinGameRoom({ gameId, roomId } = {}) {
  return new Promise((resolve, reject) => {
    fetch(`/game-rooms/join/${gameId}/${roomId}`, {
      headers: {
        "Content-Type": "application/json",
      }
    })
      .then((res) => res.json())
      .then((result) => {
        resolve(result);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function watchGameRoom({ gameId, roomId } = {}) {
  return new Promise((resolve, reject) => {
    fetch(`/game-rooms/watch/${gameId}/${roomId}`, {
      headers: {
        "Content-Type": "application/json",
      }
    })
      .then((res) => res.json())
      .then((result) => {
        resolve(result);
      })
      .catch((err) => {
        reject(err);
      });
  });
}