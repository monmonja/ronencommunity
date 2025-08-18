import Phaser from 'phaser';
import { assets } from "../constants.mjs";

const levels = [
  {
    maxScore: 1,
    velocityX: -100,
    nextFrame: 130,
  },
  {
    maxScore: 4,
    velocityX: -150,
    nextFrame: 120,
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
    nextFrame: 50,
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
    nextFrame: 45,
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
  
  preload() {
    this.load.image(assets.scene.ronenCoin, '{{config.cdnLink}}/game-assets/flappy-baxie/images/ronen.png')

    this.load.spritesheet(assets.scene.floor, '{{config.cdnLink}}/game-assets/flappy-baxie/images/floor.webp', {
      frameWidth: 370,
      frameHeight: 112
    })

    // Pipes
    this.load.image(assets.obstacle.pipe.green.top, '{{config.cdnLink}}/game-assets/flappy-baxie/images/pipe-green-top.png')
    this.load.image(assets.obstacle.pipe.green.bottom, '{{config.cdnLink}}/game-assets/flappy-baxie/images/pipe-green-bottom.png')
    this.load.image(assets.obstacle.pipe.red.top, '{{config.cdnLink}}/game-assets/flappy-baxie/images/pipe-red-top.png')
    this.load.image(assets.obstacle.pipe.red.bottom, '{{config.cdnLink}}/game-assets/flappy-baxie/images/pipe-red-bottom.png')
  }

  init(data) {
    this.selectedBaxie = data.selectedBaxie;
  }

  /**
   *   Create the game objects (images, groups, sprites).
   */
  create() {
    this.add.image(0, 0, assets.scene.floor).setOrigin(0, 0).setInteractive()

    this.backgroundDay = this.add.image(0, 0, assets.scene.background.day).setOrigin(0, 0).setInteractive()
    this.backgroundDay.on('pointerdown', () => this.moveBaxie())
    this.backgroundNight = this.add.image(0, 0, assets.scene.background.night).setOrigin(0, 0).setInteractive()
    this.backgroundNight.visible = false
    this.backgroundNight.on('pointerdown', () => this.moveBaxie())

    this.gapsGroup = this.physics.add.group()
    this.pipesGroup = this.physics.add.group()
    this.floorGroup = this.physics.add.group()

    this.scoreTxt = this.add.text(this.sys.game.config.width / 2, 84, '', {
      fontFamily: 'troika',
      fontSize: '50px',
      color: '#FFF'
    }).setOrigin(0.5, 0);
    this.scoreTxt.setDepth(30);

    this.upButton = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);

    this.anims.create({
      key: 'moving',
      frames: this.anims.generateFrameNumbers(assets.scene.floor, {
        start: 0,
        end: 2
      }),
      frameRate: 3,
      repeat: -1
    })

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

    this.floor.anims.play('moving', true)

    this.nextPipes++;

    if (this.nextPipes >= this.nextFrame) {
      this.makePipes();
      this.nextPipes = 0;
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


  makePipes() {
    const pipeTopY = Phaser.Math.Between(-120, 30);
    const ronenCoin = this.add.image(388, pipeTopY + 240, assets.scene.ronenCoin)

    this.gapsGroup.add(ronenCoin);
    ronenCoin.body.allowGravity = false;

    const pipeTop = this.pipesGroup.create(388, pipeTopY, this.currentPipe.top)
    pipeTop.body.allowGravity = false

    const pipeBottom = this.pipesGroup.create(388, pipeTopY + 500, this.currentPipe.bottom)
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

    this.player = this.physics.add.sprite(80, 265, this.selectedBaxie)
    this.player.setCollideWorldBounds(true)
    this.player.body.allowGravity = false;

    this.physics.add.collider(this.player, this.floorGroup, this.hitBaxie, null, this);
    this.physics.add.collider(this.player, this.pipesGroup, this.hitBaxie, null, this);
    this.physics.add.overlap(this.player, this.gapsGroup, this.updateScore, null, this);

    this.floor = this.floorGroup.create(185, 500, assets.scene.floor)
    this.floor.body.allowGravity = false
    this.floor.setCollideWorldBounds(true)
    this.floor.setDepth(30);

    this.physics.resume();
    this.makePipes();

  }
}
