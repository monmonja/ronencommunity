import * as Phaser from 'phaser';
import BaxieUi from "../../common/baxie/baxie-ui.mjs";
import {createButton} from "../../common/buttons.mjs";
import {GameModes} from "../../common/baxie/baxie-simulation.mjs";

export default class GameScene extends Phaser.Scene {
  enemyTeam;
  playerTeam;
  isPlayerTurn;
  skillContainer;

  constructor() {
    super('GameScene');
    this.isPlayerTurn = true;
  }

  init(data) {
    this.ws = data.ws;
    this.roomId = data.roomId;
    this.playerTeam = data.player.map((baxieData, i) => new BaxieUi({
      scene: this,
      data: baxieData,
      roomId: this.roomId,
      x: 200,
      y: 120 * (i + 1),
      renderPosition: i,
      gameMode: data.gameMode,
    }));
    this.enemyTeam = data.enemy.map((baxieData, i) => new BaxieUi({
      scene: this,
      data: baxieData,
      roomId: this.roomId,
      x: 800,
      y: 120 * (i + 1),
      renderPosition: i,
      isEnemy: true,
      gameMode: data.gameMode,
    }));
    this.isYourTurn = data.gameMode === GameModes.skillCountdown ? true: data.isYourTurn;
    this.turnIndex = data.turnIndex;
    this.gameMode = data.gameMode;

    if (this.isYourTurn) {
      this.playerTeam.forEach((baxie) => {
        baxie.setYourTurn(true);
      });
    }
    this.ws.onclose = (message) => {
      console.log('ws closed', message);
    }
    this.ws.onerror = (message) => {
      console.log('ws onerror', message);
    }
    this.ws.onmessage = (message) => {
      const data = JSON.parse(message.data);

      if (data.type === 'gameOver') {
        console.log(data.message)
      } else if (data.type === 'endUseSkill') {
        console.log(data.message)
      } else if (data.type === 'yourTurn') {
        if (this.gameMode === GameModes.turnBasedSP) {
          this.yourTurnText.visible = true;
          this.yourTurnBtn.visible = true;
          this.playerTeam.forEach((baxie) => {
            baxie.setYourTurn(true);
          });
        }
      } else if (data.type === 'updateStats') {
        // {"type":"updateStats","player":[{"tokenId":"1250","hp":100,"stamina":48,"image":"https://metadata.ronen.network/0xb79f49ac669108426a69a26a6ca075a10c0cfe28_1250.png","skills":[{"func":"voltOverload","cost":40},{"func":"chargeUp","cost":30},{"func":"stormBreaker","cost":10}]},{"tokenId":"1251","hp":100,"stamina":87,"image":"https://metadata.ronen.network/0xb79f49ac669108426a69a26a6ca075a10c0cfe28_1251.png","skills":[{"func":"shadowStrike","cost":40},{"func":"cursedChains","cost":30},{"func":"soulFeast","cost":10}]},{"tokenId":"1252","hp":100,"stamina":78,"image":"https://metadata.ronen.network/0xb79f49ac669108426a69a26a6ca075a10c0cfe28_1252.png","skills":[{"func":"voltOverload","cost":40},{"func":"chargeUp","cost":30},{"func":"stormBreaker","cost":10}]}],"enemy":[{"tokenId":"1269","hp":100,"stamina":89,"image":"https://metadata.ronen.network/0xb79f49ac669108426a69a26a6ca075a10c0cfe28_1269.png","skills":[{"func":"shadowStrike","cost":40},{"func":"cursedChains","cost":30},{"func":"soulFeast","cost":10}]},{"tokenId":"1271","hp":100,"stamina":109,"image":"https://metadata.ronen.network/0xb79f49ac669108426a69a26a6ca075a10c0cfe28_1271.png","skills":[{"func":"shadowStrike","cost":40},{"func":"cursedChains","cost":30},{"func":"soulFeast","cost":10}]},{"tokenId":"1265","hp":100,"stamina":78,"image":"https://metadata.ronen.network/0xb79f49ac669108426a69a26a6ca075a10c0cfe28_1265.png","skills":[{"func":"shadowStrike","cost":40},{"func":"cursedChains","cost":30},{"func":"soulFeast","cost":10}]}]}
        this.playerTeam.forEach((baxie) => {
          const updatedBaxie = data.player.filter((b) => b.tokenId === baxie.tokenId)[0];
          if (updatedBaxie) {
            baxie.updateStats(updatedBaxie);
          }
        });
        this.enemyTeam.forEach((baxie) => {
          const updatedBaxie = data.enemy.filter((b) => b.tokenId === baxie.tokenId)[0];
          if (updatedBaxie) {
            baxie.updateStats(updatedBaxie);
          }
        });
      }
    }
  }

  preload() {
    this.playerTeam.forEach((baxie) => baxie.preload());
    this.enemyTeam.forEach((baxie) => baxie.preload());
  }

  create() {
    this.add.image(0, 0, "battle-bg")
      .setOrigin(0, 0);

    this.yourTurnText = this.add.text(100, 50, "Your Turn", {font: "32px Arial", fill: "#ffffff"});
    this.yourTurnBtn = createButton({
        scene: this,
        x: 600,
        y: 400,
        width: 60,
        height: 60,
        text: "End turn",
        onPointerDown: () => {
          this.yourTurnText.visible = false;
          this.yourTurnBtn.visible = false;
          this.playerTeam.forEach((baxie) => {
            baxie.clearSkills(this.skillContainer);
            baxie.setYourTurn(false);
          });

          this.ws.send(JSON.stringify({
            type: 'endTurn',
            roomId: this.roomId,
            gameId: this.game.customConfig.gameId,
          }));
        }
      })

    if (!this.isYourTurn) {
      this.yourTurnText.visible = false;
      this.yourTurnBtn.visible = false;
    }

    if (this.gameMode === GameModes.skillCountdown) {
      this.yourTurnText.visible = false;
      this.yourTurnBtn.visible = false;
    }

    this.playerTeam.forEach((baxie) => {
      baxie.enemies = this.enemyTeam ?? [];
    });
    this.enemyTeam.forEach((baxie) => {
      baxie.enemies = this.playerTeam ?? [];
    });

    this.skillContainer = this.add.container(300, 400);
    this.playerTeam.forEach((baxie) => {
      baxie.renderCharacter(this.skillContainer, true);
    });
    this.enemyTeam.forEach((baxie) => baxie.renderCharacter(this.skillContainer));
  }


}
