import Baxie from './Baxie.mjs';

export default class PlantBaxie extends Baxie {
  constructor(props) {
    super(props);
    this.populateSkills(['naturesResurgence', 'thornGuard', 'bloomOvergrowth']);
  }

  /**
   * Nature’s Resurgence – Restores 15% Stamina to all allies.
   */
  naturesResurgence(enemies, allies) {
    try {
      const restored = [];

      allies.forEach(ally => {
        const restoreAmount = Math.floor(ally.getMaxStamina() * 0.15);
        ally.currentStamina = Math.min(ally.currentStamina + restoreAmount, ally.getMaxStamina());
        restored.push({ target: ally, restoreAmount });
      });

      return { restored };
    } catch (error) {
      console.error("Error in naturesResurgence:", error);
    }
  }

  /**
   * Thorn Guard – Reflects 20% of incoming physical damage for 2 turns.
   */
  thornGuard(enemies, allies) {
    try {
      const alliesResults = [];
      const reflectEffect = {
        type: "reflect",
        damageType: "physical",
        value: 0.2, // 20% reflect
        turnsLeft: 2,
      };
      this.effects.push(reflectEffect);
      alliesResults.push({ ally: this.tokenId, effects: [reflectEffect] });

      return { allies: alliesResults };
    } catch (error) {
      console.error("Error in thornGuard:", error);
    }
  }

  /**
   * Bloom Overgrowth – Heals all allies for 10% HP.
   */
  bloomOvergrowth(enemies, allies) {
    try {
      const healed = [];

      allies.forEach(ally => {
        const healAmount = Math.floor(ally.getMaxHP() * 0.1);
        ally.currentHP = Math.min(ally.currentHP + healAmount, ally.getMaxHP());
        healed.push({ target: ally, healAmount });
      });

      return { healed };
    } catch (error) {
      console.error("Error in bloomOvergrowth:", error);
    }
  }
}
