import Phaser from 'phaser';
import {createButton} from "../../utils/buttons.mjs";

// src/scenes/UIScene.js
export default class OptionsScene extends Phaser.Scene {
  constructor() {
    super("OptionsScene");
  }

  createButtonUI({ x, y, width, height, label, eventType } = {}) {
    const button = this.add.container(x, y);
    const bg = this.add.graphics();

    // Optional: fake inset shadow - smaller, inside shape
    bg.fillStyle(0xFFFFFF, 1);
    bg.fillRoundedRect(0, 0, width, height / 2, 4);
    button.add(bg);

    // Top strip with rounded top corners, flat bottom
    const topStrip = this.add.graphics();
    topStrip.fillStyle(0xCCCCCC, 1); // border color
    topStrip.fillRoundedRect(0, 0, width, 25, { tl: 4, tr: 4, br: 0, bl: 0 });
    button.add(topStrip);

    const labelTxt = this.add.text(width / 2,  14, label, {
      fontSize: '20px',
      fontFamily: 'troika',
      color: '#1f4213'
    }).setOrigin(0.5, 0.5);
    button.add(labelTxt);

    const valueText = this.add.text(width / 2 , 52, "0", {
      fontFamily: "troika",
      fontSize: '30px',
      color: "#2f8011",
    }).setOrigin(0.5, 0.5);

    this.gameScene.events.on(eventType, (newScore) => {
      valueText.setText(newScore);
    });
    button.add(valueText);
  }

  createTopBg() {
    const topBg = this.add.container(0, 0);

    const bg = this.add.graphics();
    bg.fillStyle(0x2f8011, 1);
    bg.fillRoundedRect(15, 60, this.sys.game.config.width - 30, 400, 4);
    topBg.add([bg]);
  }

  createLogo() {
    const topBg = this.add.container(this.sys.game.config.width / 2 - 8, 35);
    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 1);
    bg.fillRoundedRect(-35, -16, 80, 80, 40);
    bg.lineStyle(2, 0x123008);
    bg.strokeRoundedRect(-35, -16, 80, 80, 40);

    const gronke1 = this.add.image(-10, 10, 'gronke').setOrigin(0.5, 0.5);
    gronke1.setScale(0.5)
    const gronke2 = this.add.image(20, 10, 'gronke').setOrigin(0.5, 0.5);
    gronke2.setScale(0.5)
    const gronke3 = this.add.image(5, 40, 'gronke').setOrigin(0.5, 0.5);
    gronke3.setScale(0.5)


    topBg.add([bg, gronke1, gronke2, gronke3]);
  }

  createMusicOption() {
    const isPlaying = localStorage.getItem("match-3-baxies-music-muted");

    this.add.text(35 , 152, "Background Music", {
      fontFamily: "troika",
      fontSize: '20px',
      color: "#FFF",
    }).setOrigin(0, 0.5);

    const onBtn = this.add.text(270 , 152, "On", {
      fontFamily: "troika",
      fontSize: '20px',
      color: isPlaying !== "false" ? "#333" : "#fff",
    }).setOrigin(0, 0.5);
    onBtn.setInteractive();
    onBtn.on('pointerdown', () => {
      this.mainMenuScene = this.scene.get("MainMenuScene");
      onBtn.setColor('#333')
      offBtn.setColor('#ffffff');
      this.mainMenuScene.events.emit("bgAudioChange", false);
      localStorage.setItem("match-3-baxies-music-muted",  "true");
    });

    const offBtn = this.add.text(305 , 152, "Off", {
      fontFamily: "troika",
      fontSize: '20px',
      color: isPlaying === "false" ? "#333" : "#fff",
    }).setOrigin(0, 0.5);
    offBtn.setInteractive();
    offBtn.on('pointerdown', () => {
      this.mainMenuScene = this.scene.get("MainMenuScene");

      offBtn.setColor('#333')
      onBtn.setColor('#ffffff')
      this.mainMenuScene.events.emit("bgAudioChange", true);
      localStorage.setItem("match-3-baxies-music-muted",  "false");
    });
  }

  create() {
    this.createTopBg();
    this.createLogo();
    this.createMusicOption();

    createButton({
      scene: this,
      x: this.sys.game.config.width / 2 - (150 / 2),
      y: 350,
      width: 150,
      height: 50,
      text: "Back",
      onPointerDown: () => {
        this.scene.stop('OptionsScene');
        // this.scene.launch('UIScene');
      }
    })
  }
}
