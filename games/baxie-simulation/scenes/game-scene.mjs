import * as Phaser from 'phaser';
import BaxieUi from "../../common/baxie/baxie-ui.mjs";
import {createButton} from "../../common/buttons.mjs";
import {GameModes} from "../../common/baxie/baxie-simulation.mjs";
import constants from "../../common/constants.mjs";
import BackgroundRect from "../../common/ui/background-rect.mjs";
import {formatSkillName} from "../../common/utils/baxie.mjs";
import {EFFECTS} from "../../../src/backend/games/baxies/effects.mjs";

export default class GameScene extends Phaser.Scene {
  enemyTeam;
  playerTeam;
  isPlayerTurn;
  skillContainer;
  status = 'loading';

  constructor() {
    super('GameScene');
    this.isPlayerTurn = true;
  }

  shakeBaxieIndicator({ baxieUI }) {
    // === SHAKE EFFECT on the attacking Baxie ===
    this.tweens.add({
      targets: baxieUI,
      x: baxieUI.x + 5,
      duration: 50,
      yoyo: true,
      repeat: 3, // number of shakes
      ease: 'Sine.easeInOut'
    });
  }

  showSimulationText() {
    let x = this.game.scale.width - 20;
    let y = this.game.scale.height  - 60;

    // Create a container to hold the background and text
    const container = this.add.container(x, y);

    // Text
    const text = this.add.text(0, 0, 'This is a simulation tool.\nNot the real game!', {
      fontFamily: constants.fonts.troika,
      fontSize: '24px',
      color: '#ff0000',
      align: 'center',
      padding: { x: 8, y: 4 },
      wordWrap: { width: 360, useAdvancedWrap: true },
    }).setOrigin(1, 0);
    text.setShadow(2, 2, "#222", 4, false, true);

    // Add background first, then text on top
    container.add(text);
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
      duration: 4000,
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
      duration: 4000,
      ease: 'EaseOut',
      onComplete: () => container.destroy()
    });
  }

  drawTurn(index) {
    // Create a container to hold the background and text
    const container = this.add.container(this.game.scale.width / 2, 20);
    const hpBackgroundRect = new BackgroundRect(this, {
      x: -(80 / 2),
      y: 0,
      width: 80,
      height: 55,
      // height: 90,
      radius: 0,
      innerBaseColor: 0x8b4e24,
      topBgColor: 0xae8463,
      bottomBgColor: 0x67341b
    });
    container.add(hpBackgroundRect);

    // Text
    this.turnText = this.add.text(0, 8, `TURN\n${index}`, {
      fontFamily: constants.fonts.troika,
      fontSize: '20px',
      color: '#00ff00',
      align: 'center',
    }).setOrigin(0.5, 0);
    this.turnText.setShadow(2, 2, "#222", 4, false, true);


    // Add background first, then text on top
    container.add(this.turnText);
  }

  showLoading() {
    this.loadingContainer = this.add.container(this.game.scale.width / 2, this.game.scale.height / 2);
    this.loadingContainer.setDepth(200);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRoundedRect(-250, -40, 500, 80, 10);
    this.loadingContainer.add(bg);

    const loadingText = this.add.text(0, 0, 'Loading game and resources\nwaiting for other player', {
      fontFamily: constants.fonts.troika,
      fontSize: '32px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);
    loadingText.setShadow(2, 2, "#222", 4, false, true);
    this.loadingContainer.add(loadingText);
  }


  init(data) {
    this.ws = data.ws;
    this.roomId = data.roomId;
    this.selectedBaxies = data.selectedBaxies;

    this.playerTeam = data.player.map((baxieData, i) => new BaxieUi({
      scene: this,
      data: baxieData,
      roomId: this.roomId,
      x: baxieData.position === 'front' ? 360 : (baxieData.position === 'center' ? 280 : 230),
      y: 100 * i + 100,
      renderPosition: i,
      gameMode: data.gameMode,
    }));
    this.enemyTeam = data.enemy.map((baxieData, i) => new BaxieUi({
      scene: this,
      data: baxieData,
      roomId: this.roomId,
      // inverse for the enemy
      x: baxieData.position === 'front' ? 590: (baxieData.position === 'center' ? 630 : 680),
      y: 100 * i + 100,
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
        setTimeout(() => {
          this.scene.start('EndGameScene', {
            youWin: data.winnerAddress === data.yourAddress,
            winnerAddress: data.winnerAddress,
            selectedBaxies: this.selectedBaxies,
          });
        }, 1000);
      } else if (data.type === 'abandoned') {
        setTimeout(() => {
          this.scene.start('EndGameScene', {
            youWin: data.winnerAddress === data.yourAddress,
            isSpectator: data.isSpectator,
            abandonedBy: data.abandonedBy,
            winnerAddress: data.winnerAddress,
            selectedBaxies: this.selectedBaxies,
          });
        }, 1000);
      } else if (data.type === 'startBattle') {
        this.loadingContainer.visible = false;
        this.loggerScene.addLog('Start Battle');
        this.status = 'playing';
        this.drawBaxieTurnOrder(data.baxieTurnOrder);
        this.highlightActiveBaxieTurnByIndex(data.baxieTurnIndex);
        this.drawTurn(data.turnIndex + 1);
      } else if (data.type === 'newTurn') {
        this.turnText.text = `TURN\n${data.turnIndex + 1}`;
      } else if (data.type === 'endUseSkill') {
        /**
         * @type {BaxieUi}
         */
        const baxieUI = this.children.getByName(`baxie-${data.baxieId}`);

        if (baxieUI) {
          this.highlightActiveBaxieTurnByIndex(data.baxieTurnIndex);
          baxieUI.renderSkills(this.skillContainer);
          this.sounds[data.baxieType].play({ volume: 0.3 });
          console.log('baxieUI.attributes', )

          setTimeout(() => {
            this.loggerScene.addLog(`#${data.baxieId} uses ${formatSkillName(data.skill, ' ')}`);
            this.shakeBaxieIndicator({
              baxieUI,
            });
            console.log('render skils')

            baxieUI.highlightUsedSkill(this.skillContainer, data.skill);

            data.message.enemies?.forEach((enemyResult) => {
              const enemyUi = this.children.getByName(`baxie-${enemyResult.target}`);

              if (enemyUi) {
                this.showDamage({
                  baxieUI: enemyUi,
                  damage: enemyResult.damage,
                });
              } else {
                console.log(`baxie-${enemyResult.target} not found in show damage`)
              }
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
          }, 500);
        } else {
          console.log(`baxie-${enemyResult.target} not found in show damage indicator`)
        }
        console.log(data)
      } else if (data.type === 'endPhysicalAttack') {
        /**
         * @type {BaxieUi}
         */
        const baxieUI = this.children.getByName(`baxie-${data.baxieId}`);

        if (baxieUI) {
          this.loggerScene.addLog(`#${data.baxieId} uses Physical Attack`);
          baxieUI.renderSkills(this.skillContainer);
          this.highlightActiveBaxieTurnByIndex(data.baxieTurnIndex);
          this.sounds.hit.play({ volume: 0.3 });

          setTimeout(() => {
            this.shakeBaxieIndicator({
              baxieUI,
            });
            console.log('do physical attack')

            data.message.enemies?.forEach((enemyResult) => {
              const enemyUi = this.children.getByName(`baxie-${enemyResult.target}`);

              if (enemyResult.skill === EFFECTS.reflect) {
                this.loggerScene.addLog(`#${enemyResult.reflectFrom} reflected Physical Attack to #${enemyResult.target}`);
              }

              if (enemyUi) {
                this.showDamage({
                  baxieUI: enemyUi,
                  damage: enemyResult.damage,
                });
              } else {
                console.log(`baxie-${enemyResult.target} not found in show damage`)
              }
            });
          }, 500);
        }
      }  else if (data.type === 'endCannotAttack') {
        /**
         * @type {BaxieUi}
         */
        const baxieUI = this.children.getByName(`baxie-${data.baxieId}`);

        if (baxieUI) {
          this.loggerScene.addLog(data.message);
          baxieUI.renderSkills(this.skillContainer);
          this.highlightActiveBaxieTurnByIndex(data.baxieTurnIndex);

          setTimeout(() => {
            this.shakeBaxieIndicator({
              baxieUI,
            });
          }, 500);
        }
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
        this.playerTeam.forEach((baxie, i) => {
          const updatedBaxie = data.player.filter((b) => b.tokenId === baxie.tokenId)[0];
          if (updatedBaxie) {
            baxie.updateStats(updatedBaxie);
            baxie.renderEffectsUI(this.playerContainer, updatedBaxie, 53, (i * 110) + 62);

            if (updatedBaxie.hp === 0 || updatedBaxie.hp === null) {
              if (!baxie.logDeadStatus) {
                this.loggerScene.addLog(`#${baxie.tokenId} is dead!`);
                baxie.logDeadStatus = true;
              }
            }
          }
        });
        this.enemyTeam.forEach((baxie, i) => {
          const updatedBaxie = data.enemy.filter((b) => b.tokenId === baxie.tokenId)[0];
          if (updatedBaxie) {
            baxie.updateStats(updatedBaxie);
            baxie.renderEffectsUI(this.enemyContainer, updatedBaxie, 53, (i * 110) + 62);

            if (updatedBaxie.hp === 0 || updatedBaxie.hp === null) {
              if (!baxie.logDeadStatus) {
                this.loggerScene.addLog(`#${baxie.tokenId} is dead!`);
                baxie.logDeadStatus = true;
              }
            }
          }
        });
      }
    }
  }

  preload() {
    this.add.image(0, 0, "battle-bg")
      .setDisplaySize(this.game.scale.width, this.game.scale.height)
      .setOrigin(0, 0);
    this.showLoading();
    this.playerTeam.forEach((baxie) => baxie.preload());
    this.enemyTeam.forEach((baxie) => baxie.preload());
  }

  // Draw all Baxies based on the turn order
  drawBaxieTurnOrder(baxieTurnOrder) {
    const baxieBaseY = 47;
    const baxieLeftStartX = 310;
    const baxieRightStartX = 600;
    const baxieSpacingX = 60;

    // Clear any existing Baxie turn visuals
    if (this.baxieTurnContainers) {
      this.baxieTurnContainers.forEach(baxieContainer => baxieContainer.destroy());
    }
    this.baxieTurnContainers = [];

    baxieTurnOrder.forEach((baxieTurnData, baxieTurnIndex) => {
      const isLeftSide = baxieTurnIndex < 3;
      const baxieX = isLeftSide
        ? baxieLeftStartX + (baxieTurnIndex * baxieSpacingX)
        : baxieRightStartX + ((baxieTurnIndex - 3) * baxieSpacingX);
      const baxieY = baxieBaseY;

      // Main container for this Baxie
      const baxieTurnContainer = this.add.container(baxieX, baxieY);

      // Baxie sprite (replace with actual texture key)
      const maskSize = 50;
      const baxieTurnSprite = this.add.image(0, 10, `image-${baxieTurnData.tokenId}`)
        .setOrigin(0.5);
      baxieTurnSprite.texture.setFilter(Phaser.Textures.NEAREST);
      const scaleX = 100 / baxieTurnSprite.width;
      const scaleY = 100 / baxieTurnSprite.height;
      const scale = Math.min(scaleX, scaleY); // ensures it fits inside width & height

      baxieTurnSprite.setScale(scale);

      // Create graphics for mask
      const maskShape = this.make.graphics({ x: baxieX, y: baxieY, add: false });
      maskShape.fillStyle(0xffffff);

      // Draw circle for mask
      maskShape.fillRoundedRect(-maskSize / 2, -maskSize / 2, maskSize, maskSize, {
        tl: 4, // top-left
        tr: 4, // top-right
        bl: 4,  // bottom-left
        br: 4   // bottom-right
      });

// Apply mask
      const mask = maskShape.createGeometryMask();
      baxieTurnSprite.setMask(mask);
      // baxieTurnContainer.add(maskShape);
      baxieTurnContainer.add(baxieTurnSprite);


      // Highlight rectangle (initially hidden)
      const baxieTurnHighlight = this.add.rectangle(
        0, 0,
        50,
        50,
        0xffff00,
        0.3
      )
        .setStrokeStyle(4, 0xffff00)
        .setVisible(false);

      // Add highlight and sprite to container
      baxieTurnContainer.add([baxieTurnHighlight]);

      // Attach references for easy use later
      baxieTurnContainer.baxieTurnData = baxieTurnData;
      baxieTurnContainer.baxieTurnSprite = baxieTurnSprite;
      baxieTurnContainer.baxieTurnHighlight = baxieTurnHighlight;

      this.baxieTurnContainers.push(baxieTurnContainer);
    });
  }

  /**
   * Highlights the Baxie currently taking its turn
   * using its index in the baxieTurnContainers array.
   */
  highlightActiveBaxieTurnByIndex(activeBaxieTurnIndex) {
    this.baxieTurnContainers.forEach((baxieTurnContainer, index) => {
      const isActive = index === activeBaxieTurnIndex;

      baxieTurnContainer.baxieTurnHighlight.setVisible(isActive);

      // Tween opacity for dimming effect
      this.tweens.add({
        targets: baxieTurnContainer,
        alpha: isActive ? 1 : 0.3,
        duration: 200,
        ease: 'Sine.easeInOut'
      });

    });
  }


  create() {
    this.scene.launch('LoggerScene');
    this.scene.launch('OverlayScene');

    this.sounds = {
      hit: this.sound.add('sfx-hit'),
      buff: this.sound.add('sfx-buff'),
      crit: this.sound.add('sfx-crit'),
      electric: this.sound.add('sfx-lightning-magic'),
      aqua: this.sound.add('sfx-water-magic'),
      plant: this.sound.add('sfx-plant-magic'),
      fairy: this.sound.add('sfx-healing-magic'),
      fire: this.sound.add('sfx-fire-magic'),
      demon: this.sound.add('sfx-dark-magic')
    };

    this.loggerScene = this.scene.get('LoggerScene');

    this.yourTurnText = this.add.text(100, 50, "Your Turn", {font: "32px Arial", fill: "#ffffff"});
    this.yourTurnBtn = createButton({
        scene: this,
        x: 600,
        y: 400,
        width: 120,
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

    if ([GameModes.skillCountdown, GameModes.autoBattler].includes(this.gameMode)) {
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
      this.playerContainer.add(baxie.renderHPSP(i * 110));
      baxie.renderCharacter(this.skillContainer, true);
    });
    this.enemyTeam.forEach((baxie, i) => {
      this.enemyContainer.add(baxie.renderHPSP(i * 110, true));
      baxie.renderCharacter(this.skillContainer);
    });

    this.showSimulationText();
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
