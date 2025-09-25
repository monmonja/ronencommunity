import NftModel from "../models/nft-model.mjs";
import Baxie from "./baxies/baxie.mjs";
import GameRoomsModel from "../models/game-rooms-model.mjs";

async function handleJoinRoom(ws, data) {
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

      GameRoomsModel.rooms[data.roomId].players[i].baxies = nftDocs.map(nft => new Baxie(nft));
    }
  }


  // start game when 2 players have joined
  if (currentRoom.players.length === 2) {
    currentRoom.turnIndex = 0;
    // randomised player start
    const playerTurn  = currentRoom.players[Math.floor(Math.random() * currentRoom.players.length)];
    currentRoom.playerTurn = playerTurn.address;
    currentRoom.selectedBaxie = playerTurn.baxies[Math.floor(Math.random() * playerTurn.baxies.length)];

    currentRoom.players.forEach((player, i) =>{
      if (player.ws) {
        const enemy = currentRoom.players.filter((playerI) => player.address !== playerI.address)[0];

        try {
          player.ws.send(JSON.stringify({
            type: 'StartGame',
            roomId: data.roomId,
            isYourTurn: currentRoom.playerTurn === player.address,
            selectedBaxie: currentRoom.selectedBaxie,
            turnIndex: currentRoom.turnIndex,
            message: 'Both players have joined. Starting game...',
            player: player.baxies?.map((baxie) => baxie.getGameInfo()),
            enemy: enemy.baxies?.map((baxie) => baxie.getGameInfo()),
          }));
          player.ws.send(JSON.stringify({
            type: 'DeductEnergy',
            amount: 1,
          }));
        } catch (e) {
  console.log('ee', e)
        }
      }
    })
  }
}

function handleUseSkill(ws, data) {
  const currentRoom = GameRoomsModel.rooms[data.roomId];
  const userAddress = ws.session.wallet.address.toLowerCase();

  if (currentRoom.playerTurn !== userAddress) {
    console.log('Not your turn', currentRoom.playerTurn, userAddress);
    return ws.send(JSON.stringify({
      type: 'Error',
      message: 'Not your turn',
    }));
  }

  const player = currentRoom.players.filter((p) => p.address === userAddress)[0];
  const enemy = currentRoom.players.filter((p) => p.address !== userAddress)[0];

  if (!player || !enemy) {
    return ws.send(JSON.stringify({
      type: 'Error',
      message: 'Player or enemy not found',
    }));
  }

  currentRoom.selectedBaxie.useSkill(data.selectedSkill);
}

export function handleBaxieSimulationGameRoom(ws, data) {
  if (GameRoomsModel.rooms[data.roomId]) {
    if (data.type === 'joinRoom') {
      handleJoinRoom(ws, data);
    } else if (data.type === 'useSkill') {
      handleUseSkill(ws, data);
    }
  }
}