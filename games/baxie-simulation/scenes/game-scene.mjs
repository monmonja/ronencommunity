import * as Phaser from 'phaser';
import BaxieUi from "../../common/baxie/baxie-ui.mjs";
import {createButton} from "../../common/buttons.mjs";
import {GameModes} from "../../common/baxie/baxie-simulation.mjs";
import constants from "../../common/constants.mjs";

export default class GameScene extends Phaser.Scene {
  enemyTeam;
  playerTeam;
  isPlayerTurn;
  skillContainer;

  constructor() {
    super('GameScene');
    this.isPlayerTurn = true;
  }

  showEnemySkillIndicator({ baxieUI, skillName }) {
    let x = baxieUI.x - 90;
    if (x < 300) {
      x = baxieUI.x + baxieUI.width + 100;
    }
    let y = baxieUI.y + 20;

    const formatted = skillName.replace(/([a-z])([A-Z])/g, '$1 $2');

    // Create a container to hold the background and text
    const container = this.add.container(x, y);

    // Text
    const text = this.add.text(0, 0, formatted, {
      fontFamily: constants.fonts.troika,
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5);

    // Background rectangle based on text size
    const bg = this.add.rectangle(
      0,
      0,
      text.width + 16, // extra padding
      text.height + 8,
      0x000000,
      0.3 // alpha for semi-transparent black
    ).setOrigin(0.5);

    // Add background first, then text on top
    container.add([bg, text]);

    // Optional: float up and fade out
    this.tweens.add({
      targets: container,
      y: y,
      alpha: 0,
      duration: 3000,
      ease: 'EaseOut',
      onComplete: () => container.destroy()
    });
  }

  showDamage({ baxieUI, damage }) {
    let x = baxieUI.x;
    if (x < 300) {
      x = baxieUI.x + baxieUI.width;
    }
    let y = baxieUI.y + 20;

    // Create a container to hold the background and text
    const container = this.add.container(x, y);

    // Text
    const text = this.add.text(0, 0, `-${damage}`, {
      fontFamily: constants.fonts.troika,
      fontSize: '24px',
      color: '#ff0000',
      align: 'center',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5);
    text.setShadow(2, 2, "#222", 4, false, true);

    // Add background first, then text on top
    container.add(text);

    // Optional: float up and fade out
    this.tweens.add({
      targets: container,
      y: y - 30,
      alpha: 0,
      duration: 2000,
      ease: 'EaseOut',
      onComplete: () => container.destroy()
    });
  }

  showHeal({ baxieUI, heal }) {
    let x = baxieUI.x;
    if (x < 300) {
      x = baxieUI.x + baxieUI.width;
    }
    let y = baxieUI.y + 20;

    // Create a container to hold the background and text
    const container = this.add.container(x, y);

    // Text
    const text = this.add.text(0, 0, `+${heal}`, {
      fontFamily: constants.fonts.troika,
      fontSize: '24px',
      color: '#00ff00',
      align: 'center',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5);
    text.setShadow(2, 2, "#222", 4, false, true);


    // Add background first, then text on top
    container.add(text);

    // Optional: float up and fade out
    this.tweens.add({
      targets: container,
      y: y - 30,
      alpha: 0,
      duration: 2000,
      ease: 'EaseOut',
      onComplete: () => container.destroy()
    });
  }


  init(data) {
    this.ws = data.ws;
    this.roomId = data.roomId;
    console.log('data.player', data.player)
    this.playerTeam = data.player.map((baxieData, i) => new BaxieUi({
      scene: this,
      data: baxieData,
      roomId: this.roomId,
      x: baxieData.position === 'front' ? 370 : (baxieData.position === 'center' ? 300 : 230),
      y: 110 * i + 80,
      renderPosition: i,
      gameMode: data.gameMode,
    }));
    this.enemyTeam = data.enemy.map((baxieData, i) => new BaxieUi({
      scene: this,
      data: baxieData,
      roomId: this.roomId,
      // inverse for the enemy
      x: baxieData.position === 'front' ? 570: (baxieData.position === 'center' ? 630 : 700),
      y: 110 * i + 80,
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
        const baxieUI = this.children.getByName(`baxie-${data.baxieId}`);

        this.showEnemySkillIndicator({
          baxieUI,
          skillName: data.skill,
        })
        data.message.enemies?.forEach((enemyResult) => {
          const enemyUi = this.children.getByName(`baxie-${enemyResult.target}`);
          this.showDamage({
            baxieUI: enemyUi,
            damage: enemyResult.damage,
          })
        });
        data.message.allies?.forEach((allyResult) => {
          const allyUi = this.children.getByName(`baxie-${allyResult.target}`);

            console.log('allyUi', allyResult.target)
          if (allyUi && allyResult.heal) {
            this.showHeal({
              baxieUI: allyUi,
              heal: allyResult.heal,
            });
          }
        });
        console.log(data)
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
    this.add.image(0, 0, "battle-bg")
      .setDisplaySize(this.game.scale.width, this.game.scale.height)
      .setOrigin(0, 0);
    this.playerTeam.forEach((baxie) => baxie.preload());
    this.enemyTeam.forEach((baxie) => baxie.preload());
  }

  create() {
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

    this.skillContainer = this.add.container((this.game.scale.width / 2), 440);
    this.skillContainer.setName('skillContainer');
    this.playerContainer = this.add.container(50, 50);
    this.enemyContainer = this.add.container(740, 50);
    this.playerTeam.forEach((baxie, i) => {
      this.playerContainer.add(baxie.renderHPSP(i * 90));
      baxie.renderCharacter(this.skillContainer, true);
    });
    this.enemyTeam.forEach((baxie, i) => {
      this.enemyContainer.add(baxie.renderHPSP(i * 90, true));
      baxie.renderCharacter(this.skillContainer);
    });
    this.afterCreate();
  }

  afterCreate() {
    this.ws.send(JSON.stringify({
      type: 'gameLoaded',
      roomId: this.roomId,
      gameId: this.game.customConfig.gameId,
    }));
  }

}
