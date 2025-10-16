import Baxie from './Baxie.mjs';
import { EFFECTS } from "./effects.mjs";
import SkillManager from "./baxie-simulation/skill-manager.mjs";

export default class ElectricBaxie extends Baxie {
  constructor(props) {
    super(props);
    this.populateSkills(['voltOverload', 'chargeUp', 'stormBreaker']);
  }

  // Strikes 2 random enemies (75% Attack each). 20% chance to stun for 1 turn.
  /**
   * @param enemies {Baxie[]}
   * @returns BaxieSkillReturn
   */
  voltOverload(enemies) {
    try {
      /**
       * @type {BaxieSkillReturnItem[]}
       */
      const resultsEnemies = [];

      // Randomly target 2 enemies
      const targets = SkillManager.getBaxieFromPosition(enemies, 2);

      targets.forEach((target) => {
        const damage = this.calculateDamage(this.getCurrentAttack() * 0.75, target.getCurrentDefense());

        target.takeDamage(damage);
        const enemyResult = { target: target.tokenId, damage };

        if (Math.random() < 0.2) {
          /**
           * @type BaxieEffect
           */
          const stunEffect = { type: EFFECTS.stunned, turnsLeft: 1 };
          target.addEffect(stunEffect);
          enemyResult.effects = [stunEffect];
        }
        resultsEnemies.push(enemyResult);
      });

      return { enemies: resultsEnemies};
    } catch (error) {
      console.error("Error in voltOverload:", error);
    }
  }

  // Restores 10% Stamina and grants +10% Attack for 1 turn.
  /**
   * @returns BaxieSkillReturn
   */
  chargeUp() {
    /**
     * @type BaxieSkillReturnItem[]
     */
    const alliesResults = [];
    const staminaGain = Math.floor(this.getMaxStamina() * 0.1);
    this.currentStamina = Math.min(this.currentStamina + staminaGain, this.getMaxStamina());

    const attackEffect = { type: EFFECTS.attackBoost, value: 0.1, turnsLeft: 1 };
    this.addEffect(attackEffect);
    alliesResults.push({ target: this.tokenId, staminaRestored: staminaGain, effects: [attackEffect] });

    return { allies: alliesResults };
  }

  // 50% damage to all enemies. Stunned enemies take +20% extra damage this turn.
  /**
   * @param enemies {Baxie[]}
   * @returns BaxieSkillReturn
   */
  stormBreaker(enemies) {
    /**
     * @type BaxieSkillReturnItem[]
     */
    const enemiesResult = [];

    enemies.forEach((target) => {
      let multiplier = 0.5;

      if (target.hasEffect(EFFECTS.stunned)) {
        multiplier += 0.2;
      }

      const damage = this.calculateDamage(this.getCurrentAttack() * multiplier, target.getCurrentDefense());

      target.takeDamage(damage);

      enemiesResult.push({ target: target.tokenId, damage });
    });

    return { enemies: enemiesResult };
  }
}
