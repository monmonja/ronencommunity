// @ts-ignore
import Phaser from 'phaser';
import {interactiveBoundsChecker} from "../rotate-utils.mjs";
import {GameModes} from "./baxie-simulation.mjs";
import ProgressBar from "../ui/progress-bar.mjs";
import BackgroundRect from "../ui/background-rect.mjs";
import constants from "../constants.mjs";
import {formatSkillName} from "../utils/baxie.mjs";

export default class BaxieUi extends Phaser.GameObjects.Container {
  attributes;
  enemies;

  currentHP = 0;
  effects = [];
  skills = [];
  width= 100;
  height= 120;

  /**
   * @todo pass click function for selection, pass skill click function
   */
  constructor({ scene, data, roomId, x, y, isEnemy = false, gameMode } = {}) {
    super(scene, x, y); // Container will be positioned at (x,y)
    this.setName(`baxie-${data.tokenId}`);
    this.tokenId = data.tokenId;
    this.image = data.image;
    this.skills = data.skills;
    this.currentSP = data.sp;
    this.maxSP = data.maxSP;
    this.currentHP = data.hp;
    this.maxHP = data.maxHP;
    this.gameMode = gameMode;
    this.isEnemy = isEnemy;
    this.roomId = roomId;
    this.isYourTurn = false;
    this.logDeadStatus = false;
  }

  startSkillCountdown(x, y, radius, duration) {
    const countdown = this.scene.add.graphics();
    countdown.setName('countdown');

    const startTime = this.scene.time.now;

    const self = this;

    this.scene.events.on('update', updatePie, this);

    function updatePie(time, delta) {
      const elapsed = time - startTime;
      const remaining = Math.max(0, duration - elapsed);
      const progress = 1 - remaining / duration; // 0 → 1

      countdown.clear();

      // Draw base circle (transparent overlay if you like)
      countdown.fillStyle(0x000000, 0);
      countdown.fillCircle(x, y, radius);

      // Draw the filling pie arc
      countdown.beginPath();
      countdown.moveTo(x, y);
      countdown.fillStyle(0x000000, 0.2); // fill color for the pie (black overlay)
      countdown.arc(
        x,
        y,
        radius,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * progress,
        false
      );
      countdown.closePath();
      countdown.fillPath();

      // When finished
      if (remaining <= 0) {
        countdown.destroy();
        self.scene.events.off('update', updatePie, self);
      }
    }

    return countdown;
  }

  drawSkillSPRequirement(x, y, radius, currentSP, skillCost) {
    console.log('currentSP', currentSP, skillCost)
    // If we already can afford it, do nothing
    if (currentSP >= skillCost) {
      return null;
    }

    const gfx = this.scene.add.graphics();
    gfx.setName('sp-requirement');

    const ratio = currentSP / skillCost; // 0 → 1

    gfx.clear();

    // Transparent base
    gfx.fillStyle(0x000000, 0);
    gfx.fillCircle(x, y, radius);

    // Draw the missing SP pie
    gfx.beginPath();
    gfx.moveTo(x, y);
    gfx.fillStyle(0x000000, 0.4);       // red-ish overlay for missing SP
    gfx.arc(
      x,
      y,
      radius,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * (1 - ratio),
      false
    );
    gfx.closePath();
    gfx.fillPath();

    return gfx;
  }

