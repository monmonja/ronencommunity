import Baxie from "./baxie.mjs";
import {EFFECTS} from "./effects.mjs";
import SkillManager from "./baxie-simulation/skill-manager.mjs";

export default class DemonBaxie extends Baxie {
  constructor(props) {
    super(props);
    this.populateSkills(["shadowStrike", "cursedChains", "soulFeast"]);
  }

  //  – Ignores 20% of enemy Defense, life steals 15% of damage dealt.
  /**
   * @param enemies {Baxie[]}
   * @returns BaxieSkillReturn
   */
  shadowStrike(enemies) {
    try {
      /**
       * @type BaxieSkillReturnItem[]
       */
      const resultEnemies = [];
      const target = SkillManager.getBaxieFromPosition(enemies, 1)[0];

      const ignoreDefense = target.getCurrentDefense() * 0.2;
      const effectiveDefense = target.getCurrentDefense() - ignoreDefense;
      const damage = this.calculateDamage(this.getCurrentAttack(), effectiveDefense);

      // Apply damage
      target.takeDamage(damage);
      resultEnemies.push({ target: target.tokenId, damage });

      // Lifesteal 15%
      const lifeSteal = Math.floor(damage * 0.15);

      this.addHp(lifeSteal);

      return {
        lifeSteal,
        hp: this.currentHP,
        enemies: resultEnemies,
      };
    } catch (error) {
      console.error("Error in shadowStrike:", error);
    }
  }

  /**
   * Cursed Chains – 120% single-target damage, reduces enemy Stamina by 20%.
   * If Stamina reaches 0, target takes +10% extra damage for 1 turn.
   * @param {Baxie[]} enemies
   * @returns BaxieSkillReturn
   */
  cursedChains(enemies) {
    try {
      /**
       * @type BaxieSkillReturnItem[]
       */
      const resultEnemies = [];
      const target = SkillManager.getBaxieFromPosition(enemies, 1)[0];
      const damage = this.calculateDamage(this.getCurrentAttack() * 1.2, target.getCurrentDefense());

      // Apply damage
      target.takeDamage(damage);

      // Reduce stamina
      const staminaReduction = Math.floor(target.getMaxStamina() * 0.2);

      target.currentStamina = Math.max(0, target.currentStamina - staminaReduction);
      resultEnemies.push({ target: target.tokenId, damage, staminaReduction, stamina: target.currentStamina });

      if (target.currentStamina === 0) {
        // Apply a temporary effect: takes +10% damage for 1 turn
        /**
         * @type BaxieEffect
         */
        const extraDamageEffect = { type: EFFECTS.extraDamageTaken, value: 0.1, turnsLeft: 1 };

        target.addEffect(extraDamageEffect);
        resultEnemies[0].effects = [extraDamageEffect];
      }

      return {
        enemies: resultEnemies
      };
    } catch (error) {
      console.error("Error in cursedChains:", error);
    }
  }

  /**
   * Soul Feast – Sacrifices 20% of own HP to deal 50% damage to all enemies.
   * If an enemy falls, Demon restores 15% of the sacrificed HP.
   * @param {Baxie[]} enemies
   * @returns BaxieSkillReturn
   */
  soulFeast(enemies) {
    try {
      /**
       * @type {BaxieSkillReturnItem[]}
       */
      const resultsEnemies = [];
      const hpSacrifice = Math.floor(this.currentHP * 0.2);

      this.removeHp(hpSacrifice); // cannot suicide

      let restoreAmount = 0;
      let hasKilledAnEnemy = false;

      enemies.forEach((enemy) => {
        const damage = this.calculateDamage(this.getCurrentAttack() * 0.5, enemy.getCurrentDefense());

        enemy.takeDamage(damage);

        if (enemy.currentHP <= 0) {
          hasKilledAnEnemy = true;
        }

        resultsEnemies.push({target: enemy.tokenId, damage});
      });

      if (hasKilledAnEnemy) {
        restoreAmount = Math.floor(hpSacrifice * 0.15);
        this.addHp(restoreAmount);
      }

      /**
       * @type BaxieSkillReturn
       */
      return {
        hpSacrifice,
        enemies: resultsEnemies,
        hasKilledAnEnemy,
        restored: restoreAmount,
      };
    } catch (error) {
      console.error("Error in soulFeast:", error);
    }
  }
}
