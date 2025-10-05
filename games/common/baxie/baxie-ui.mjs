// @ts-ignore
import Phaser from 'phaser';
import {interactiveBoundsChecker} from "../rotate-utils.mjs";

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
  constructor(scene, data, roomId, x, y, renderPosition, isEnemy = false) {
    super(scene, x, y); // Container will be positioned at (x,y)
    console.log('data', data)
    this.tokenId = data.tokenId;
    this.image = data.image;
    this.skills = data.skills;
    this.stamina = data.stamina;
    this.currentHP = data.hp;
    this.renderPosition = renderPosition;
    this.isEnemy = isEnemy;
    this.roomId = roomId;
    this.isYourTurn = false;
  }

  renderSkills(container) {
    // Clear existing children
    container.removeAll(true);

    this.skills.forEach((skill, index) => {
      const skillCircle = this.scene.add.rectangle(0, index * 30 + 15, 12, 0x6666ff);
      container.add(skillCircle);

      const skillText = this.scene.add.text(0, index * 30, `${skill.func} (Cost: ${skill.cost})`, {
        fontSize: "16px",
        color: "#ffff00",
        backgroundColor: "#000000",
        padding: { x: 5, y: 5 },
      }).setInteractive();

      skillText.on('pointerdown', () => {
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

      container.add(skillText);
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
