import * as Phaser from 'phaser';
import getRandomisedBaxie from "../../common/baxie/randomised-baxie";
import Baxie from "../../common/baxie/baxie";

export default class GameScene extends Phaser.Scene {
  private round: number = 0;
  private enemyTeam: Baxie[] | undefined;
  private playerTeam: Baxie[] | undefined;
  private turnQueue: Baxie[] | undefined;
  private currentTurnBaxie: Baxie | undefined;
  private isPlayerTurn: boolean;
  private skillContainer!: Phaser.GameObjects.Container;

  constructor() {
    super('GameScene');
    this.isPlayerTurn = true;
  }

  create() {
    this.playerTeam  = [getRandomisedBaxie(this, 200, 100)];
    this.enemyTeam = [getRandomisedBaxie(this, 500, 100)];

    this.playerTeam.forEach((baxie) => {
      baxie.enemies = this.enemyTeam ?? [];
    });
    this.enemyTeam.forEach((baxie) => {
      baxie.enemies = this.playerTeam ?? [];
    });

    this.skillContainer = this.add.container(100, 400);

    this.startRound();

    this.game.events.on('EndTurn', () => {
      console.log('******** End turn ******')
      this.nextTurn();
    }, this);
  }

  startRound() {
    if (this.playerTeam && this.enemyTeam) {
      this.round += 1;

      // Create turn queue with all alive Baxies
      this.turnQueue = [...this.playerTeam, ...this.enemyTeam].filter(b => b.currentHP > 0);

      this.turnQueue.sort(() => Math.random() - 0.5);
      console.log(`--- Round ${this.round} ---`);
      this.nextTurn();
    }
  }

  nextTurn() {
    if (this.playerTeam && this.enemyTeam) {
      const enemiesAlive = this.enemyTeam.filter((b) => b.currentHP > 0);
      const playersAlive = this.playerTeam.filter((b) => b.currentHP > 0);

      if (enemiesAlive.length > 0 && playersAlive.length > 0) {
        if (this.turnQueue && this.turnQueue.length === 0) {
          this.startRound();

          return;
        }
      }

      this.currentTurnBaxie = this.turnQueue?.shift();
      if (this.currentTurnBaxie) {
        this.isPlayerTurn = this.playerTeam.includes(this.currentTurnBaxie!);

        if (this.isPlayerTurn) {
          this.handlePlayerTurn(this.currentTurnBaxie);
        } else {
          this.handleCpuTurn(this.currentTurnBaxie);
        }
      }
    } else {
      console.log('no this.currentTurnBaxie', this.currentTurnBaxie)
    }
  }

  handlePlayerTurn(baxie: Baxie) {
    console.log('player turn')

    baxie.renderSkills(this.skillContainer);
  }

  handleCpuTurn(baxie: Baxie) {
    if (!this.currentTurnBaxie) {
      return;
    }

    // @ts-ignore
    this.time!.delayedCall(300, () => {
      if (baxie) {
        const availableSkills = baxie.skills.filter((skill) => baxie.currentStamina >= skill.cost);

        const skill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
        const enemiesAlive = baxie.enemies.filter((b) => b.currentHP > 0);

        if (skill) {
          baxie.useStamina(skill.cost);
          baxie[skill.func](enemiesAlive);
        }

        this.time!.delayedCall(1000, () => {
          this.nextTurn();
        });
      }
    });
  }
}
