import NftModel from "../models/nft-model.mjs";
import GameRoomsModel from "../models/game-rooms-model.mjs";
import {makeBaxie} from "./baxies/baxie-utilities.mjs";

function simulateCPUSkills (ws, data) {
  const currentRoom = GameRoomsModel.rooms[data.roomId];
  const userAddress = ws.session.wallet.address.toLowerCase();
  const player = currentRoom.players.filter((p) => p.address === userAddress)[0];

  const mockWs = {session: {wallet: {address: currentRoom.cpuAddress}}};

  function tryAttack() {
    const canAttackBaxie = player.baxies.filter((b) => b.isAlive() && b.canAttack());
    const selectedBaxie = canAttackBaxie[Math.random() * canAttackBaxie.length | 0];
    console.log(selectedBaxie, Math.random() * canAttackBaxie.length)
    const selectedSkill = selectedBaxie.skills[Math.floor(Math.random() * selectedBaxie.skills.length)].func;

    if (selectedBaxie.canAttack()) {
      const skill = selectedBaxie.skills.filter((s) => s.func === selectedSkill)[0];
      if (selectedBaxie.currentStamina >= skill.cost) {
        handleUseSkill(mockWs, {
          roomId: data.roomId,
          selectedBaxieId: selectedBaxie.tokenId,
          selectedSkill: selectedSkill,
        });
        setTimeout(() => {
          handleEndTurn(ws, data);
        }, 5000);
      } else {
        tryAttack();
        console.log('CPU baxie not enough stamina', selectedBaxie.currentStamina, skill.cost);
      }
    } else {
      console.log('CPU baxie cannot attack', selectedBaxie.reasonCannotAttack());
    }
  }

  tryAttack();
}