  renderSkills(container) {
    let baxieSkillContainer = container.getByName(this.tokenId);
    const radius = 36; // since width/height = 100px total

    if (this.currentHP === 0) {
      return;
    }

    container.iterate((child) => {
      if (child === baxieSkillContainer) {
        child.setVisible(true);
        child.list.forEach((item) => {
          const redraw = () => {
            this.skills.forEach((skill, index) => {
              if (item.name === `skill-${skill.func}`) {
                console.log('Redrawing SP requirement for', skill.func);
                const skillIndicator = this.drawSkillSPRequirement(0, 0, radius + 10, this.currentSP, skill.cost);

                if (skillIndicator) {
                  item.add(skillIndicator);
                }
              }
            });
          }

          if (item.getByName('sp-requirement')) {
            item.getByName('sp-requirement').destroy();
            redraw();
          } else {
            console.log('no sp-requirement found for', item.name);
            redraw();
          }
        });
      } else {
        child.setVisible(false);
      }
    });

    if (baxieSkillContainer) {
      return;
    }

    baxieSkillContainer = this.scene.add.container(0, 0);
    baxieSkillContainer.setName(this.tokenId);
    container.add(baxieSkillContainer);


    const y = radius;
    const skillWidth = radius * 2;
    const spacing = 20;
    const totalWidth = this.skills.length * skillWidth + (this.skills.length - 1) * spacing;
    const startX = -totalWidth / 2 + radius;

    this.skills.forEach((skill, index) => {
      const x = startX + index * (skillWidth + spacing);

      const skillContainer = this.scene.add.container(x, y);
      skillContainer.setName(`skill-${skill.func}`);

      const image = this.scene.add.image(0, 0, skill.image)
        .setScale(0.09)
        .setOrigin(0.5);
      skillContainer.add(image);

      skillContainer
        .setInteractive(
          new Phaser.Geom.Rectangle(-radius, -radius, radius * 2, radius * 2),
          interactiveBoundsChecker,
        )
        .on("pointerover", () => {
          const bounds = image.getBounds();
          this.scene.game.events.emit('show-overlay', {
            text: skill.description,
            x: bounds.x - 120,
            y: bounds.y + 90,
          });

          this.scene.input.manager.canvas.style.cursor = "pointer";
        })
        .on("pointerout", () => {
          this.scene.game.events.emit('hide-overlay');
          this.scene.input.manager.canvas.style.cursor = "default";
        })
        .on('pointerdown', () => {
          if (this.gameMode === GameModes.skillCountdown) {
            if (skillContainer.getByName('countdown')) {
              return;
            }

            skillContainer.add(this.startSkillCountdown(0, 0, radius, 1000 * skill.cooldown));
          }

          this.scene.ws.send(
            JSON.stringify({
              type: "useSkill",
              selectedBaxieId: this.tokenId,
              roomId: this.roomId,
              selectedSkill: skill.func,
              gameId: this.scene.game.customConfig.gameId,
            })
          );
        });

      const skillIndicator = this.drawSkillSPRequirement(0, 0, radius + 10, this.currentSP, skill.cost);

      if (skillIndicator) {
        skillContainer.add(skillIndicator);
      } else {
        console.log('No SP indicator needed for', skill.func ,this.currentSP, skill.cost);
      }

      baxieSkillContainer.add(skillContainer);
    });
  }

  highlightUsedSkill(baxieSkillContainer, skillName) {
    const skillContainer = baxieSkillContainer.getByName(this.tokenId).getByName(`skill-${skillName}`);
    console.log('highlightUsedSkill', `skill-${skillName}`)
    if (!skillContainer) return;

    const image = skillContainer.list.find(child => child instanceof Phaser.GameObjects.Image);
    if (!image) {
      console.warn(`No image found inside skill-${skillName}`);
      return;
    }

    // Clear any old tween first
    this.scene.tweens.killTweensOf(image);

    // Highlight effect
    image.setTint(0xffff00);
    this.scene.tweens.add({
      targets: image,
      scale: { from: 0.09 * 1.2, to: 0.09 }, // your original scale is 0.09
      duration: 700,
      onComplete: () => {
        image.clearTint();
        image.setScale(0.09);
      },
    });
  }


  preload() {
    this.scene.load.image(`image-${this.tokenId}`, this.image);
  }

  setYourTurn(yourTurn) {
    this.isYourTurn = yourTurn;
  }
  clearSkills(skillContainer) {
    skillContainer.removeAll(true);
  }

