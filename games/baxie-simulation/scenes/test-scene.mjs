export const COLORS = {
  primary: 0x3713ec,
  primaryAccent: 0x5E41F0,
  backgroundLight: 0xf6f6f8,
  backgroundDark: 0x0D0A1A,
  uiDark: 0x1F1A33,
  uiDarkBorder: 0x3A3159,
  white: 0xffffff,
  gray400: 0x9CA3AF,
  gray600: 0x4B5563,
  gray700: 0x374151,
  yellow400: 0xFACC15,
  cyan400: 0x22D3EE,
  black: 0x000000,
  transparent: 0x00000000,
  red: 0xFF3333,
  green: 0x33FF57,
  blue: 0x3357FF,
  purple: 0xF333FF,
  orange: 0xFF5733
};

export const FONTS = {
  display: 'Space Grotesk',
  game: 'Press Start 2P'
};

export const createButton = (scene, x, y, width, height, textContent, bgColor, textColor, fontSize, fontFamily, cornerRadius = 8) => {
  const graphics = scene.add.graphics();
  graphics.fillStyle(bgColor, 1);
  graphics.fillRoundedRect(0, 0, width, height, cornerRadius);

  const text = scene.add.text(width / 2, height / 2, textContent, {
    fontFamily: fontFamily,
    fontSize: `${fontSize}px`,
    color: `#${textColor.toString(16).padStart(6, '0')}`,
    align: 'center'
  }).setOrigin(0.5);

  const buttonContainer = scene.add.container(x, y, [graphics, text]);
  buttonContainer.setSize(width, height);
  buttonContainer.setInteractive({ useHandCursor: true });
  buttonContainer.setOrigin(0.5);
  return buttonContainer;
};

export const createTab = (scene, x, y, width, height, textContent, bgColor, textColor, fontSize, fontFamily) => {
  const graphics = scene.add.graphics();
  graphics.fillStyle(bgColor, 1);

  graphics.beginPath();
  graphics.moveTo(width * 0.1, 0);
  graphics.lineTo(width, 0);
  graphics.lineTo(width * 0.9, height);
  graphics.lineTo(0, height);
  graphics.closePath();
  graphics.fillPath();

  const text = scene.add.text(width / 2, height / 2, textContent, {
    fontFamily: fontFamily,
    fontSize: `${fontSize}px`,
    color: `#${textColor.toString(16).padStart(6, '0')}`,
    align: 'center'
  }).setOrigin(0.5);

  const tabContainer = scene.add.container(x, y, [graphics, text]);
  tabContainer.setSize(width, height);
  tabContainer.setInteractive({ useHandCursor: true });
  tabContainer.setOrigin(0);
  return tabContainer;
};

export default class TestScene extends Phaser.Scene {
  constructor() {
    super('TestScene');
    this.characterDisplay = null;
    this.partBorders = [];
    this.partImages = [];
    this.colorSelectors = [];
    this.colorSelectorBorders = [];
  }

