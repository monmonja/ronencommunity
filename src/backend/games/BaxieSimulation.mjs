import NftModel from "../models/nft-model.mjs";
import {makeBaxie} from "./baxies/baxie-utilities.mjs";
import {GameModes} from "../../../games/common/baxie/baxie-simulation.mjs";
import GameRoomManager from "./game-room-manager.mjs";

export async function createCPUPlayer(roomId, characterIds) {
  GameRoomManager.rooms[roomId].vsCPU = true;
  GameRoomManager.rooms[roomId].cpuAddress =  'cpu' + (new Date()).getTime() + Math.random().toString(36).substring(2, 6);
  const cpuPlayer = {
    address: GameRoomManager.rooms[roomId].cpuAddress,
  };

  characterIds = characterIds || [];
  if (characterIds.length !== 3) {
    characterIds  = [
      {
        "tokenId": "1",
        "skills": [
          "chargeUp"
        ],
        "position": "back"
      },
      {
        "tokenId": "3",
        "skills": [
          "naturesResurgence",
          "thornGuard"
        ],
        "position": "center"
      },
      {
        "tokenId": "4",
        "skills": [
          "voltOverload",
          "chargeUp",
          "stormBreaker"
        ],
        "position": "front"
      }
    ]
  }
  console.log(characterIds, 'characterIds')

  const nftDocs = await Promise.all(
    characterIds.map((baxie) =>
      NftModel.findById({ nftTokenId: 'baxies', nftId: Number(baxie.tokenId) })
    )
  );

  cpuPlayer.baxies = nftDocs.map((nftData) => makeBaxie(nftData));
  characterIds.forEach((baxie) => {
    const baxieId = baxie.tokenId;
    cpuPlayer.baxies.forEach((playerBaxie) => {
      if (Number(playerBaxie.tokenId) === Number(baxieId)) {
        playerBaxie.position = baxie.position;
        playerBaxie.skills = baxie.skills;
      }
    })
  });

  GameRoomManager.rooms[roomId].players.push(cpuPlayer);
  GameRoomManager.rooms[roomId].canJoin = false;
}

function isGameOver(currentRoom) {
  let gameOver = false;
  currentRoom.players.forEach((player, i) => {
    if (player.baxies.filter((b) => b.isAlive()).length === 0) {
      gameOver = true;
      currentRoom.loserAddress = player.address;
    }
  });

  if (gameOver) {
    currentRoom.players.forEach((player, i) => {
      if (player.ws) {
        player.ws.send(JSON.stringify({
          type: 'gameOver',
          youWin: player.address !== currentRoom.loserAddress,
        }));
      }
    });
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
      if (attempts > 10) {
        console.log('try attack exceeded max attempts');
        return;
      }

      if (isGameOver(currentRoom)) {
        console.log('game over')
        return;
      }

      const canAttackBaxie = player.baxies.filter((b) => b.isAlive() && b.canAttack());
      if (canAttackBaxie.length === 0) {
        console.log('canAttackBaxie', canAttackBaxie)
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
            console.log('game over')
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
            console.log('unknown game mode', currentRoom.gameMode)
          }
        } else {
          tryAttack(attempts + 1);
          console.log('CPU baxie not enough stamina', selectedBaxie.currentStamina, skill.cost);
        }
      } else {
        console.log('CPU baxie cannot attack', selectedBaxie.reasonCannotAttack());
      }
    }

    tryAttack();
  } catch (e) {
    console.log('error in simulateCPUSkills', e)
  }
}

async function handleGameLoaded(ws, data) {
  const currentRoom = GameRoomManager.rooms[data.roomId];
  const userAddress = ws.session.wallet.address.toLowerCase();

  if (currentRoom.vsCPU) {
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
      }, 2000);
    }
  } else {
    for (let i = 0; i < currentRoom.players.length; i++) {
      if (currentRoom.players[i].address === userAddress) {
        currentRoom.players[i].gameLoaded = true;
      }
    }

    if (currentRoom.players.filter((i) => i.gameLoaded).length === 2) {
      currentRoom.players.forEach((player) => {
        player.ws.send(JSON.stringify({
          type: 'startBattle',
          roomId: data.roomId,
        }));
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
            NftModel.findById({ nftTokenId: 'baxies', nftId: baxie.tokenId })
          )
        );

        GameRoomManager.rooms[data.roomId].players[i].baxies = nftDocs.map((nftData) => makeBaxie(nftData));
        data.selectedBaxies.forEach((baxie) => {
          const baxieId = baxie.tokenId;
          GameRoomManager.rooms[data.roomId].players[i].baxies.forEach((playerBaxie) => {
            if (Number(playerBaxie.tokenId) === Number(baxieId)) {
              playerBaxie.position = baxie.position;
              playerBaxie.populateSkills(baxie.skills);
            }
          })
        });
      }
    }