  renderHPSP(yPos, isEnemy = false) {
    const hpSpContainer = this.scene.add.container(0, yPos);

    // Just a simple circle as a placeholder body
    const graphics = this.scene.add.graphics();
    const radius = 40;
    const x = isEnemy ? 210 : radius / 2;
    const y = radius / 2;

    graphics.fillStyle(0x000000, 0.3);
    graphics.fillCircle(x, y, radius - (2 + 6 + 2) / 2);

    // Draw outer black border (2px)
    graphics.lineStyle(4, 0x000000, 1);
    graphics.strokeCircle(x, y, radius);

// Draw yellow border (6px)
    graphics.lineStyle(6, 0xffff00, 1);
    graphics.strokeCircle(x, y, radius - 4);

// Draw inner black border (2px)
    graphics.lineStyle(2, 0x000000, 1);
    graphics.strokeCircle(x, y, radius - 4 - 6);

    const image = this.scene.make.image({
      x: isEnemy ? 210: 18,
      y: -15,
      key: `image-${this.tokenId}`,
      add: false,
    });
    image.setScale(0.035);
    image.setOrigin(0.5, 0);

    const startHpBarX = 55;

    const hpBackgroundRect = new BackgroundRect(this.scene, {
      x: startHpBarX,
      y: -2,
      width: 120,
      height: [GameModes.skillCountdown, GameModes.autoBattler].includes(this.gameMode) ? 45 : 90,
      // height: [GameModes.skillCountdown].includes(this.gameMode) ? 45 : 90,
      // height: 90,
      radius: 0,
      innerBaseColor: 0x8b4e24,
      topBgColor: 0xae8463,
      bottomBgColor: 0x67341b
    });
    hpSpContainer.add(hpBackgroundRect);
    hpSpContainer.add(graphics);
    hpSpContainer.add(image);

    this.hpBar = new ProgressBar(this.scene, {
      x: 44,
      y: 18,
      width: 60,
      height: 5,
      max: this.maxHP,
      current: this.maxHP,
      backgroundColor: 0x444444,
      barColor: 0x00ff00,
      borderColor: 0x000000
    });
    hpBackgroundRect.add(this.hpBar);

    this.hpText = this.scene.add.text(72, 27, `${this.currentHP}/${this.maxHP}`, {
      fontSize: "14px",
      fontFamily: constants.fonts.troika,
      color: "#ffffff",
    }).setOrigin(0.5, 0);
    hpBackgroundRect.add(this.hpText);

    const hpLabel = this.scene.add.text(12, 10, 'HP', {
      fontSize: "20px",
      fontFamily: constants.fonts.troika,
      color: "#ffffff",
    }).setOrigin(0);
    hpBackgroundRect.add(hpLabel);

    this.spBar = new ProgressBar(this.scene, {
      x: 44,
      y: 58,
      width: 60,
      height: 5,
      max: this.maxHP,
      current: this.maxHP,
      backgroundColor: 0x444444,
      barColor: 0x00ff00,
      borderColor: 0x000000
    });
    hpBackgroundRect.add(this.spBar);

    this.spText = this.scene.add.text(72, 67, `${this.currentSP}/${this.maxSP}`, {
      fontSize: "14px",
      fontFamily: constants.fonts.troika,
      color: "#ffffff",
    }).setOrigin(0.5, 0);
    hpBackgroundRect.add(this.spText);

    const spLabel = this.scene.add.text(12, 50, 'SP', {
      fontSize: "20px",
      fontFamily: constants.fonts.troika,
      color: "#ffffff",
    }).setOrigin(0);
    hpBackgroundRect.add(spLabel);

    if ([GameModes.skillCountdown, GameModes.autoBattler].includes(this.gameMode)) {
    // if ([GameModes.skillCountdown].includes(this.gameMode)) {
      this.spBar.visible = false;
      this.spText.visible = false;
      spLabel.visible = false;
    }

    return hpSpContainer;
  }