async function handleJoinRoom(ws, data) {
  try {
    const currentRoom = GameRoomsModel.rooms[data.roomId];
    const userAddress = ws.session.wallet.address.toLowerCase();

    for (let i = 0; i < currentRoom.players.length; i++) {
      if (currentRoom.players[i].address === userAddress && !currentRoom.players[i].ws) {
        GameRoomsModel.rooms[data.roomId].players[i].ws = ws;
        GameRoomsModel.rooms[data.roomId].players[i].baxieIds = data.selectedBaxies;

        const nftDocs = await Promise.all(
          data.selectedBaxies.map((baxieId) =>
            NftModel.findById({ nftTokenId: 'baxies', nftId: baxieId })
          )
        );

        GameRoomsModel.rooms[data.roomId].players[i].baxies = nftDocs.map((nftData) => makeBaxie(nftData));
      }
    }

    // start game when 2 players have joined
    if (currentRoom.players.length === 2) {
      currentRoom.turnIndex = 0;
      // randomised player start
      const playerTurn  = currentRoom.players[Math.floor(Math.random() * currentRoom.players.length)];
      currentRoom.playerTurn = playerTurn.address;
      currentRoom.lastUpdateSP = new Date();

      currentRoom.players.forEach((player, i) =>{
        if (player.ws) {
          const enemy = currentRoom.players.filter((playerI) => player.address !== playerI.address)[0];

          player.ws.send(JSON.stringify({
            type: 'startGame',
            roomId: data.roomId,
            isYourTurn: player.address === currentRoom.playerTurn,
            turnIndex: currentRoom.turnIndex,
            message: 'Both players have joined. Starting game...',
            player: player.baxies?.map((baxie) => baxie.getGameInfo(true)),
            enemy: enemy.baxies?.map((baxie) => baxie.getGameInfo(true)),
          }));
          player.ws.send(JSON.stringify({
            type: 'DeductEnergy',
            amount: 1,
          }));
        }
      });

      if (currentRoom.vsCPU && currentRoom.playerTurn === currentRoom.cpuAddress) {
        const mockWs = { session: { wallet: { address: currentRoom.cpuAddress } } };
        simulateCPUSkills(mockWs, data);
      }
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
    const currentRoom = GameRoomsModel.rooms[data.roomId];
    const userAddress = ws.session.wallet.address.toLowerCase();
    const player = currentRoom.players.filter((p) => p.address === userAddress)[0];
    const enemy = currentRoom.players.filter((p) => p.address !== userAddress)[0];

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

    if (currentRoom.turnIndex % 2 === 0) {
      currentRoom.usedBaxies = [];
    }

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

    let isGameOver = false;
    currentRoom.players.forEach((player, i) => {
      if (player.baxies.filter((b) => b.isAlive()).length === 0) {
        isGameOver = true;
        currentRoom.loserAddress = player.address;
      }
    });

    if (isGameOver) {
      currentRoom.players.forEach((player, i) => {
        if (player.ws) {
          player.ws.send(JSON.stringify({
            type: 'gameOver',
            youWin: player.address !== currentRoom.loserAddress,
          }));
        }
      });
    } else {
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
        const enemy = currentRoom.players.filter((playerI) => player.address !== playerI.address)[0];

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
  /**
   * @type GameRoom
   */
  const currentRoom = GameRoomsModel.rooms[data.roomId];
  const userAddress = ws.session.wallet.address.toLowerCase();
console.log(`${userAddress} is using skill ${data.selectedSkill} with baxie ${data.selectedBaxieId} in room ${data.roomId}`);
  currentRoom.usedBaxies = currentRoom.usedBaxies || [];

  const player = currentRoom.players.filter((p) => p.address === userAddress)[0];
  const enemy = currentRoom.players.filter((p) => p.address !== userAddress)[0];

  const selectedBaxie = player.baxies.filter((baxie) => baxie.tokenId === data.selectedBaxieId)[0];

  if (currentRoom.usedBaxies.includes(selectedBaxie.tokenId)) {
    return ws.send(JSON.stringify({
      type: 'Error',
      message: 'Baxie has already acted this turn',
    }));
  }

  if (selectedBaxie.skills.filter((s) => s.func === data.selectedSkill).length === 0) {
    console.log(`${selectedBaxie.tokenId} no skill found ${data.selectedSkill}`);
    // @todo trigger possible hacking

    return;
  }

  if (!selectedBaxie.canAttack()) {
    return ws.send(JSON.stringify({
      type: 'Cannot Attack',
      message: selectedBaxie.reasonCannotAttack(),
    }));
  }

  const skill = selectedBaxie.skills.filter((s) => s.func === data.selectedSkill)[0];

  if (selectedBaxie.currentStamina >= skill.cost) {
    const message = selectedBaxie.useSkill(data.selectedSkill, enemy.baxies, player.baxies);
    currentRoom.usedBaxies.push(selectedBaxie.tokenId);

    currentRoom.players.forEach((roomPlayer) => {
      // console.log(roomPlayer.address, currentRoom.playerTurn,message)
      if (roomPlayer.address !== currentRoom.playerTurn) {
        const tempEnemies = message.enemies;

        message.enemies = message.allies;
        message.allies = tempEnemies;
      }

      if (roomPlayer.ws) {
        roomPlayer.ws.send(JSON.stringify({
          type: 'endUseSkill',
          skill: data.selectedSkill,
          baxieId: selectedBaxie.tokenId,
          message: message,
          isYourTurn: currentRoom.playerTurn === currentRoom.playerTurn,
          roomId: data.roomId,
        }));
      }
    });

  } else {
    return ws.send(JSON.stringify({
      type: 'Not enough stamina'
    }));
  }
}

function checkActionValidity(ws, data) {
  /**
   * @type GameRoom
   */
  const currentRoom = GameRoomsModel.rooms[data.roomId];
  const userAddress = ws.session.wallet.address.toLowerCase();

  if (currentRoom.playerTurn !== userAddress) {
    ws.send(JSON.stringify({
      type: 'Error',
      message: 'Not your turn',
    }));

    return false;
  }

  const player = currentRoom.players.filter((p) => p.address === userAddress)[0];
  const enemy = currentRoom.players.filter((p) => p.address !== userAddress)[0];

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
  if (typeof data.roomId === "undefined") {
    // @todo trigger possible hacking
    console.log('no roomId', data.type);

    return;
  }

  if (GameRoomsModel.rooms[data.roomId]) {
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
    }
  }
}