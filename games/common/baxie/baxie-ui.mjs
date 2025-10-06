// @ts-ignore
import Phaser from 'phaser';
import {interactiveBoundsChecker} from "../rotate-utils.mjs";
import {GameModes} from "./baxie-simulation.mjs";

export default class BaxieUi extends Phaser.GameObjects.Container {
  attributes;
  enemies;

  currentHP = 0;
  effects = [];
  skills = [];
  width= 100;
  height= 100;

  /**
   * @todo pass click function for selection, pass skill click function
   */
  constructor({ scene, data, roomId, x, y, renderPosition, isEnemy = false, gameMode } = {}) {
    super(scene, x, y); // Container will be positioned at (x,y)
    this.tokenId = data.tokenId;
    this.image = data.image;
    this.skills = data.skills;
    this.stamina = data.stamina;
    this.currentHP = data.hp;
    this.gameMode = gameMode;
    this.renderPosition = renderPosition;
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

  renderSkills(container) {
    let baxieSkillContainer = container.getByName(this.tokenId);

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
      const graphics = this.scene.add.graphics();

// Outer black border (4px)
      graphics.fillStyle(0x000000, 1);
      graphics.fillCircle(0, 0, radius);

      // Inner yellow border (10px inside)
      graphics.fillStyle(0xffff00, 1);
      graphics.fillCircle(0, 0, radius - 4);

      // Inner black border (1px inside)
      graphics.fillStyle(0x000000, 1);
      graphics.fillCircle(0, 0, radius - 4 - 10);

      // Core yellow circle (the main fill)
      graphics.fillStyle(0xffff00, 1);
      graphics.fillCircle(0, 0, radius - 4 - 10 - 1);
      skillContainer.add(graphics);

      const skillText = this.scene.add.text(0, radius + 20, `${skill.func}`, {
        fontSize: "16px",
        color: "#ffff00",
        backgroundColor: "#000000",
        padding: { x: 5, y: 5 },
      })
        .setOrigin(0.5)
        .setInteractive(
          new Phaser.Geom.Rectangle(0, -(20 + (radius * 2)), radius * 2, radius * 2),
          interactiveBoundsChecker,
        )
        .on("pointerover", () => {
          this.scene.input.manager.canvas.style.cursor = "pointer";
        })
        .on("pointerout", () => {
          this.scene.input.manager.canvas.style.cursor = "default";
        })
        .on('pointerdown', () => {
          console.log(this.gameMode)
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
    // this.scene.load.image(`image-${this.tokenId}`, this.image);
  }

  setYourTurn(yourTurn) {
    this.isYourTurn = yourTurn;
  }
  clearSkills(skillContainer) {
    skillContainer.removeAll(true);
  }

  renderHP(skillContainer, hasEvents = false) {

  }

  renderCharacter(skillContainer, hasEvents = false) {
    this.skillContainer = skillContainer;
    // Clear any existing children
    this.removeAll(true);

    // Just a simple circle as a placeholder body
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xff4444, 0.3);
    graphics.fillRoundedRect(0, 0, this.width, this.height, 3);

    const image = this.scene.make.image({
      x: this.width / 2,
      y: 10,
      key: `image-${this.tokenId}`,
      add: false,
    });
    image.setScale(0.05);
    image.setOrigin(0.5, 0)
    this.add(image);

    // Add a text label for debugging
    console.log('this.tokenId',this.tokenId)
    const nameText = this.scene.add.text(0, 0, this.tokenId || "BaxieUi", {
      fontSize: "20px",
      color: "#ffffff",
    }).setOrigin(0);

    // Add HP text below
    let labelPos = this.renderPosition === 1 ? 130: 120;
    if (!this.isEnemy) {
      labelPos = this.renderPosition === 1 ? -100: -110;
    }
    this.hpText = this.scene.add.text(labelPos, 25, `HP: ${this.currentHP}`, {
      fontSize: "20px",
      color: "#ffffff",
    }).setOrigin(0);

    this.spText = this.scene.add.text(labelPos, 45, `SP: ${this.stamina}`, {
      fontSize: "20px",
      color: "#ffffff",
    }).setOrigin(0);

    if (this.gameMode === GameModes.skillCountdown) {
      this.spText.visible = false;
    }

    // Add them to the container
    this.add([graphics, nameText, this.hpText, this.spText]);

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
    this.hpText.setText(`HP: ${data.hp}`);
    this.spText.setText(`SP: ${data.stamina}`);
  }
}