  renderEffectsUI(container, updatedBaxie, x, y) {
    const key = `effects-container-${updatedBaxie.tokenId}`;

    if (container.getByName(key)) {
      container.getByName(key).destroy();
    }

    const effectsContainer = this.scene.add.container(x, y);
    effectsContainer.setName(key);

    const iconSize = 32;
    const spacing = 16;

    updatedBaxie.effects.forEach((effect, index) => {
      const itemX = (iconSize + spacing) * index;

      // background graphic frame
      const bg = this.scene.add.graphics();
      bg.fillStyle(0x000000, 0.4);
      bg.fillRoundedRect(0, 0, iconSize + 12, iconSize, 6);

      // icon
      console.log(`effects-${effect.type}`)
      const icon = this.scene.add.image(0, 0, `effects-${effect.type}`)
        .setOrigin(0, 0)
        .setDisplaySize(iconSize, iconSize);

      // turnsLeft text
      const turnsText = this.scene.add.text(
        iconSize - 2,
        iconSize / 2 - 8,
        effect.turnsLeft.toString(),
        {
          fontFamily: constants.fonts.Newsreader,
          fontSize: '14px',
          color: '#ffffff',
        }
      );

      // group into a mini container
      const itemContainer = this.scene.add.container(itemX, 0);
      itemContainer.add([bg, icon, turnsText]);
      effectsContainer.add(itemContainer);
    });

    container.add(effectsContainer);
  }


  renderCharacter(skillContainer, hasEvents = false) {
    this.skillContainer = skillContainer;
    // Clear any existing children
    this.removeAll(true);

    // Just a simple circle as a placeholder body
    // const graphics = this.scene.add.graphics();
    // graphics.fillStyle(0xff4444, 0.1);
    // graphics.fillRoundedRect(0, 0, this.width, this.height, 3);

    const image = this.scene.make.image({
      x: this.width / 2,
      y: -10,
      key: `image-${this.tokenId}`,
      add: false,
    });
    image.setScale(0.06);
    image.setOrigin(0.5, 0);
    image.texture.setFilter(Phaser.Textures.NEAREST);


    const shadow = this.scene.make.image({
      x: this.width / 2,
      y: 80,
      key: 'shadow',
      add: false,
    });
    shadow.setScale(0.09);
    shadow.setOrigin(0.5, 0)
    this.add(shadow);
    this.add(image);

    // Add a text label for debugging
    const nameText = this.scene.add.text(0, 0, this.tokenId || "BaxieUi", {
      fontSize: "20px",
      color: "#ffffff",
    }).setOrigin(0);
    this.add(nameText);


    // Add them to the container
    // this.add([graphics,  ]);

    if (hasEvents) {
      this.setSize(this.width, this.height);
      this.setInteractive(
        new Phaser.Geom.Rectangle(this.width / 2, this.height / 2, this.width, this.height),
        interactiveBoundsChecker,
      );
      this.on("pointerover", () => {
        this.scene.input.manager.canvas.style.cursor = "pointer"; // or custom image: url("assets/cursor.png"), pointer
      });
      this.on("pointerout", () => {
        this.scene.input.manager.canvas.style.cursor = "default";
      });
      this.on("pointerdown", () => {
        if (this.isYourTurn) {
          this.renderSkills(this.skillContainer);
        }
      });
    }

    this.scene.add.existing(this);
  }

  updateStats(data) {
    this.currentHP = data.hp;
    this.currentSP = data.sp;
    this.hpText.setText(`${data.hp}/${this.maxHP}`);
    this.hpBar.setValue(data.hp);
    this.spText.setText(`${data.sp}/${this.maxSP}`);
    this.spBar.setValue(data.sp);
    this.effects = data.effects;

    if (this.currentHP === 0) {
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 2000,
        ease: 'Power1',
        onComplete: () => {
          this.visible = false;
        }
      });

      const child = this.scene.children.getByName('skillContainer').list.find(c => c.name === this.tokenId);

      if (child) {
        child.setVisible(false); // preferred Phaser method
      }
    }
  }
}
