import Baxie from './Baxie.mjs';
import {EFFECTS} from "./effects.mjs";

export default class FireBaxie extends Baxie {
  skills = [
    { func: 'blazingBurst', cost: 35, cooldown: 15, image: 'fire-blazing-burst' },
    { func: 'infernoWave', cost: 40, cooldown: 15, image: 'fire-inferno-wave' },
    { func: 'phoenixReign', cost: 10, cooldown: 15, image: 'fire-phoenix-reign' }, // passive/conditional
  ];

  // Blazing Burst – 140% damage, 20% chance burn (2 turns)
  blazingBurst(enemies) {
    const enemiesResults = [];
    const target = enemies.sort(() => 0.5 - Math.random()).slice(0, 1)[0];
    const effectiveDefense = target.getCurrentDefense();
    const rawDamage = (this.getCurrentAttack() * 1.4) - effectiveDefense;
    const damage = Math.max(rawDamage, 0);

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
    enemies.forEach(target => {
      const dmg = Math.floor(this.getCurrentAttack() * 0.6);
      const hpBefore = target.currentHP;
      target.takeDamage(dmg);

      let attackReduced = false;
      if (Math.random() < 0.15) {
        target.addEffect({ type: 'attackDebuff', value: -0.05, duration: 1 });
        attackReduced = true;
      }

      enemiesResult.push({
        target: target.tokenId,
        damage: dmg,
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
