import NftModel from "../models/nft-model.mjs";
import {makeBaxie} from "./baxies/baxie-utilities.mjs";
import {GameModes} from "../../../games/common/baxie/baxie-simulation.mjs";
import GameRoomManager from "./game-room-manager.mjs";
import Security from "../models/security.mjs";
import {logError} from "../components/logger.mjs";
import SkillManager from "./baxies/baxie-simulation/skill-manager.mjs";
import {EFFECTS} from "./baxies/effects.mjs";
import Energies from "../models/energies.mjs";
import GameRoomsModel from "../models/game-rooms-model.mjs";
import RoomManager from "./game-room-manager.mjs";

const turnTimeout = 3000;

export async function createCPUPlayer(roomId, characterIds) {
  const currentRoom = GameRoomManager.rooms[roomId];

  currentRoom.vsCPU = true;
  currentRoom.cpuAddress =  "cpu" + (new Date()).getTime() + Math.random().toString(36).substring(2, 6);
  const cpuPlayer = {
    address: currentRoom.cpuAddress,
    isCpu: true,
  };

  characterIds = characterIds || [];
  if (characterIds.length !== 3) {
    const teams = [
      [[1, "back"], [3, "center"], [4, "front"]],
      [[868, "center"], [870, "back"], [867, "back"]],
      [[3729, "center"], [879, "back"], [3494, "back"]],
    ];
    characterIds = teams[Math.floor(Math.random() * teams.length)].map(([tokenId, position]) => ({ tokenId, position }));
  }

  const nftDocs = [];
  for (let i = 0; i < characterIds.length; i += 1) {
    let data = await NftModel.findById({
      nftTokenId: "baxies",
      nftId: characterIds[i].tokenId });

    if (!data) {
      data = await NftModel.getNFTMetadata({
        nftTokenId: "baxies",
        tokenURI: `https://metadata.ronen.network/0xb79f49ac669108426a69a26a6ca075a10c0cfe28/${characterIds[i].tokenId}`,
        nftId: characterIds[i].tokenId,
      });
    }

    nftDocs.push(makeBaxie(data));
  }

  cpuPlayer.ws = {
    send: (data) => {
    //  console.log("cpu ws", data)
    },
    session: {wallet: {address: currentRoom.cpuAddress}}
  };
  cpuPlayer.baxies = nftDocs;
  cpuPlayer.baxieIds = characterIds;
  characterIds.forEach((baxie) => {
    const baxieId = baxie.tokenId;
    cpuPlayer.baxies.forEach((playerBaxie) => {
      if (Number(playerBaxie.tokenId) === Number(baxieId)) {
        playerBaxie.position = baxie.position;
      }
    })
  });

  GameRoomManager.rooms[roomId].players.push(cpuPlayer);
  GameRoomManager.rooms[roomId].canJoin = false;
}

function isGameOver(currentRoom) {
  if (currentRoom.gameOver) {
    return;
  }

  let gameOver = false;
  currentRoom.players.forEach((player) => {
    if (player.baxies.filter((b) => b.isAlive()).length === 0) {
      gameOver = true;
      currentRoom.loserAddress = player.address;
    }
  });
  currentRoom.winnerAddress = currentRoom.players.find(
    (p) => p.address !== currentRoom.loserAddress
  )?.address;

  if (gameOver) {
    setTimeout(() => {
      currentRoom.players.forEach((player) => {
        if (player.ws) {
          player.ws.send(JSON.stringify({
            type: "gameOver",
            winnerAddress: currentRoom.winnerAddress,
            yourAddress: player.address,
          }));
        }
      });
      currentRoom.status = "Game Over";
      currentRoom.gameOver = true;
      GameRoomsModel.updateRoom(currentRoom.roomId, currentRoom);
      RoomManager.cleanupRoom(currentRoom.roomId);
    }, 2000);
  }

  return gameOver;
}

