import Phaser from "phaser";
import {createButton, createCloseButton} from "./buttons.mjs";
import constants from "./constants.mjs";
import {interactiveBoundsChecker} from "./rotate-utils.mjs";

export function addSettingsIcon({ scene } = {}) {
  const x = 0;
  const y = 10;
  const width = 60;
  const container = scene.add.container(x, y)
    .setInteractive(
      new Phaser.Geom.Rectangle(0, y / 2, 80, 90),
      interactiveBoundsChecker,
    );
  const bg = scene.add.graphics();

  const profilePicWidth = width + 10;
  const profilePicHeight = 70;

  bg.fillStyle(0x91c7fc, 0.3);
  bg.fillRoundedRect(10, 8, profilePicWidth, profilePicHeight, {
    tl: 24, // top-left
    tr: 30, // top-right
    bl: 24,  // bottom-left
    br: 30   // bottom-right
  });
  container.add(bg);

  // Profile picture
  const profilePic = scene.add.image(43, 17, "profile-pic")
    .setScale(0.25)
    .setOrigin(0.5, 0);
  profilePic.texture.setFilter(Phaser.Textures.NEAREST);

  // Create graphics for mask
  const maskShape = scene.make.graphics();
  maskShape.fillStyle(0xffffff);

  // Draw circle for mask
  maskShape.fillRoundedRect(10, 13, profilePicWidth, profilePicHeight, {
    tl: 24, // top-left
    tr: 30, // top-right
    bl: 24,  // bottom-left
    br: 30   // bottom-right
  });

// Apply mask
  const mask = maskShape.createGeometryMask();
  profilePic.setMask(mask);

// Add to container
  container.add(profilePic);

  const frame = scene.add.image(43, 3, "profile-frame")
    .setScale(1.5)
    .setOrigin(0.5, 0);

  container.add(frame);
  container.add(profilePic);

  const settingsIcon = scene.add.image(8, 0, "settings")
    .setOrigin(0, 0)
    .setScale(0.65)
    .setInteractive(
      new Phaser.Geom.Rectangle(4, 4, 24, 24),
      interactiveBoundsChecker,
    );

  container.add(settingsIcon);

  container.on("pointerover", () => {
    scene.input.manager.canvas.style.cursor = "pointer"; // or custom image: url("assets/cursor.png"), pointer
  });
  container.on("pointerout", () => {
    scene.input.manager.canvas.style.cursor = "default";
  });
  container.on("pointerdown", () => {
    scene.scene.launch("SettingsScene");
    scene.scene.bringToTop("SettingsScene");
  });
  settingsIcon.on("pointerover", () => {
    scene.input.manager.canvas.style.cursor = "pointer"; // or custom image: url("assets/cursor.png"), pointer
  });
  settingsIcon.on("pointerout", () => {
    scene.input.manager.canvas.style.cursor = "default";
  });
  settingsIcon.on("pointerdown", () => {
    scene.scene.launch("SettingsScene");
    scene.scene.bringToTop("SettingsScene");
  });

  return settingsIcon;
}

export function addBgMusic (scene) {
  if (!scene.bgm) {
    scene.bgm = scene.sound.add("bgm", {loop: true, volume: 0.3});
  }

  scene.input.once("pointerdown", () => {
    if (!scene.bgm.isPlaying) {
      const isPlaying = localStorage.getItem("music-muted");

      if (isPlaying !== "false") {
        if (!scene.sound.unlock) {
          scene.sound.unlock();
        }

        scene.bgm.play();
      }
    }
  });

  scene.game.events.on("bgAudioChange", (isOn) => {
    if (isOn) {
      scene.bgm.stop();
    } else {
      scene.bgm.play();
    }
  });
}

export class SettingsScene extends Phaser.Scene {
  windowWidth = 400;
  constructor() {
    super("SettingsScene");
  }

  createTopBg() {
    this.add.container(0, 0);
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, constants.colors.blocker, constants.colors.blockerAlpha)
      .setOrigin(0, 0)
      .setInteractive();

