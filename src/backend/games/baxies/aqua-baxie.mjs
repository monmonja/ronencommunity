import Baxie from "./baxie.mjs";
import {EFFECTS} from "./effects.mjs";
import SkillManager from "./baxie-simulation/skill-manager.mjs";

export default class AquaBaxie extends Baxie {
  constructor(props) {
    super(props);
    this.populateSkills(["tidalShield", "bubbleTrap", "oceansEmbrace"]);
  }

  // Tidal Shield – Shields all allies for 20% of max Stamina for 2 turns.
  /**
   * @param enemies {Baxie[]}
   * @param allies {Baxie[]}
   * @returns BaxieSkillReturn
   */
  tidalShield(enemies, allies) {
    /**
     * @type BaxieSkillReturnItem[]
     */
    const resultsAllies = [];

    allies.forEach((ally) => {
      const shieldValue = Math.floor(ally.getMaxStamina() * 0.2);

      /**
       * @type BaxieEffect
       */
      const shieldEffect = { type: EFFECTS.shield, value: shieldValue, turnsLeft: 2 };

      ally.addEffect(shieldEffect);

      resultsAllies.push({ target: ally.tokenId, effects: [shieldEffect] });
    });

    return { allies: resultsAllies };
  }

  // 100% damage and 20% chance to silence the enemy for 1 turn.
  /**
   * @param enemies {Baxie[]}
   * @returns BaxieSkillReturn
   */
  bubbleTrap(enemies) {
    /**
     * @type BaxieSkillReturnItem[]
     */
    const resultEnemies = [];
    const target = SkillManager.getBaxieFromPosition(enemies, 1)[0];
    const damage = this.calculateDamage(this.getCurrentAttack(), target.getCurrentDefense());

    target.takeDamage(damage);
    resultEnemies.push({target: target.tokenId, damage });

    if (Math.random() < 0.2) {
      /**
       * @type BaxieEffect
       */
      const silenceEffect = { type: EFFECTS.silence, turnsLeft: 1 };

      target.addEffect(silenceEffect);
      resultEnemies[0].effects = [silenceEffect];
    }

    return {
      enemies: resultEnemies
    };
  }

  //  Heals lowest-HP ally for 15% HP and grants them +5 Defense for 2 turns.
  /**
   * @param enemies {Baxie[]}
   * @param allies {Baxie[]}
   * @returns BaxieSkillReturn
   */
  oceansEmbrace(enemies, allies) {
    /**
     * @type BaxieSkillReturnItem[]
     */
    const resultsAllies = [];
    // find lowest HP ally
    /**
     * @type {Baxie}
     */
    const target = allies.reduce((lowest, ally) =>
      (ally.currentHP / ally.getMaxHP()) < (lowest.currentHP / lowest.getMaxHP()) ? ally : lowest, allies[0]
    );

    const healAmount = Math.floor(target.getMaxHP() * 0.15);

    target.currentHP = Math.min(target.currentHP + healAmount, target.getMaxHP());
    resultsAllies.push({ target: target.tokenId, healed: healAmount });

    // defense buff
    /**
     * @type BaxieEffect
     */
    const defenseEffect = { type: EFFECTS.defenseBoost, value: 5, turnsLeft: 2 };

    target.addEffect(defenseEffect);
    resultsAllies[0].effects = [defenseEffect];

    return {
      allies: resultsAllies,
    };
  }
}