function simulateCPUSkills (ws, data) {
  try {
    const currentRoom = GameRoomManager.rooms[data.roomId];
    const userAddress = ws.session.wallet.address.toLowerCase();
    const player = GameRoomManager.getPlayer(data.roomId, userAddress);

    const mockWs = {session: {wallet: {address: currentRoom.cpuAddress}}};

    function tryAttack(attempts = 0) {
      if (attempts > 20) {
        console.log("try attack exceeded max attempts");

        return;
      }

      if (isGameOver(currentRoom)) {
        return;
      }

      const canAttackBaxie = player.baxies.filter((b) => b.isAlive() && b.canAttack());
      if (canAttackBaxie.length === 0) {
        return;
      }

      const selectedBaxie = canAttackBaxie[Math.random() * canAttackBaxie.length | 0];
      const selectedSkill = selectedBaxie.skills[Math.floor(Math.random() * selectedBaxie.skills.length)].func;

      if (selectedBaxie.canAttack()) {
        const skill = selectedBaxie.skills.filter((s) => s.func === selectedSkill)[0];
        let canAttack = selectedBaxie.currentStamina >= skill.cost;

        if (currentRoom.gameMode === GameModes.skillCountdown) {
          canAttack = true;
        }

        if (canAttack) {
          handleUseSkill(mockWs, {
            roomId: data.roomId,
            selectedBaxieId: selectedBaxie.tokenId,
            selectedSkill: selectedSkill,
          });

          if (isGameOver(currentRoom)) {
            return;
          }

          if (currentRoom.gameMode === GameModes.turnBasedSP) {
            setTimeout(() => {
              handleEndTurn(ws, data);
            }, 5000);
          } else if (currentRoom.gameMode === GameModes.skillCountdown) {
            setTimeout(() => {
              tryAttack();
            }, 5000); //5000
          } else {
            console.log("unknown game mode", currentRoom.gameMode);
          }
        } else {
          tryAttack(attempts + 1);
          console.log("CPU baxie not enough stamina", selectedBaxie.currentStamina, skill.cost);
        }
      } else {
        console.log("CPU baxie cannot attack", selectedBaxie.reasonCannotAttack());
      }
    }

    tryAttack();
  } catch (e) {
    logError({
      message: "error in simulateCPUSkills",
      auditData: {
        e,
        address: ws.session.wallet.address.toLowerCase(),
      }
    });
  }
}

function afterTurnEffectsHandler(baxie, turnIndex) {
  for (let i = baxie.effects.length - 1; i >= 0; i--) {
    const effect = baxie.effects[i];
    baxie.afterTurnEffects(effect.type, effect);

    if (turnIndex !== effect.turnIndexAdded) {
      effect.turnsLeft -= 1;

      console.log(`Baxie ${baxie.tokenId} effect ${effect.type} turn left: ${effect.turnsLeft}, ${turnIndex} `);

      if (effect.turnsLeft <= 0) {
        console.log("Removing effect:", effect.type);
        baxie.effects.splice(i, 1); // remove effect at index i
      }
    }
  }
}

function doPhysicalAttack({ roomId, playerWithSelectedBaxie, selectedBaxie } = {}) {
  const currentRoom = GameRoomManager.rooms[roomId];
  const enemy = GameRoomManager.getOpponent(roomId, playerWithSelectedBaxie.address);

  const target = SkillManager.getBaxieFromPosition(enemy.baxies.filter((b) => b.isAlive()), 1)[0];

  const damage = selectedBaxie.getPhysicalDamage(target);
  let message;

  if (target.hasEffect(EFFECTS.reflect)) {
    selectedBaxie.takeDamage(damage);
    message = {
      enemies: [{ target: selectedBaxie.tokenId, damage, skill: EFFECTS.reflect, reflectFrom: target.tokenId }],
    };
  } else {
    target.takeDamage(damage);
    message = {
      enemies: [{ target: target.tokenId, damage }],
    };
  }

  currentRoom.players.forEach((roomPlayer) => {
    if (roomPlayer.ws) {
      roomPlayer.ws.send(JSON.stringify({
        type: "endPhysicalAttack",
        baxieId: selectedBaxie.tokenId,
        message,
        isYourTurn: currentRoom.playerTurn === currentRoom.playerTurn,
        baxieTurnIndex: currentRoom.baxieTurnIndex,
        roomId: roomId,
      }));

      roomPlayer.ws.send(JSON.stringify({
        type: "updateStats",
        player: roomPlayer.baxies?.map((baxie) => baxie.getGameInfo()),
        enemy: (currentRoom.players.filter((p) => p.address !== roomPlayer.address)[0])?.baxies?.map((baxie) => baxie.getGameInfo()),
      }));

      isGameOver(currentRoom);
    }
  });
}

/**
 *
 * @param data
 * @param ws
 * @param {Baxie} selectedBaxie
 */
