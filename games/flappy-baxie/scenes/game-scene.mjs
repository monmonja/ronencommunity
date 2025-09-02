import Phaser from 'phaser';
import { assets } from "../constants.mjs";
import constants from "../../common/constants.mjs";

const levels = [
  {
    maxScore: 3,
    velocityX: -120,
    nextFrame: 120,
  },
  {
    maxScore: 4,
    velocityX: -150,
    nextFrame: 100,
  },
  {
    maxScore: 7,
    velocityX: -200,
    nextFrame: 100,
  },
  {
    maxScore: 10,
    velocityX: -220,
    nextFrame: 70,
  },
  {
    maxScore: 13,
    velocityX: -250,
    nextFrame: 60,
  },
  {
    maxScore: 16,
    velocityX: -150,
    nextFrame: 100,
  },
  {
    maxScore: 19,
    velocityX: -200,
    nextFrame: 90,
  },
  {
    maxScore: 22,
    velocityX: -250,
    nextFrame: 50,
  }
]

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });

    this.scoreTxt = null;
    this.score = 0;
    this.upButton = null;
    this.player = null;
    this.selectedBaxie = null;
    this.framesMoveUp = null;
    this.backgroundDay = null;
    this.backgroundNight = null;
    this.pipesGroup = null;
    this.gapsGroup = null;
    this.floorGroup = null;
    this.nextPipes = null;
    this.currentPipe = null;
    this.setLevel();
  }

  setLevel() {
    for (let i = 0; i < levels.length; i++) {
      if (this.score < levels[i].maxScore) {
        const level = levels[i];

        this.velocityX = level.velocityX;
        this.nextFrame = level.nextFrame;
        this.level = i + 1;

        break;
      }
    }
  }
  init(data) {
    this.selectedBaxie = data.selectedBaxie;
  }

  createScoreBoard() {
    this.game.events.emit('clearMainPanelItem');
    this.game.events.emit('addMainPanelItem', ({ scene }) => {
      const width = constants.scoreBoard.width;
      const height = 80;
      const bg = scene.add.graphics();
      bg.fillStyle(0x9dfd90, 0.3);
      bg.fillRoundedRect(0, 0, width, height, 6);

      // Top strip with rounded top corners, flat bottom
      const topStrip = scene.add.graphics();
      topStrip.fillStyle(0xCCCCCC, 1); // border color
      topStrip.fillRoundedRect(0, 0, width, 25, { tl: 4, tr: 4, br: 0, bl: 0 });

      const labelTxt = scene.add.text(width / 2,  14, 'Score', {
        fontSize: '18px',
        fontFamily: 'troika',
        color: '#1f4213'
      }).setOrigin(0.5, 0.5);

      this.scoreTxt = scene.add.text(width / 2, (height / 2) + 15, '0', {
        fontFamily: 'troika',
        fontSize: '40px',
        color: '#FFF'
      }).setOrigin(0.5, 0.5);
      this.scoreTxt.setShadow(2, 2, '#222', 4, false, true);
      this.scoreTxt.setDepth(30);

      return [bg, topStrip, labelTxt, this.scoreTxt];
    })
  }

  /**
   *   Create the game objects (images, groups, sprites).
   */
  create() {
    this.createScoreBoard();
    this.backgroundDay = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, assets.scene.background.day).setOrigin(0, 0).setInteractive()
    this.backgroundDay.on('pointerdown', () => this.moveBaxie())
    this.backgroundNight = this.add.tileSprite(0, 0,  this.scale.width, this.scale.height, assets.scene.background.night).setOrigin(0, 0).setInteractive()
    this.backgroundNight.visible = false
    this.backgroundNight.on('pointerdown', () => this.moveBaxie())

    this.gapsGroup = this.physics.add.group()
    this.pipesGroup = this.physics.add.group()
    this.floorGroup = this.physics.add.group()


    this.upButton = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);

    // this.anims.create({
    //   key: 'moving',
    //   frames: this.anims.generateFrameNumbers(assets.scene.floor, {
    //     start: 0,
    //     end: 2
    //   }),
    //   frameRate: 3,
    //   repeat: -1
    // });

    this.setupGame()
  }

  update () {
    if (this.framesMoveUp > 0) {
      this.framesMoveUp--;
    } else if (Phaser.Input.Keyboard.JustDown(this.upButton)) {
      this.moveBaxie();
    } else {
      this.player.setVelocityY(120)

      if (this.player.angle < 90) {
        this.player.angle += 1
      }
    }

    this.pipesGroup.children.iterate((child) => {
      if (child === undefined) {
        return;
      }

      if (child.x < -50) {
        child.destroy();
      } else {
        child.setVelocityX(this.velocityX);
      }
    });

    this.gapsGroup.children.iterate((child) => {
      child.body.setVelocityX(this.velocityX);
    });

    this.nextPipes++;
    if (this.nextPipes >= this.nextFrame) {

      this.makePipes();
      this.nextPipes = 0;
    }

    if (this.backgroundDay.visible) {
      this.backgroundDay.tilePositionX += 0.6;
    }

    if (this.backgroundNight.visible) {
      this.backgroundNight.tilePositionX += 0.6;
    }
  }

  hitBaxie() {
    this.scene.pause();
    this.score = 0;
    this.setLevel();
    this.scene.launch('GameOverScene');
  }

  updateScore(_, gap) {
    this.score++;
    gap.destroy();

    if (this.score % 10 === 0) {
      this.backgroundDay.tilePositionX = 0;
      this.backgroundNight.tilePositionX = 0;

      this.backgroundDay.visible = !this.backgroundDay.visible;
      this.backgroundNight.visible = !this.backgroundNight.visible;

      if (this.currentPipe === assets.obstacle.pipe.green) {
        this.currentPipe = assets.obstacle.pipe.red;
      } else {
        this.currentPipe = assets.obstacle.pipe.green;
      }
    }

    this.setLevel();
    this.scoreTxt.setText(this.score.toString());
  }


  makePipes(initialX = 1100) {
    const pipeTopY = Phaser.Math.Between(-100, 40);
    let coinYPos = 255;

    if (this.score > 5) {
      coinYPos = 250;
    } else if (this.score > 10) {
      coinYPos = 240;
    } else if (this.score > 15) {
      coinYPos = 230;
    } else if (this.score > 20) {
      coinYPos = 227;
    }

    const ronenCoin = this.add.image(initialX, pipeTopY + coinYPos, assets.scene.ronenCoin)

    this.gapsGroup.add(ronenCoin);
    ronenCoin.body.allowGravity = false;

    const pipeTop = this.pipesGroup.create(initialX, pipeTopY, this.currentPipe.top)
    pipeTop.body.allowGravity = false

    const pipeBottom = this.pipesGroup.create(initialX, pipeTopY + (coinYPos * 2), this.currentPipe.bottom)
    pipeBottom.body.allowGravity = false
  }

  moveBaxie() {
    this.player.setVelocityY(-400);
    this.player.angle = -15;
    this.framesMoveUp = 5;
  }

  setupGame() {
    this.framesMoveUp = 0
    this.nextPipes = 0
    this.currentPipe = assets.obstacle.pipe.green
    this.score = 0
    this.backgroundDay.visible = true;
    this.backgroundNight.visible = false;

    if (this.player) {
      this.player.destroy()
    }

    this.pipesGroup.clear(true, true)
    this.gapsGroup.clear(true, true)
    this.floorGroup.clear(true, true)

    this.player = this.physics.add.sprite(220, 265, this.selectedBaxie)
      .setScale(1.2);
    this.player.setCollideWorldBounds(true)
    this.player.body.allowGravity = false;

    this.physics.add.collider(this.player, this.floorGroup, this.hitBaxie, null, this);
    this.physics.add.collider(this.player, this.pipesGroup, this.hitBaxie, null, this);
    this.physics.add.overlap(this.player, this.gapsGroup, this.updateScore, null, this);
    //
    this.floor = this.floorGroup.create(0, 450, assets.scene.floor)
      .setOrigin(0, 0);
    this.floor.body.allowGravity = false
    this.floor.setDepth(30);


    this.physics.resume();
    this.makePipes(450);
    this.makePipes(700);
    this.makePipes(1000);

  }
}
