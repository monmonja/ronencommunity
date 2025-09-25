import { Baxie } from './Baxie.mjs';

export class ElectricBaxie extends Baxie {
  skills = [
    { func: 'voltOverload', cost: 40 },
    { func: 'chargeUp', cost: 30 },
    { func: 'stormBreaker', cost: 10 },
  ];

  voltOverload(enemies) {
    const results = [];
    // Randomly target 2 enemies
    const targets = enemies.sort(() => 0.5 - Math.random()).slice(0, 2);

    targets.forEach((target) => {
      const effectiveDefense = target.getCurrentDefense();
      const rawDamage = Math.floor(this.getCurrentAttack() * 0.75) - effectiveDefense;
      const damage = Math.max(rawDamage, 0);

      target.attackFromOther(damage);

      if (Math.random() < 0.2) {
        target.addEffect({ type: 'stun', turnsLeft: 1 });
      }

      results.push({ target: target.tokenId, damage: damage, stunned: target.hasEffect('stun') });
    });

    return { skill: 'voltOverload', results };
  }

  chargeUp() {
    const staminaGain = Math.floor(this.getMaxStamina() * 0.1);
    this.currentStamina = Math.min(this.currentStamina + staminaGain, this.getMaxStamina());

    this.addEffect({ type: 'attackBoost', value: 0.1, turnsLeft: 1 });

    return { skill: 'chargeUp', staminaRestored: staminaGain, effects: this.effects };
  }

  stormBreaker(enemies) {
    const results = [];
    enemies.forEach(target => {
      let multiplier = 0.5;

      if (target.hasEffect('stun')) {
        multiplier += 0.2;
      }

      const effectiveDefense = target.getCurrentDefense();
      const rawDamage = Math.floor(this.getCurrentAttack() * multiplier) - effectiveDefense;
      const damage = Math.max(rawDamage, 0);

      target.attackFromOther(damage);

      results.push({ target: target.tokenId, damage, stunned: target.hasEffect('stun') });
    });

    return { skill: 'stormBreaker', results };
  }
}