  create() {
    const { width, height } = this.scale.gameSize;
    const headerHeight = 80;
    const sidebarWidth = 380;
    const mainContentWidth = width - sidebarWidth;

    this.add.rectangle(width / 2, height / 2, width, height, COLORS.backgroundDark);

    const headerBg = this.add.rectangle(width / 2, headerHeight / 2, width, headerHeight, COLORS.uiDark, 0.5);
    headerBg.setStrokeStyle(1, COLORS.uiDarkBorder, 1);
    headerBg.setOrigin(0.5);

    const logoIcon = this.add.graphics();
    logoIcon.fillStyle(COLORS.primaryAccent, 1);
    logoIcon.fillCircle(0, 0, 20); // Placeholder for SVG logo
    const logoContainer = this.add.container(40, headerHeight / 2, [logoIcon]);

    const titleText = this.add.text(logoContainer.x + 30, headerHeight / 2, 'Creature Creator', {
      fontFamily: FONTS.game,
      fontSize: '24px',
      color: `#${COLORS.white.toString(16).padStart(6, '0')}`
    }).setOrigin(0, 0.5).setPadding({ left: 10 });

    const moneyContainer = this.add.container(width - 250, headerHeight / 2);
    const moneyBg = this.add.rectangle(0, 0, 150, 48, COLORS.uiDark, 1).setOrigin(0.5);
    moneyBg.setStrokeStyle(1, COLORS.uiDarkBorder, 1);
    moneyBg.setInteractive().on('pointerover', () => moneyBg.fillColor = COLORS.uiDarkBorder).on('pointerout', () => moneyBg.fillColor = COLORS.uiDark);
    moneyBg.setcornerRadius(8);
    const moneyIcon = this.add.text(-40, 0, '💲', {
      fontSize: '24px',
      color: `#${COLORS.yellow400.toString(16).padStart(6, '0')}`
    }).setOrigin(0.5);
    const moneyValue = this.add.text(20, 0, '1,250', {
      fontFamily: FONTS.display,
      fontSize: '18px',
      color: `#${COLORS.white.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    moneyContainer.add([moneyBg, moneyIcon, moneyValue]);

    const energyContainer = this.add.container(width - 120, headerHeight / 2);
    const energyBg = this.add.rectangle(0, 0, 120, 48, COLORS.uiDark, 1).setOrigin(0.5);
    energyBg.setStrokeStyle(1, COLORS.uiDarkBorder, 1);
    energyBg.setInteractive().on('pointerover', () => energyBg.fillColor = COLORS.uiDarkBorder).on('pointerout', () => energyBg.fillColor = COLORS.uiDark);
    energyBg.setcornerRadius(8);
    const energyIcon = this.add.text(-30, 0, '⚡', {
      fontSize: '24px',
      color: `#${COLORS.cyan400.toString(16).padStart(6, '0')}`
    }).setOrigin(0.5);
    const energyValue = this.add.text(20, 0, '12/12', {
      fontFamily: FONTS.display,
      fontSize: '18px',
      color: `#${COLORS.white.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    energyContainer.add([energyBg, energyIcon, energyValue]);

    const profilePicContainer = this.add.container(width - 50, headerHeight / 2);
    const profileCircleBg = this.add.graphics();
    profileCircleBg.fillStyle(COLORS.black, 1);
    profileCircleBg.fillCircle(0, 0, 24);

    const profileImage = this.add.image(0, 0, 'profilePic')
      .setDisplaySize(48, 48);

    const profileBorder = this.add.graphics();
    profileBorder.lineStyle(2, COLORS.primaryAccent, 1);
    profileBorder.strokeCircle(0, 0, 24);

    profilePicContainer.add([profileCircleBg, profileImage, profileBorder]);

    const profileMaskGraphics = this.make.graphics();
    profileMaskGraphics.fillCircle(profilePicContainer.x, profilePicContainer.y, 24);
    const mask = profileMaskGraphics.createGeometryMask();
    profileImage.setMask(mask);

    const mainContentAreaX = mainContentWidth / 2;
    const mainContentAreaY = headerHeight + (height - headerHeight) / 2;

    const characterDisplayWidth = mainContentWidth * 0.75;
    const characterDisplayHeight = characterDisplayWidth * (9 / 16);
    this.characterDisplay = this.add.image(mainContentAreaX, mainContentAreaY - 50, 'characterDisplayBg')
      .setDisplaySize(characterDisplayWidth, characterDisplayHeight)
      .setInteractive({ useHandCursor: true });

    const borderWidth = 8;
    const borderGraphics = this.add.graphics();
    borderGraphics.lineStyle(borderWidth, COLORS.primaryAccent, 1);
    borderGraphics.strokeRoundedRect(
      this.characterDisplay.x - characterDisplayWidth / 2 - borderWidth / 2,
      this.characterDisplay.y - characterDisplayHeight / 2 - borderWidth / 2,
      characterDisplayWidth + borderWidth,
      characterDisplayHeight + borderWidth,
      12
    );

    this.characterDisplay.on('pointerdown', () => {
      this.tweens.add({
        targets: this.characterDisplay,
        x: this.characterDisplay.x + 5,
        ease: 'Sine.easeInOut',
        duration: 50,
        yoyo: true,
        repeat: 4,
        onComplete: () => {
          this.characterDisplay.x = mainContentAreaX;
        }
      });
    });

    const saveButton = createButton(this, mainContentAreaX, this.characterDisplay.y + characterDisplayHeight / 2 + 70, 250, 60, 'Export Character', COLORS.primaryAccent, COLORS.white, 16, FONTS.game, 8);
    saveButton.on('pointerdown', () => {
      this.scene.launch('OverlayScene');
    });

    const sidebarBg = this.add.rectangle(width - sidebarWidth / 2, headerHeight + (height - headerHeight) / 2, sidebarWidth, height - headerHeight, COLORS.uiDark);
    sidebarBg.setStrokeStyle(1, COLORS.uiDarkBorder, 1);
    sidebarBg.setOrigin(0.5);

    const tabY = headerHeight + 20;
    const tabWidth = (sidebarWidth - 40) / 5;
    const tabHeight = 60;
    const tabSpacing = 5;

    const tabNames = ['Ears', 'Mouth', 'Nose', 'Tail', 'Color'];
    tabNames.forEach((name, index) => {
      const xOffset = 20 + index * (tabWidth + tabSpacing);
      const tab = createTab(this, width - sidebarWidth + xOffset, tabY, tabWidth, tabHeight, name,
        index === 0 ? COLORS.primaryAccent : COLORS.uiDark,
        index === 0 ? COLORS.white : COLORS.gray400,
        14, FONTS.game
      );
    });

    const partsSectionY = tabY + tabHeight + 40;
    this.add.text(width - sidebarWidth + 24, partsSectionY, 'Parts', {
      fontFamily: FONTS.game,
      fontSize: '18px',
      color: `#${COLORS.white.toString(16).padStart(6, '0')}`
    }).setOrigin(0, 0.5);

    const partGridStartX = width - sidebarWidth + 24;
    const partGridStartY = partsSectionY + 40;
    const partSize = (sidebarWidth - 24 * 2 - 20) / 2;
    const partGap = 20;

    const partSelectors = [
      'partSelector1', 'partSelector2', 'partSelector3',
      'partSelector4', 'partSelector5', 'partSelector6'
    ];

    partSelectors.forEach((key, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = partGridStartX + col * (partSize + partGap) + partSize / 2;
      const y = partGridStartY + row * (partSize + partGap) + partSize / 2;

      const partImage = this.add.image(x, y, key)
        .setDisplaySize(partSize, partSize)
        .setInteractive({ useHandCursor: true })
        .setOrigin(0.5);

      const partBorder = this.add.graphics();
      partBorder.lineStyle(4, COLORS.primaryAccent, 0);
      partBorder.strokeRoundedRect(x - partSize/2, y - partSize/2, partSize, partSize, 8);

      if (index === 0) {
        partBorder.setAlpha(1);
        partImage.setData('active', true);
      }

      partImage.on('pointerover', () => partBorder.setAlpha(1));
      partImage.on('pointerout', () => { if (partImage.getData('active') !== true) partBorder.setAlpha(0); });
      partImage.on('pointerdown', () => {
        this.partBorders.forEach(b => b.setAlpha(0));
        this.partImages.forEach(img => img.setData('active', false));

        partBorder.setAlpha(1);
        partImage.setData('active', true);
        this.tweens.add({
          targets: this.characterDisplay,
          x: this.characterDisplay.x + 5,
          ease: 'Sine.easeInOut',
          duration: 50,
          yoyo: true,
          repeat: 4,
          onComplete: () => {
            this.characterDisplay.x = mainContentAreaX;
          }
        });
      });
      this.partBorders.push(partBorder);
      this.partImages.push(partImage);
    });

    const paletteSectionY = partGridStartY + 3 * (partSize + partGap);
    this.add.text(width - sidebarWidth + 24, paletteSectionY, 'Palette', {
      fontFamily: FONTS.game,
      fontSize: '18px',
      color: `#${COLORS.white.toString(16).padStart(6, '0')}`
    }).setOrigin(0, 0.5);

    const paletteColors = [
      COLORS.orange, COLORS.green, COLORS.blue, COLORS.purple, COLORS.red, COLORS.green
    ];
    const colorCircleSize = 40;
    const colorGap = 16;
    const colorsPerRow = Math.floor((sidebarWidth - 2 * 24) / (colorCircleSize + colorGap));
    const paletteGridStartX = width - sidebarWidth + 24;
    const paletteGridStartY = paletteSectionY + 40;

    paletteColors.forEach((color, index) => {
      const col = index % colorsPerRow;
      const row = Math.floor(index / colorsPerRow);
      const x = paletteGridStartX + col * (colorCircleSize + colorGap) + colorCircleSize / 2;
      const y = paletteGridStartY + row * (colorCircleSize + colorGap) + colorCircleSize / 2;

      const colorCircle = this.add.graphics();
      colorCircle.fillStyle(color, 1);
      colorCircle.fillCircle(0, 0, colorCircleSize / 2);

      const colorBorder = this.add.graphics();
      colorBorder.lineStyle(4, COLORS.primaryAccent, 0);
      colorBorder.strokeCircle(0, 0, colorCircleSize / 2 + 2);

      const colorContainer = this.add.container(x, y, [colorCircle, colorBorder])
        .setInteractive({ useHandCursor: true });

      if (index === 1) {
        colorBorder.setAlpha(1);
        colorContainer.setData('active', true);
      }

      colorContainer.on('pointerdown', () => {
        this.colorSelectorBorders.forEach(b => b.setAlpha(0));
        this.colorSelectors.forEach(c => c.setData('active', false));
        colorBorder.setAlpha(1);
        colorContainer.setData('active', true);
      });

      this.colorSelectors.push(colorContainer);
      this.colorSelectorBorders.push(colorBorder);
    });
  }
}