function baxieAutoBattlerTurn(ws, data, selectedBaxie) {
  const currentRoom = GameRoomManager.rooms[data.roomId];

  if (!currentRoom) {
    return;
  }

  const playerWithSelectedBaxie = currentRoom.players.filter((p) => p.baxieIds.map((b => b.tokenId)).includes(selectedBaxie.tokenId))[0];
  const highestSkill = selectedBaxie.skills.reduce((max, skill) =>
    skill.cost > max.cost ? skill : max
  );
  let selectedSkill;
  if (playerWithSelectedBaxie.currentSP >= highestSkill.cost) {
    selectedSkill = highestSkill;
  } else {
    selectedSkill = selectedBaxie.skills[Math.floor(Math.random() * selectedBaxie.skills.length)].func;
  }

  const nextBaxie = (timeout = turnTimeout) => {
    if (currentRoom.gameOver) {
      return false;
    }

    setTimeout(() => {
      currentRoom.baxieTurnIndex += 1;

      if (currentRoom.baxieTurnIndex >= 6) {
        currentRoom.baxieTurnIndex = 0;
        currentRoom.turnIndex += 1;

        currentRoom.players.forEach((player) => {
          // refill stamina by 20%
          player.baxies?.filter((b) => b.isAlive()).forEach((baxie) => {
            baxie.currentStamina += baxie.getMaxStamina() * 0.2;
          });
        });

        currentRoom.players.forEach((player) => {
          if (player.ws) {
            player.ws.send(JSON.stringify({
              type: "newTurn",
              turnIndex: currentRoom.turnIndex,
            }));
            player.ws.send(JSON.stringify({
              type: "updateStats",
              player: player.baxies?.map((baxie) => baxie.getGameInfo()),
              enemy: (currentRoom.players.filter((p) => p.address !== player.address)[0])?.baxies?.map((baxie) => baxie.getGameInfo()),
            }));
          }
        });

        console.log("--- Auto Battler Round End ---", currentRoom.turnIndex);

        baxieAutoBattlerTurn(ws, data, currentRoom.baxieTurnOrder[currentRoom.baxieTurnIndex]);
      } else {
        baxieAutoBattlerTurn(ws, data, currentRoom.baxieTurnOrder[currentRoom.baxieTurnIndex]);
      }
    }, timeout);
  };

  if (!selectedBaxie.isAlive()) {
    afterTurnEffectsHandler(selectedBaxie, currentRoom.turnIndex);
    nextBaxie(0);
    return;
  }

  if (selectedBaxie.canAttack()) {
    const skill = selectedBaxie.skills.filter((s) => s.func === selectedSkill)[0];
    let canAttack = selectedBaxie.currentStamina >= skill.cost;

    if (currentRoom.gameMode === GameModes.skillCountdown) {
      canAttack = true;
    }
    if (currentRoom.gameMode === GameModes.autoBattler) {
      canAttack = true;
    }

    if (canAttack) {
      const canUseSkill = selectedBaxie.canUseSkill(selectedSkill, currentRoom.gameMode);

      if (canUseSkill) {
        handleUseSkill(playerWithSelectedBaxie.ws, {
          roomId: data.roomId,
          selectedBaxieId: selectedBaxie.tokenId,
          selectedSkill: selectedSkill,
        });
      } else {
        doPhysicalAttack({
          roomId: data.roomId,
          playerWithSelectedBaxie,
          selectedBaxie,
        });
      }

      if (isGameOver(currentRoom)) {
        return;
      }

      afterTurnEffectsHandler(selectedBaxie, currentRoom.turnIndex);
      nextBaxie();
    } else {
      doPhysicalAttack({
        roomId: data.roomId,
        playerWithSelectedBaxie,
        selectedBaxie,
      });
      afterTurnEffectsHandler(selectedBaxie, currentRoom.turnIndex);
      // tryAttack(attempts + 1);
      console.log("auto battler not enough stamina", selectedBaxie.currentStamina, skill.cost);
    }
  } else {
    afterTurnEffectsHandler(selectedBaxie, currentRoom.turnIndex);
    console.log("Baxie cannot attack", selectedBaxie.reasonCannotAttack());
    nextBaxie();
  }
}

