import { GameRoomsModel } from "../models/game-rooms-model.mjs";
import Games from "../models/games.mjs";
import {handleBaxieSimulationGameRoom} from "../games/BaxieSimulation.mjs";

const playerAddress = '0x1234567890abcdef1234567890abcdef12345678';
const enemyAddress = '0xabcdef1234567890abcdef1234567890abcdef12';
const playerWs = {
  send: (e) => {
    const data = JSON.parse(e);

    if (data.type === 'startGame' || data.type === 'endUseSkill' || data.type === 'yourTurn') {
      setTimeout(() => startTesting(data, playerAddress), 200);
    } else {
      console.log('playerWS', JSON.stringify(data));
    }
  },
  session: {
    wallet: {}
  }
};

const enemyWs = {
  send: (e) => {
    const data = JSON.parse(e);

    if (data.type === 'startGame' || data.type === 'endUseSkill' || data.type === 'yourTurn') {
      setTimeout(() => startTesting(data, enemyAddress), 200);
    } else {
      console.log(JSON.stringify(data));
    }
  },
  session: {
    wallet: {}
  }
};
const game = Games.getGame('baxie-simulation');

playerWs.session.wallet.address = playerAddress;
enemyWs.session.wallet.address = enemyAddress;

const playerTestingFlow = [
  { baxieId: '1250', skill: 'voltOverload', type: 'useSkill' },
  { baxieId: '1251', skill: 'shadowStrike', type: 'useSkill' },
  { type: 'endTurn' },
];
const enemyTestingFlow = [
  { baxieId: '1269', skill: 'shadowStrike', type: 'useSkill' },
  { type: 'endTurn' },
];

function startTesting(data, address) {
  if (playerAddress === address) {
    if (data.isYourTurn) {
      const currentTest = playerTestingFlow.shift();

      if (data.type !== 'startGame') {
        console.log(`    ${JSON.stringify(data)}`);
      }
      console.log(`\nplayer ${JSON.stringify(currentTest)}`);

      handleBaxieSimulationGameRoom(playerWs, {
        type: currentTest.type,
        selectedBaxieId: currentTest.baxieId,
        roomId: data.roomId,
        selectedSkill: currentTest.skill,
      });
    } else {
      console.log('player waiting for your turn', data.type);
    }
  } else if (enemyAddress === address) {
    if (data.isYourTurn) {
      const currentTest = enemyTestingFlow.shift();

      if (data.type !== 'startGame') {
        console.log(`    ${JSON.stringify(data)}`);
      }

      console.log(`\nenemy ${JSON.stringify(currentTest)}`);
      handleBaxieSimulationGameRoom(enemyWs, {
        type: currentTest.type,
        selectedBaxieId: currentTest.baxieId,
        roomId: data.roomId,
        selectedSkill: currentTest.skill,
      });
    } else {
      console.log('enemy waiting for your turn', data.type);
    }
  }
}

function init() {
  const roomId = GameRoomsModel.createRoom({address: playerAddress, game});
  handleBaxieSimulationGameRoom(playerWs, {
    type: 'joinRoom',
    roomId,
    selectedBaxies: ["1250", "1251", "1252"],
  });

  setTimeout(() => {
    if (GameRoomsModel.joinRoom({ roomId, address: enemyAddress })) {
      handleBaxieSimulationGameRoom(enemyWs, {
        type: 'joinRoom',
        roomId,
        selectedBaxies: ["1269", "1271", "1265"],
      });
    }
  }, 300);
}

init();