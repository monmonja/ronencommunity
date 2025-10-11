// @ts-ignore
import Phaser from 'phaser';
import {interactiveBoundsChecker} from "../rotate-utils.mjs";
import {GameModes} from "./baxie-simulation.mjs";
import ProgressBar from "../ui/progress-bar.mjs";
import BackgroundRect from "../ui/background-rect.mjs";
import constants from "../constants.mjs";

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
    this.currentSP = data.stamina;
    this.maxSP = data.stamina;
    this.currentHP = data.hp;
    this.maxHP = data.hp;
    this.gameMode = gameMode;
    this.isEnemy = isEnemy;
    this.roomId = roomId;
    this.isYourTurn = false;
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

  formatSkillName (str)  {
    // Insert space before capital letters
    const spaced = str.replace(/([a-z])([A-Z])/g, '$1 $2');

    // Split into words
    const words = spaced.split(' ');

    // If more than one word, split into two lines
    if (words.length > 1) {
      return `${words[0]}\n${words.slice(1).join(' ')}`;
    }

    // Otherwise just return the spaced version
    return spaced;
  }

  renderSkills(container) {
    let baxieSkillContainer = container.getByName(this.tokenId);
    console.log('this.currentHP', this.currentHP)
    if (this.currentHP === 0) {
      return;
    }

    container.iterate((child) => {
      if (child === baxieSkillContainer) {
        child.setVisible(true);
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

    this.skills.forEach((skill, index) => {
      const radius = 50; // since width/height = 100px total
      const x = index * ((radius * 2) + 30) + radius;
      const y = radius;

      const skillContainer = this.scene.add.container(x, y);

      const skillText = this.scene.add.text(0, radius + 20, this.formatSkillName(skill.func), {
        fontSize: "16px",
        color: "#ffff00",
        backgroundColor: "#000000",
        padding: { x: 5, y: 5 },
      })
        .setOrigin(0.5);
      skillText.visible = false;

      const image = this.scene.add.image(0, 0, skill.image)
        .setScale(0.1)
        .setOrigin(0.5);
      skillContainer.add(image);

      skillContainer
        .setInteractive(
          new Phaser.Geom.Rectangle(-radius, -radius, radius * 2, radius * 2),
          interactiveBoundsChecker,
        )
        .on("pointerover", () => {
          skillText.visible = true;
          this.scene.input.manager.canvas.style.cursor = "pointer";
        })
        .on("pointerout", () => {
          skillText.visible = false;
          this.scene.input.manager.canvas.style.cursor = "default";
        })
        .on('pointerdown', () => {
          if (this.gameMode === GameModes.skillCountdown) {
            if (skillContainer.getByName('countdown')) {
              return;
            }

            skillContainer.add(this.startSkillCountdown(0, 0, radius, 1000 * skill.cooldown));
          }

          console.log(this.scene.ws.readyState, 'readyState')
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

      skillContainer.add(skillText);
      baxieSkillContainer.add(skillContainer);
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
    image.setOrigin(0.5, 0)



    const startHpBarX = 55;

    const hpBackgroundRect = new BackgroundRect(this.scene, {
      x: startHpBarX,
      y: -2,
      width: 120,
      height: (this.gameMode === GameModes.skillCountdown) ? 45 : 90,
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

    if (this.gameMode === GameModes.skillCountdown) {
      this.spBar.visible = false;
      this.spText.visible = false;
      spLabel.visible = false;
    }

    return hpSpContainer;
  }

  renderCharacter(skillContainer, hasEvents = false) {
    this.skillContainer = skillContainer;
    // Clear any existing children
    this.removeAll(true);

    // Just a simple circle as a placeholder body
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xff4444, 0.1);
    graphics.fillRoundedRect(0, 0, this.width, this.height, 3);

    const image = this.scene.make.image({
      x: this.width / 2,
      y: -10,
      key: `image-${this.tokenId}`,
      add: false,
    });
    image.setScale(0.07);
    image.setOrigin(0.5, 0)
    this.add(image);

    // Add a text label for debugging
    console.log('this.tokenId',this.tokenId)
    const nameText = this.scene.add.text(0, 0, this.tokenId || "BaxieUi", {
      fontSize: "20px",
      color: "#ffffff",
    }).setOrigin(0);


    // Add them to the container
    this.add([graphics, nameText ]);

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
    this.currentSP = data.stamina;
    this.hpText.setText(`${data.hp}/${this.maxHP}`);
    this.hpBar.setValue(data.hp);
    this.spText.setText(`${data.stamina}/${this.maxSP}`);
    this.spBar.setValue(data.stamina);

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
      console.log(this.list, child)
      if (child) {
        child.setVisible(false); // preferred Phaser method
      }
    }
  }
}