async function handleGameLoaded(ws, data) {
  const currentRoom = GameRoomManager.rooms[data.roomId];
  const userAddress = ws.session.wallet.address.toLowerCase();

  if (currentRoom.vsCPU) {
    try {
      if (currentRoom.gameMode === GameModes.autoBattler) {
        currentRoom.players.forEach((player) => {
          if (!player.isCpu) {
            Energies.useEnergy({
              address: player.address,
              gameId: data.gameId,
              amount: 3,
            });
          }

          player.ws.send(JSON.stringify({
            type: "startBattle",
            roomId: data.roomId,
            baxieTurnOrder: currentRoom.baxieTurnOrder,
            baxieTurnIndex: currentRoom.baxieTurnIndex,
            turnIndex: currentRoom.turnIndex,
          }));
        });

        currentRoom.status = 'playing';
        await GameRoomsModel.updateRoom(currentRoom.roomId, currentRoom);

        setTimeout(() => {
          console.log("currentRoom.baxieTurnIndex", currentRoom.baxieTurnIndex);

          baxieAutoBattlerTurn(ws, data, currentRoom.baxieTurnOrder[currentRoom.baxieTurnIndex]);
        }, 1000);

      } else {
        let startCPU = false;

        if (currentRoom.playerTurn === currentRoom.cpuAddress && currentRoom.gameMode === GameModes.turnBasedSP) {
          startCPU = true;
        } else if (currentRoom.gameMode === GameModes.skillCountdown) {
          startCPU = true;
        }

        if (startCPU) {
          setTimeout(() => {
            const mockWs = {session: {wallet: {address: currentRoom.cpuAddress}}};

            simulateCPUSkills(mockWs, data);
          }, turnTimeout);
        }
      }
    } catch (e) {
      logError({
        message: "error in handleGameLoaded vsCPU",
        auditData: {
          e,
        }
      });
    }
  } else {
    try {
      for (let i = 0; i < currentRoom.players.length; i++) {
        if (currentRoom.players[i].address === userAddress) {
          currentRoom.players[i].gameLoaded = true;
        }
      }

      if (currentRoom.players.filter((i) => i.gameLoaded).length === currentRoom.players.length) {
        currentRoom.players.forEach((player) => {
          player.ws.send(JSON.stringify({
            type: "startBattle",
            roomId: data.roomId,
            baxieTurnOrder: currentRoom.baxieTurnOrder,
            baxieTurnIndex: currentRoom.baxieTurnIndex,
            turnIndex: currentRoom.turnIndex,
          }));
        });

        currentRoom.status = 'playing';
        await GameRoomsModel.updateRoom(currentRoom.roomId, currentRoom);

        if (currentRoom.gameMode === GameModes.autoBattler) {
          baxieAutoBattlerTurn(ws, data, currentRoom.baxieTurnOrder[currentRoom.baxieTurnIndex]);
        }
      }
    } catch (e) {
      logError({
        message: "error in handleGameLoaded pvp",
        auditData: {
          e,
          address: ws.session.wallet.address.toLowerCase(),
        }
      });
    }
  }
}

async function handleJoinRoom(ws, data) {
  try {
    const currentRoom = GameRoomManager.rooms[data.roomId];
    const userAddress = ws.session.wallet.address.toLowerCase();

    for (let i = 0; i < currentRoom.players.length; i++) {
      if (currentRoom.players[i].address === userAddress && !currentRoom.players[i].ws) {
        GameRoomManager.rooms[data.roomId].players[i].ws = ws;
        GameRoomManager.rooms[data.roomId].players[i].baxieIds = data.selectedBaxies;

        const nftDocs = await Promise.all(
          data.selectedBaxies.map((baxie) =>
            NftModel.findById({ nftTokenId: "baxies", nftId: baxie.tokenId })
          )
        );

        GameRoomManager.rooms[data.roomId].players[i].baxies = nftDocs.map((nftData) => makeBaxie(nftData));
        data.selectedBaxies.forEach((baxie) => {
          const baxieId = baxie.tokenId;
          GameRoomManager.rooms[data.roomId].players[i].baxies.forEach((playerBaxie) => {
            if (Number(playerBaxie.tokenId) === Number(baxieId)) {
            console.log(`Setting position and skills for baxie ${baxieId} to ${JSON.stringify(baxie.skills)}`);
              playerBaxie.position = baxie.position;
              playerBaxie.populateSkills(baxie.skills);
            }
          })
        });
      }
    }

    // start game when 2 players have joined
    if (currentRoom.players.filter((player) => !!player.ws).length === 2) {
      currentRoom.turnIndex = 0;
      // randomised player start
      const playerTurn  = currentRoom.players[Math.floor(Math.random() * currentRoom.players.length)];
      currentRoom.playerTurn = playerTurn.address;
      currentRoom.lastUpdateSP = new Date();

      if (currentRoom.gameMode === GameModes.autoBattler) {
        // randomise baxie turn order
        const allBaxies = currentRoom.players.map((p) => p.baxies).flat();

        /**
         * @type Baxie[]
         */
        currentRoom.baxieTurnOrder = allBaxies.sort(() => Math.random() - 0.5);
        currentRoom.baxieTurnIndex = 0;
      }

      currentRoom.players.forEach((player) =>{
        if (player.ws) {
          const enemy = GameRoomManager.getOpponent(data.roomId, player.address);

          player.ws.send(JSON.stringify({
            type: "initGame",
            roomId: data.roomId,
            isYourTurn: player.address === currentRoom.playerTurn,
            turnIndex: currentRoom.turnIndex,
            message: "Both players have joined. Starting game...",
            player: player.baxies?.map((baxie) => baxie.getGameInfo(true)),
            enemy: enemy.baxies?.map((baxie) => baxie.getGameInfo(true)),
            gameMode: currentRoom.gameMode,
          }));
        }
      });
    }
  } catch (e) {
    logError({
      message: "error in handleJoinRoom",
      auditData: {
        e,
        address: ws.session.wallet.address.toLowerCase(),
      }
    });
  }
}

