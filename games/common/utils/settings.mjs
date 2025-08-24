import Phaser from "phaser";
import {createButton} from "../../match-3-baxies/utils/buttons.mjs";

export function addSettingsIcon(scene) {
  const settingsIcon = scene.add.image(scene.scale.width - 10, 10, "settings")
    .setOrigin(1, 0)
    .setScale(0.07)
    .setInteractive();
  settingsIcon.on('pointerdown', () => {
    scene.scene.launch('SettingsScene');
  })
}

export function addBgMusic (scene) {
  if (!scene.bgm) {
    scene.bgm = scene.sound.add('bgm', {loop: true, volume: 0.3});
  }

  scene.input.once('pointerdown', () => {
    if (!scene.bgm.isPlaying) {


      const isPlaying = localStorage.getItem("music-muted");
      if (isPlaying !== 'false') {
        if (!scene.sound.unlock) {
          scene.sound.unlock();
        }

        scene.bgm.play();
      }
    }
  });

  scene.game.events.on('bgAudioChange', (isOn) => {
    if (isOn) {
      scene.bgm.stop();
    } else {
      scene.bgm.play();
    }
  });
}

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super("SettingsScene");
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
    this.panel = this.add.container(0, 0);

    const blocker = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.3)
      .setOrigin(0, 0)
      .setInteractive();
    
    const bg = this.add.graphics();
    bg.fillStyle(0x222222, 1);
    bg.fillRoundedRect(15, 60, this.scale.width - 30, 400, 4);
    this.panel.add([blocker, bg]);
  }

  createMusicOption() {
    const musicGroup = this.add.container(0, 0);
    const isPlaying = localStorage.getItem("music-muted");

    const label = this.add.text(35 , 152, "Background Music", {
      fontFamily: "troika",
      fontSize: '20px',
      color: "#FFF",
    }).setOrigin(0, 0.5);
    musicGroup.add(label);

    const onBtn = this.add.text(270 , 152, "On", {
      fontFamily: "troika",
      fontSize: '20px',
      color: isPlaying === "true" ? "#FFF" : "#333",
    }).setOrigin(0, 0.5);
    onBtn.setInteractive();
    onBtn.on('pointerdown', () => {
      onBtn.setColor('#FFF')
      offBtn.setColor('#333');
      this.game.events.emit("bgAudioChange", false);
      localStorage.setItem("music-muted",  "true");
    });
    musicGroup.add(onBtn);

    const offBtn = this.add.text(305 , 152, "Off", {
      fontFamily: "troika",
      fontSize: '20px',
      color: isPlaying === "false" ? "#FFF" : "#333",
    }).setOrigin(0, 0.5);
    offBtn.setInteractive();
    offBtn.on('pointerdown', () => {
      offBtn.setColor('#FFF')
      onBtn.setColor('#333')
      this.game.events.emit("bgAudioChange", true);
      localStorage.setItem("music-muted",  "false");
    });
    musicGroup.add(offBtn);
    this.panel.add(musicGroup);
  }

  createFullscreenOption() {
    const fullscreenGroup = this.add.container(0, 35);
    const isFullscreen = localStorage.getItem("fullscreen-mode");

    const label = this.add.text(35 , 152, "Fullscreen", {
      fontFamily: "troika",
      fontSize: '20px',
      color: "#FFF",
    }).setOrigin(0, 0.5);
    fullscreenGroup.add(label);

    const onBtn = this.add.text(270 , 152, "On", {
      fontFamily: "troika",
      fontSize: '20px',
      color: isFullscreen === "true" ? "#FFF" : "#333",
    }).setOrigin(0, 0.5);
    onBtn.setInteractive();
    onBtn.on('pointerdown', () => {
      onBtn.setColor('#ffffff')
      offBtn.setColor('#333');
      this.scale.startFullscreen();
      document.body.classList.add('fullscreen');
      localStorage.setItem("fullscreen-mode",  "true");
    });
    fullscreenGroup.add(onBtn);

    const offBtn = this.add.text(305 , 152, "Off", {
      fontFamily: "troika",
      fontSize: '20px',
      color: isFullscreen === "false" ? "#FFF" : "#333",
    }).setOrigin(0, 0.5);
    offBtn.setInteractive();
    offBtn.on('pointerdown', () => {
      offBtn.setColor('#ffffff')
      onBtn.setColor('#333')
      this.scale.stopFullscreen();
      localStorage.setItem("fullscreen-mode",  "false");
    });
    fullscreenGroup.add(offBtn);
    this.panel.add(fullscreenGroup);

    this.scale.on('leavefullscreen', () => {
      document.body.classList.remove('fullscreen');
      localStorage.setItem("fullscreen-mode",  "false");
      if (offBtn) {
        offBtn.setColor('#ffffff')
        onBtn.setColor('#333')
      }
    });
  }

  createHeader() {
    const header = this.add.text(30, 84, 'Settings', {
      fontFamily: 'troika',
      fontSize: '40px',
      color: '#FFF'
    }).setOrigin(0, 0);
    this.panel.add(header);
  }

  create() {
    this.cameras.main.setScroll(0, -this.scale.height);

    // Slide down tween
    this.tweens.add({
      targets: this.cameras.main,
      scrollY: 0,
      duration: 500,
      ease: 'Cubic.easeOut'
    });

    this.createTopBg();
    this.createFullscreenOption();
    this.createHeader();
    this.createMusicOption();

    const backBtn = createButton({
      scene: this,
      x: this.scale.width / 2 - (150 / 2),
      y: 350,
      width: 150,
      height: 50,
      text: "Back",
      onPointerDown: () => {
        this.tweens.add({
          targets: this.panel,
          y: this.scale.height,  // slide down off screen
          duration: 500,
          ease: 'Cubic.easeIn',
          onComplete: () => {
            this.scene.stop();   // remove SettingsScene
          }
        });
      }
    });
    this.panel.add(backBtn);
  }
}
