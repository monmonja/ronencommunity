import GameRoomsModel from "../models/game-rooms-model.mjs";
import Games from "../models/games.mjs";
import {handleBaxieSimulationGameRoom} from "../games/BaxieSimulation.mjs";

const playerAddress = '0x1234567890abcdef1234567890abcdef12345678';
const enemyAddress = '0xabcdef1234567890abcdef1234567890abcdef12';
const playerWs = {
  send: (e) => {
    const data = JSON.parse(e);
    if (data.type === 'StartGame') {
      setTimeout(() => gameStart(data, playerAddress), 200);
    }
  },
  session: {
    wallet: {}
  }
};

const enemyWs = {
  send: (e) => {
    const data = JSON.parse(e);

    if (data.type === 'StartGame') {
      setTimeout(() => gameStart(data, enemyAddress), 200);
    }
  },
  session: {
    wallet: {}
  }
};
const game = Games.getGame('baxie-simulation');

playerWs.session.wallet.address = playerAddress;
enemyWs.session.wallet.address = enemyAddress;

function gameStart(data, address) {
  if (playerAddress === address) {
    if (data.isYourTurn) {
      console.log('your turn');
      handleBaxieSimulationGameRoom(playerWs, {
        type: 'useSkill',
        roomId: data.roomId,
        selectedSkill: "electric bolt",
      });
    }
  } else if (enemyAddress === address) {
    if (data.isYourTurn) {
      console.log('enemy turn');
      handleBaxieSimulationGameRoom(enemyWs, {
        type: 'useSkill',
        roomId: data.roomId,
        selectedSkill: "fire",
      });
    }
  }
}

function init() {
  const roomId = GameRoomsModel.createRoom({address: playerAddress, game});
  handleBaxieSimulationGameRoom(playerWs, {
    type: 'joinRoom',
    roomId,
    selectedBaxies: ["1250"],
  });

  setTimeout(() => {
    if (GameRoomsModel.joinRoom({ roomId, address: enemyAddress })) {
      handleBaxieSimulationGameRoom(enemyWs, {
        type: 'joinRoom',
        roomId,
        selectedBaxies: ["1269"],
      });
    }
  }, 300);
}

init();