function handleEndTurn(ws, data) {
  try {
    /**
     * @type GameRoom
     */
    const currentRoom = GameRoomManager.rooms[data.roomId];
    const userAddress = ws.session.wallet.address.toLowerCase();
    const player = GameRoomManager.getPlayer(data.roomId, userAddress);
    const enemy = GameRoomManager.getOpponent(data.roomId, userAddress);

    afterTurnEffectsHandler(player);

    currentRoom.playerTurn = enemy.address;
    currentRoom.turnIndex += 1;
    //
    // if (currentRoom.turnIndex % 2 === 0) {
    //   currentRoom.usedBaxies = [];
    // }

    // update stamina based on time elapsed
    const currentTime = new Date().getTime();

    currentRoom.players.forEach((player) => {
      player.baxies.filter((b) => b.isAlive()).forEach((baxie) => {
        const elapsedMs = currentTime - currentRoom.lastUpdateSP.getTime(); // milliseconds elapsed
        const elapsedSec = Math.floor(elapsedMs / 1000);

        baxie.currentStamina = Math.max(baxie.getMaxStamina(), baxie.currentStamina + (elapsedSec / 2));
      });
    });
    currentRoom.lastUpdateSP = new Date();

    if (!isGameOver(currentRoom)) {
      if (currentRoom.vsCPU && currentRoom.playerTurn === currentRoom.cpuAddress) {
        const mockWs = {session: {wallet: {address: currentRoom.cpuAddress}}};
        simulateCPUSkills(mockWs, data);
      } else {
        enemy.ws.send(JSON.stringify({
          type: "yourTurn",
          roomId: data.roomId,
          turnIndex: data.turnIndex,
          round: Math.floor(data.turnIndex / 2),
          isYourTurn: currentRoom.playerTurn === enemy.address,
        }));
      }

      currentRoom.players.forEach((player) => {
        const enemy = GameRoomManager.getOpponent(data.roomId, userAddress);

        if (player.ws) {
          player.ws.send(JSON.stringify({
            type: "updateStats",
            player: player.baxies?.map((baxie) => baxie.getGameInfo()),
            enemy: enemy.baxies?.map((baxie) => baxie.getGameInfo()),
          }));
        }
      });
    }
  } catch (e) {
    logError({
      message: "error in handleEndTurn",
      auditData: {
        e,
        address: ws.session.wallet.address.toLowerCase(),
      }
    });
  }
}

