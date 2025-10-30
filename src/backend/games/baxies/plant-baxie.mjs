import Baxie from "./baxie.mjs";
import {EFFECTS} from "./effects.mjs";

export default class PlantBaxie extends Baxie {
  constructor(props) {
    super(props);
    this.populateSkills(["naturesResurgence", "thornGuard", "bloomOvergrowth"]);
  }

  /**
   * Nature’s Resurgence – Restores 15% Stamina to all allies.
   */
  naturesResurgence(enemies, allies) {
    try {
      const restored = [];

      allies
        .filter((ally) => ally.isAlive())
        .forEach(ally => {
          const restoreAmount = Math.floor(ally.getMaxStamina() * 0.15);

          ally.setStamina(ally.currentStamina + restoreAmount);
          restored.push({ target: ally.tokenId, restoreAmount });
        });

      return { restored };
    } catch (error) {
      console.error("Error in naturesResurgence:", error);
    }
  }

  /**
   * Thorn Guard – Reflects 20% of incoming physical damage for 2 turns.
   */
  thornGuard() {
    try {
      const alliesResults = [];
      const reflectEffect = {
        type: EFFECTS.reflect,
        damageType: "physical",
        value: 0.2, // 20% reflect
        turnsLeft: 2,
      };

      this.addEffect(reflectEffect);
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
      const alliesResult = [];

      allies.forEach((ally) => {
        const healAmount = Math.floor(ally.getMaxHP() * 0.1);

        ally.addHp(healAmount);
        alliesResult.push({ target: ally.tokenId, heal: healAmount });
      });

      return { allies: alliesResult };
    } catch (error) {
      console.error("Error in bloomOvergrowth:", error);
    }
  }
}