console.log('currentRoom.players', currentRoom.players)
    // start game when 2 players have joined
    if (currentRoom.players.length === 2) {
      currentRoom.turnIndex = 0;
      // randomised player start
      const playerTurn  = currentRoom.players[Math.floor(Math.random() * currentRoom.players.length)];
      currentRoom.playerTurn = playerTurn.address;
      currentRoom.lastUpdateSP = new Date();

      currentRoom.players.forEach((player, i) =>{
        if (player.ws) {
          const enemy = GameRoomManager.getOpponent(data.roomId, userAddress);

          player.ws.send(JSON.stringify({
            type: 'initGame',
            roomId: data.roomId,
            isYourTurn: player.address === currentRoom.playerTurn,
            turnIndex: currentRoom.turnIndex,
            message: 'Both players have joined. Starting game...',
            player: player.baxies?.map((baxie) => baxie.getGameInfo(true)),
            enemy: enemy.baxies?.map((baxie) => baxie.getGameInfo(true)),
            gameMode: currentRoom.gameMode,
          }));
          player.ws.send(JSON.stringify({
            type: 'DeductEnergy',
            amount: 1,
          }));
        }
      });
    }
  } catch (e) {
    console.log('error in handleJoinRoom', e)
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

    player.baxies.map((baxie) => {
      for (let effectKey in baxie.effects) {
        if (baxie.effects.hasOwnProperty(effectKey)) {
          baxie.afterTurnEffects(effectKey, baxie.effects[effectKey]);

          baxie.effects[effectKey].turnLeft -= 1;

          if (baxie.effects[effectKey].turnLeft <= 0) {
            delete baxie.effects[effectKey];
          }
        }
      }
    })

    currentRoom.playerTurn = enemy.address;
    currentRoom.turnIndex += 1
    //
    // if (currentRoom.turnIndex % 2 === 0) {
    //   currentRoom.usedBaxies = [];
    // }

    // update stamina based on time elapsed
    const currentTime = new Date().getTime();
    currentRoom.players.forEach((player, i) => {
      player.baxies.filter((b) => b.isAlive()).forEach((baxie) => {
        const elapsedMs = currentTime - currentRoom.lastUpdateSP.getTime(); // milliseconds elapsed
        console.log(currentTime, currentRoom.lastUpdateSP.getTime())
        const elapsedSec = Math.floor(elapsedMs / 1000);

        baxie.currentStamina = Math.max(baxie.getMaxStamina(), baxie.currentStamina + (elapsedSec / 2));
      });
    });
    currentRoom.lastUpdateSP = new Date();

    if (!isGameOver(currentRoom)) {
      console.log(83, currentRoom.vsCPU, enemy.address, currentRoom.cpuAddress)
      if (currentRoom.vsCPU && currentRoom.playerTurn === currentRoom.cpuAddress) {
        const mockWs = {session: {wallet: {address: currentRoom.cpuAddress}}};
        simulateCPUSkills(mockWs, data);
      } else {
        enemy.ws.send(JSON.stringify({
          type: 'yourTurn',
          roomId: data.roomId,
          turnIndex: data.turnIndex,
          round: Math.floor(data.turnIndex / 2),
          isYourTurn: currentRoom.playerTurn === enemy.address,
        }));
      }

      currentRoom.players.forEach((player, i) => {
        const enemy = GameRoomManager.getOpponent(data.roomId, userAddress)

        if (player.ws) {
          player.ws.send(JSON.stringify({
            type: 'updateStats',
            player: player.baxies?.map((baxie) => baxie.getGameInfo()),
            enemy: enemy.baxies?.map((baxie) => baxie.getGameInfo()),
          }));
        }
      });
    }
  } catch (e) {
    console.log('error in handleEndTurn', e)
  }
}