function handleUseSkill(ws, data, request) {
  try {
    /**
     * @type GameRoom
     */
    const currentRoom = GameRoomManager.rooms[data.roomId];
    const userAddress = ws.session.wallet.address.toLowerCase();
    // currentRoom.usedBaxies = currentRoom.usedBaxies || [];

    const player = GameRoomManager.getPlayer(data.roomId, userAddress);
    const enemy = GameRoomManager.getOpponent(data.roomId, userAddress);

    const selectedBaxie = player.baxies.filter((baxie) => baxie.tokenId === data.selectedBaxieId)[0];

    // if (currentRoom.usedBaxies.includes(selectedBaxie.tokenId)) {
    //   return ws.send(JSON.stringify({
    //     type: "Error",
    //     message: "Baxie has already acted this turn",
    //   }));
    // }

    if (selectedBaxie.skills.filter((s) => s.func === data.selectedSkill).length === 0) {
      logError({
        message: `${selectedBaxie.tokenId} no skill found ${data.selectedSkill}`,
        auditData: {
          selectedBaxie,
          data,
          address: ws.session.wallet.address.toLowerCase(),
        }
      });

      Security.addRecord(request, {
        key: "BaxieSimulation no skill found",
        value: JSON.stringify({
          ...data,
          ...selectedBaxie,
        }),
        address: ws.session.wallet.address.toLowerCase(),
      });

      return;
    }

    if (!selectedBaxie.canAttack()) {
      console.log("Cannot attack", selectedBaxie.reasonCannotAttack());

      return;
    }

    const canUseSkill = selectedBaxie.canUseSkill(data.selectedSkill, currentRoom.gameMode);

    if (canUseSkill) {
      const message = selectedBaxie.useSkill({
        skillName: data.selectedSkill,
        enemies: enemy.baxies.filter((b) => b.isAlive()),
        allies: player.baxies.filter((b) => b.isAlive()),
        gameMode: currentRoom.gameMode,
        turnIndex: currentRoom.turnIndex,
      });
      console.log("message", message)
      // currentRoom.usedBaxies.push(selectedBaxie.tokenId);

      currentRoom.players.forEach((roomPlayer) => {
        if (roomPlayer.ws) {
          roomPlayer.ws.send(JSON.stringify({
            type: "endUseSkill",
            skill: data.selectedSkill,
            baxieId: selectedBaxie.tokenId,
            baxieType: selectedBaxie.attributes.class.toLowerCase(), // later should be based on skill type
            message: message,
            isYourTurn: currentRoom.playerTurn === currentRoom.playerTurn,
            baxieTurnIndex: currentRoom.baxieTurnIndex,
            roomId: data.roomId,
          }));

          roomPlayer.ws.send(JSON.stringify({
            type: "updateStats",
            player: roomPlayer.baxies?.map((baxie) => baxie.getGameInfo()),
            enemy: (currentRoom.players.filter((p) => p.address !== roomPlayer.address)[0])?.baxies?.map((baxie) => baxie.getGameInfo()),
          }));

          isGameOver(currentRoom);
        }
      });

    } else {
      console.log("Not enough stamina or in countdown");
    }
  } catch (e) {
    logError({
      message: "error in handleUseSkill",
      auditData: {
        e,
        // address: ws.session.wallet.address.toLowerCase(),
      }
    });
  }
}

function checkActionValidity(ws, data) {
  /**
   * @type GameRoom
   */
  const currentRoom = GameRoomManager.rooms[data.roomId];
  const userAddress = ws.session.wallet.address.toLowerCase();

  if (currentRoom.gameMode === GameModes.turnBasedSP && currentRoom.playerTurn !== userAddress) {
    ws.send(JSON.stringify({
      type: "Error",
      message: "Not your turn",
      data,
    }));

    return false;
  }

  const player = GameRoomManager.getPlayer(data.roomId, userAddress);
  const enemy = GameRoomManager.getOpponent(data.roomId, userAddress);

  if (!player || !enemy) {
    ws.send(JSON.stringify({
      type: "Error",
      message: "Player or enemy not found",
    }));

    return false;
  }

  return true;
}

export function handleBaxieSimulationGameRoom(ws, data, request) {
  if (typeof data.roomId === "undefined") {
    Security.addRecord(request, {
      key: "BaxieSimulation no room id",
      value: JSON.stringify(data),
      address: ws.session.wallet.address.toLowerCase(),
    });
    logError({
      message: "BaxieSimulation no room id",
      auditData: {
        data,
        address: ws.session.wallet.address.toLowerCase(),
      }
    });

    return;
  }

  /**
   * Player 1: Create Room
   * Player 2: Join Room
   * both player: Init Game
   */
  if (GameRoomManager.rooms[data.roomId]) {
    if (data.type === "joinRoom") {
      handleJoinRoom(ws, data);
    } else if (data.type === "useSkill") {
      if (checkActionValidity(ws, data)) {
        handleUseSkill(ws, data, request);
      }
    } else if (data.type === "endTurn") {
      if (checkActionValidity(ws, data)) {
        handleEndTurn(ws, data, request);
      }
    } else if (data.type === "gameLoaded") {
      handleGameLoaded(ws, data, request);
    } else {
      logError({
        message: "BaxieSimulation invalid type",
        auditData: {
          data,
          address: ws.session.wallet.address.toLowerCase(),
        }
      });

      Security.addRecord(request, {
        key: "BaxieSimulation invalid type",
        value: JSON.stringify(data),
        address: ws.session.wallet.address.toLowerCase(),
      });
    }
  }
}
