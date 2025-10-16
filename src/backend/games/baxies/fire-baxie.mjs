import Baxie from './Baxie.mjs';
import {EFFECTS} from "./effects.mjs";
import SkillManager from "./baxie-simulation/skill-manager.mjs";

export default class FireBaxie extends Baxie {
  constructor(props) {
    super(props);
    this.populateSkills(['blazingBurst', 'infernoWave', 'phoenixReign']);
  }

  // Blazing Burst – 140% damage, 20% chance burn (2 turns)
  blazingBurst(enemies) {
    const enemiesResults = [];
    const target = SkillManager.getBaxieFromPosition(enemies, 1)[0];
    console.log(this.getCurrentAttack() * 1.4, target.getCurrentDefense());
    const damage = this.calculateDamage(this.getCurrentAttack() * 1.4, target.getCurrentDefense());

    target.takeDamage(damage);
    enemiesResults.push({ target: target.tokenId, damage });

    if (Math.random() < 0.2) {
      const burnedEffect = { type: EFFECTS.burn, turnsLeft: 2, damage: Math.floor(this.getCurrentAttack() * 0.2) };
      target.addEffect(burnedEffect);
      enemiesResults[0].effects = [burnedEffect];
    }

    return {
      enemies: enemiesResults,
    };
  }

  // Inferno Wave – 60% AoE, 15% chance -5% Attack for 1 turn
  infernoWave(enemies) {
    const enemiesResult = [];
    enemies.forEach((target) => {
      const damage = this.calculateDamage(this.getCurrentAttack() * 0.6, target.getCurrentDefense());
      const hpBefore = target.currentHP;
      target.takeDamage(damage);

      let attackReduced = false;
      if (Math.random() < 0.15) {
        target.addEffect({ type: 'attackDebuff', value: -0.05, duration: 1 });
        attackReduced = true;
      }

      enemiesResult.push({
        target: target.tokenId,
        damage,
        attackReduced,
        defeated: hpBefore > 0 && target.currentHP <= 0
      });
    });

    return { enemies: enemiesResult, };
  }

  // Phoenix Reign – conditional, check after a kill
  phoenixReign() {
    const staminaGain = Math.floor(this.getMaxStamina() * 0.15);
    this.currentStamina = Math.min(this.currentStamina + staminaGain, this.getMaxStamina());

    this.addEffect({ type: 'attackBoost', value: 0.5, duration: 1 });

    // @todo
    return {
      skill: 'phoenixReign',
      staminaRestored: staminaGain,
      effects: this.effects
    };
  }

  // Helper: call after any attack to check if Phoenix Reign should trigger
  checkPhoenixReign(results) {
    const defeated = Array.isArray(results)
      ? results.some(r => r.defeated)
      : results.defeated;

    if (defeated) {
      return this.phoenixReign();
    }
    return null;
  }
}
