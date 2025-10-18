import GameRoomManager from "../games/game-room-manager.mjs";
import Games from "../models/games.mjs";
import {handleBaxieSimulationGameRoom} from "../games/BaxieSimulation.mjs";
import {GameModes} from "../../../games/common/baxie/baxie-simulation.mjs";
import NftModel from "../models/nft-model.mjs";
import {makeBaxie} from "../games/baxies/baxie-utilities.mjs";

const playerAddress = '0x1234567890abcdef1234567890abcdef12345678';
const enemyAddress = '0xabcdef1234567890abcdef1234567890abcdef12';
const playerWs = {
  send: (e) => {
    const data = JSON.parse(e);

    // data.type === 'endUseSkill' ||
    if (data.type === 'yourTurn') {
      setTimeout(() => startTesting(data, playerAddress), 200);
    } else {
      console.log('    playerWS: ', JSON.stringify(data));
    }
  },
  session: {
    wallet: {}
  }
};

const enemyWs = {
  send: (e) => {
    const data = JSON.parse(e);
// data.type === 'endUseSkill' ||
    if (data.type === 'yourTurn') {
      setTimeout(() => startTesting(data, enemyAddress), 200);
    } else {
      console.log('   enemyWS: ', JSON.stringify(data));
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
  { type: 'gameLoaded' },
  // { baxieId: '1250', skill: 'voltOverload', type: 'useSkill' },
  // { baxieId: '1251', skill: 'thornGuard', type: 'useSkill' }, // plant
  // { type: 'endTurn' },
];
const enemyTestingFlow = [
  { type: 'gameLoaded' },
  // { baxieId: '1269', skill: 'shadowStrike', type: 'useSkill' },
  // { type: 'endTurn' },
];

function startTesting(data, address) {
  if (playerAddress === address) {
    if (data.isYourTurn) {
      const currentTest = playerTestingFlow.shift();

      if (data.type !== 'initGame') {
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

      if (data.type !== 'initGame') {
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

async function buildSelectedBaxies(baxieIds) {
  const nftDocs = await Promise.all(
    baxieIds.map((baxieId) =>
      NftModel.findById({ nftTokenId: 'baxies', nftId: baxieId })
    )
  );
  const data = nftDocs.map((nftData) => makeBaxie(nftData));
  return data.map((e) => {
    return {
      tokenId: e.tokenId,
      skills: e.skills.map((s) => s.func),
      position: ['back', 'center', 'front'].slice(Math.random() * 3)[0],
    }
  });
}

async function init() {
  try {
    const room = await GameRoomManager.createRoom({
      address: playerAddress, game,
      vsCPU: false,
      gameMode: GameModes.autoBattler,
    });

    handleBaxieSimulationGameRoom(playerWs, {
      type: 'joinRoom',
      roomId: room.roomId,
      selectedBaxies: await buildSelectedBaxies(["1250", "1251", "1252"]),
    });

    setTimeout(async () => {
      if (GameRoomManager.joinRoom({roomId: room.roomId, address: enemyAddress})) {
        handleBaxieSimulationGameRoom(enemyWs, {
          type: 'joinRoom',
          roomId: room.roomId,
          selectedBaxies: await buildSelectedBaxies(["1269", "1271", "1265"]),
        });
        console.log(132)
      }

      setTimeout(async () => {
        handleBaxieSimulationGameRoom(playerWs, {
          type: 'gameLoaded',
          roomId: room.roomId,
        });
        handleBaxieSimulationGameRoom(enemyWs, {
          type: 'gameLoaded',
          roomId: room.roomId,
        });
      }, 300);
    }, 300);
  } catch (e) {
    console.error(e);
  }
}

init();