import Baxie from './Baxie.mjs';
import {EFFECTS} from "./effects.mjs";

export default class FairyBaxie extends Baxie {
  skills = [
    { func: 'arcaneBlessing', cost: 35, cooldown: 15, image: 'fairy-arcane-blessing' },
    { func: 'pixieVeil', cost: 25, cooldown: 15, image: 'fairy-pixie-veil' },
    { func: 'celestialHarmony', cost: 40, cooldown: 15, image: 'fairy-celestial-harmony' },
  ];

  //  Heals all allies by 12% HP, boosts their Attack by 5% for 2 turns.
  /**
   * @param enemies {Baxie[]}
   * @param allies {Baxie[]}
   * @returns BaxieSkillReturn
   */
  arcaneBlessing(enemies, allies) {
    /**
     * @type {BaxieSkillReturnItem[]}
     */
    const alliesResults = [];
    allies.forEach((ally) => {
      const heal = Math.floor(ally.getMaxHP() * 0.12);

      ally.currentHP = Math.min(ally.currentHP + heal, ally.getMaxHP());

      const attackBuffEffect = { type: EFFECTS.attackBoost, value: 0.05, turnsLeft: 2 };
      ally.addEffect(attackBuffEffect);
      alliesResults.push({ target: ally.tokenId, healed: heal, effects: [attackBuffEffect] });
    });

    return {
      allies: alliesResults,
    };
  }

  // Reduces ally damage taken by 15% for 1 turn.
  /**
   * @param enemies {Baxie[]}
   * @param allies {Baxie[]}
   * @returns BaxieSkillReturn
   */
  pixieVeil(enemies, allies) {
    /**
     * @type {BaxieSkillReturnItem[]}
     */
    const alliesResults = [];
    const ally = allies.sort(() => 0.5 - Math.random()).slice(0, 1)[0];

    /**
     * @type BaxieEffect
     */
    const damageReductionEffect = { type: EFFECTS.reduceDamageTaken, value: 0.15, turnsLeft: 1 };
    ally.addEffect(damageReductionEffect);
    alliesResults.push({ target: ally.tokenId, effects: [damageReductionEffect] });

    return {
      allies: alliesResults,
    };
  }

  // Restores 50% of one ally’s Stamina and increases their skill damage by 15% for 2 turns.
  /**
   * @param enemies {Baxie[]}
   * @param allies {Baxie[]}
   * @returns BaxieSkillReturn
   */
  celestialHarmony(enemies, allies) {
    /**
     * @type {BaxieSkillReturnItem[]}
     */
    const alliesResults = [];
    const ally = allies.sort(() => 0.5 - Math.random()).slice(0, 1)[0];

    const staminaGain = Math.floor(ally.getMaxStamina() * 0.5);
    ally.currentStamina = Math.min(ally.currentStamina + staminaGain, ally.getMaxStamina());

    /**
     * @type BaxieEffect
     */
    const skillDmgBuffEffect = { type: EFFECTS.skillDamageBoost, value: 0.15, turnsLeft: 2 };
    ally.addEffect(skillDmgBuffEffect);
    alliesResults.push({ target: ally.tokenId, staminaRestored: staminaGain, effects: [skillDmgBuffEffect] });

    return {
      allies: alliesResults,
    };
  }
}
