import Phaser from 'phaser';
import { assets } from "../constants.mjs";

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
    this.nextPipes = null;
    this.currentPipe = null;
  }
  
  preload() {
    this.load.image(assets.scene.ronenCoin, '/game-assets/flappy-baxie/images/ronen.png')

    // Pipes
    this.load.image(assets.obstacle.pipe.green.top, '/game-assets/flappy-baxie/images/pipe-green-top.png')
    this.load.image(assets.obstacle.pipe.green.bottom, '/game-assets/flappy-baxie/images/pipe-green-bottom.png')
    this.load.image(assets.obstacle.pipe.red.top, '/game-assets/flappy-baxie/images/pipe-red-top.png')
    this.load.image(assets.obstacle.pipe.red.bottom, '/game-assets/flappy-baxie/images/pipe-red-bottom.png')
  }

  init(data) {
    this.selectedBaxie = data.selectedBaxie;
  }

  /**
   *   Create the game objects (images, groups, sprites).
   */
  create() {
    this.backgroundDay = this.add.image(0, 0, assets.scene.background.day).setOrigin(0, 0).setInteractive()
    this.backgroundDay.on('pointerdown', () => this.moveBaxie())
    this.backgroundNight = this.add.image(0, 0, assets.scene.background.night).setOrigin(0, 0).setInteractive()
    this.backgroundNight.visible = false
    this.backgroundNight.on('pointerdown', () => this.moveBaxie())

    this.gapsGroup = this.physics.add.group()
    this.pipesGroup = this.physics.add.group()

    this.scoreTxt = this.add.text(this.sys.game.config.width / 2, 84, '', {
      fontFamily: 'troika',
      fontSize: '50px',
      color: '#FFF'
    }).setOrigin(0.5, 0);
    this.scoreTxt.setDepth(30);

    this.upButton = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);

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

    this.pipesGroup.children.iterate(function (child) {
      if (child === undefined) {
        return;
      }

      if (child.x < -50) {
        child.destroy();
      } else {
        child.setVelocityX(-100);
      }
    });

    this.gapsGroup.children.iterate(function (child) {
      child.body.setVelocityX(-100);
    });

    this.nextPipes++;

    if (this.nextPipes === 130) {
      this.makePipes();
      this.nextPipes = 0;
    }
  }

  hitBaxie() {
    this.scene.pause();
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

    this.scoreTxt.setText(this.score.toString());
  }


  makePipes() {
    const pipeTopY = Phaser.Math.Between(-100, 40);
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

    this.player = this.physics.add.sprite(80, 265, this.selectedBaxie)
    this.player.setCollideWorldBounds(true)
    this.player.body.allowGravity = false;

    this.physics.add.collider(this.player, this.pipesGroup, this.hitBaxie, null, this);
    this.physics.add.overlap(this.player, this.gapsGroup, this.updateScore, null, this);

    this.physics.resume();
    this.makePipes();
  }
}