    this.panel = this.add.container((this.scale.width / 2 - this.windowWidth / 2) + (constants.mainMenu.panelWidth / 2), 20);
    const bg = this.add.graphics();

    bg.fillStyle(0x222222, 1);
    bg.fillRoundedRect(0, 0, this.windowWidth, this.scale.height - 40, 4);
    this.panel.add([bg]);
  }

  createMusicOption() {
    const musicGroup = this.add.container(15, 100);
    const isPlaying = localStorage.getItem("music-muted");

    const label = this.add.text(0 , 0, "Background Music", {
      fontFamily: "troika",
      fontSize: "20px",
      color: "#FFF",
    }).setOrigin(0, 0.5);

    musicGroup.add(label);

    const onBtn = this.add.text(270 , 0, "On", {
      fontFamily: "troika",
      fontSize: "20px",
      color: isPlaying === "true" ? "#FFF" : "#333",
    }).setOrigin(0, 0.5);

    onBtn.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, 30, 20),
      interactiveBoundsChecker,
    );
    onBtn.on("pointerdown", () => {
      onBtn.setColor("#FFF");
      offBtn.setColor("#333");
      this.game.events.emit("bgAudioChange", false);
      localStorage.setItem("music-muted",  "true");
    });
    musicGroup.add(onBtn);

    const offBtn = this.add.text(305 , 0, "Off", {
      fontFamily: "troika",
      fontSize: "20px",
      color: isPlaying === "false" ? "#FFF" : "#333",
    }).setOrigin(0, 0.5);

    offBtn.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, 35, 20),
      interactiveBoundsChecker,
    );
    offBtn.on("pointerdown", () => {
      offBtn.setColor("#FFF");
      onBtn.setColor("#333");
      this.game.events.emit("bgAudioChange", true);
      localStorage.setItem("music-muted",  "false");
    });
    musicGroup.add(offBtn);
    this.panel.add(musicGroup);
  }

  createFullscreenOption() {
    const fullscreenGroup = this.add.container(15, 130);
    const isFullscreen = localStorage.getItem("fullscreen-mode");

    const label = this.add.text(0 , 0, "Fullscreen", {
      fontFamily: "troika",
      fontSize: "20px",
      color: "#FFF",
    }).setOrigin(0, 0.5);

    fullscreenGroup.add(label);

    const onBtn = this.add.text(270 , 0, "On", {
      fontFamily: "troika",
      fontSize: "20px",
      color: isFullscreen === "true" ? "#FFF" : "#333",
    }).setOrigin(0, 0.5);

    onBtn.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, 30, 20),
      interactiveBoundsChecker,
    );
    onBtn.on("pointerdown", () => {
      onBtn.setColor("#ffffff");
      offBtn.setColor("#333");
      this.scale.startFullscreen();
      document.body.classList.add("fullscreen");
      localStorage.setItem("fullscreen-mode",  "true");
    });
    fullscreenGroup.add(onBtn);

    const offBtn = this.add.text(305 , 0, "Off", {
      fontFamily: "troika",
      fontSize: "20px",
      color: isFullscreen === "false" ? "#FFF" : "#333",
    }).setOrigin(0, 0.5);

    offBtn.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, 35, 20),
      interactiveBoundsChecker,
    );
    offBtn.on("pointerdown", () => {
      offBtn.setColor("#ffffff");
      onBtn.setColor("#333");
      this.scale.stopFullscreen();
      localStorage.setItem("fullscreen-mode",  "false");
    });
    fullscreenGroup.add(offBtn);
    this.panel.add(fullscreenGroup);
  }

  createHeader() {
    const header = this.add.text(15, 15, "Settings", {
      fontFamily: "troika",
      fontSize: "40px",
      color: "#FFF"
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
      ease: "Cubic.easeOut"
    });

    this.createTopBg();
    this.createFullscreenOption();
    this.createHeader();
    this.createMusicOption();

    this.panel.add(createCloseButton({
      scene: this,
      x: this.windowWidth - 44,
      y: 15,
      onPointerDown: () => {
        this.scene.stop();
      }
    }));
  }
}