function handleUseSkill(ws, data) {
  try {
    /**
     * @type GameRoom
     */
    const currentRoom = GameRoomManager.rooms[data.roomId];
    const userAddress = ws.session.wallet.address.toLowerCase();
    console.log(`${userAddress} is using skill ${data.selectedSkill} with baxie ${data.selectedBaxieId} in room ${data.roomId}`);
    // currentRoom.usedBaxies = currentRoom.usedBaxies || [];

    const player = GameRoomManager.getPlayer(data.roomId, userAddress);
    const enemy = GameRoomManager.getOpponent(data.roomId, userAddress);

    const selectedBaxie = player.baxies.filter((baxie) => baxie.tokenId === data.selectedBaxieId)[0];

    // if (currentRoom.usedBaxies.includes(selectedBaxie.tokenId)) {
    //   return ws.send(JSON.stringify({
    //     type: 'Error',
    //     message: 'Baxie has already acted this turn',
    //   }));
    // }

    if (selectedBaxie.skills.filter((s) => s.func === data.selectedSkill).length === 0) {
      console.log(`${selectedBaxie.tokenId} no skill found ${data.selectedSkill}`);
      // @todo trigger possible hacking

      return;
    }

    if (!selectedBaxie.canAttack()) {
      console.log('Cannot attack', selectedBaxie.reasonCannotAttack())
      return;
    }

    const canUseSkill = selectedBaxie.canUseSkill(data.selectedSkill, currentRoom.gameMode);

    if (canUseSkill) {
      console.log([data.selectedSkill,
        enemy.baxies.filter((b) => b.isAlive().length),
        player.baxies.filter((b) => b.isAlive().length),
        currentRoom.gameMode])
      const message = selectedBaxie.useSkill(
        data.selectedSkill,
        enemy.baxies.filter((b) => b.isAlive()),
        player.baxies.filter((b) => b.isAlive()),
        currentRoom.gameMode
      );
      console.log('message', message)
      // currentRoom.usedBaxies.push(selectedBaxie.tokenId);

      currentRoom.players.forEach((roomPlayer) => {
        if (roomPlayer.ws) {
          roomPlayer.ws.send(JSON.stringify({
            type: 'endUseSkill',
            skill: data.selectedSkill,
            baxieId: selectedBaxie.tokenId,
            message: message,
            isYourTurn: currentRoom.playerTurn === currentRoom.playerTurn,
            roomId: data.roomId,
          }));

          if (currentRoom.gameMode === GameModes.skillCountdown) {
            roomPlayer.ws.send(JSON.stringify({
              type: 'updateStats',
              player: roomPlayer.baxies?.map((baxie) => baxie.getGameInfo()),
              enemy: (currentRoom.players.filter((p) => p.address !== roomPlayer.address)[0])?.baxies?.map((baxie) => baxie.getGameInfo()),
            }));

            isGameOver(currentRoom);
          }
        }
      });

    } else {
      console.log('Not enough stamina or in countdown');
    }
  } catch (e) {
    console.log('error in handleUseSkill', e)
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
      type: 'Error',
      message: 'Not your turn',
      data,
    }));

    return false;
  }

  const player = GameRoomManager.getPlayer(data.roomId, userAddress);
  const enemy = GameRoomManager.getOpponent(data.roomId, userAddress);

  if (!player || !enemy) {
    ws.send(JSON.stringify({
      type: 'Error',
      message: 'Player or enemy not found',
    }));

    return false;
  }

  return true;
}

export function handleBaxieSimulationGameRoom(ws, data) {
  console.log(310)
  if (typeof data.roomId === "undefined") {
    // @todo trigger possible hacking
    console.log('no roomId', data.type);

    return;
  }

  /**
   * Player 1: Create Room
   * Player 2: Join Room
   * both player: Init Game
   */
  if (GameRoomManager.rooms[data.roomId]) {
    if (data.type === 'joinRoom') {
      handleJoinRoom(ws, data);
    } else if (data.type === 'useSkill') {
      if (checkActionValidity(ws, data)) {
        handleUseSkill(ws, data);
      }
    } else if (data.type === 'endTurn') {
      if (checkActionValidity(ws, data)) {
        handleEndTurn(ws, data);
      }
    } else if (data.type === 'gameLoaded') {
      handleGameLoaded(ws, data);
    }
  }
}