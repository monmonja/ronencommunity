import 'phaser';
import Baxie from "./baxie";
export default class FireBaxie extends Baxie {
  skills = [
    { func: 'blazingBurst', cost: 40 },
    { func: 'infernoWave', cost: 30 },
    { func: 'phoenixReign', cost: 10 },
  ]
  /**
   * Blazing Burst – 140% single-target damage.
   * 20% chance to apply Burn (damage over 2 turns).
   */
  blazingBurst(targets: Baxie[]) {
    const target = targets[0];
    console.log('use blazing burst');
    const damageMultiplier = 1.4;
    const rawDamage = (this.getCurrentAttack() * damageMultiplier) - target.getCurrentDefense();
    const damage = Math.max(rawDamage, 0);

    target.attackFromOther(damage);

    // 20% burn chance
    const burned = Math.random() < 0.2;
    if (burned) {
      target.effects.push({
        type: "burn",
        damage: Math.floor(this.getCurrentAttack() * 0.1), // burn damage tick
        turnsLeft: 2,
      });
    }

    return { damage, burned };
  }

  /**
   * Inferno Wave – 60% Attack damage to all enemies.
   * 15% chance to reduce their Attack by 5% for 1 turn.
   */
  infernoWave(targets: Baxie[]) {
    const results: { target: Baxie; damage: number; attackReduced: boolean }[] = [];
    console.log('use inferno wave');

    targets.forEach((enemy) => {
      const rawDamage = (this.getCurrentAttack() * 0.6) - enemy.getCurrentDefense();
      const damage = Math.max(rawDamage, 0);

      enemy.attackFromOther(damage);

      let attackReduced = false;
      if (Math.random() < 0.15) {
        enemy.effects.push({
          type: "attackDown",
          percent: 0.05, // 5% reduction
          turnsLeft: 1,
        });
        attackReduced = true;
      }

      results.push({ target: enemy, damage, attackReduced });
    });

    return results;
  }

  /**
   * Phoenix Reign – If Fire Baxie defeats an enemy, it restores 15% Stamina
   * and gains +50% Attack for 1 turn.
   */
  phoenixReign(targets: Baxie[]) {
    const target = targets[0];
console.log('use phoenix reign')

    const rawDamage = (this.getCurrentAttack() * 0.1) - target.getCurrentDefense();
    const damage = Math.max(rawDamage, 5); // minimum 5 damage

    target.attackFromOther(damage);

    // Enemy defeated?
    const killed = target.currentHP <= 0; // or switch to HP pool later

    if (killed) {
      // Restore 15% stamina
      const restored = Math.floor(this.getMaxStamina() * 0.15);
      this.currentStamina = Math.min(this.getMaxStamina(), this.currentStamina + restored);

      // Gain +50% attack for 1 turn
      this.effects.push({
        type: "attackBuff",
        percent: 0.5,
        turnsLeft: 1,
      });

      return { killed: true, restored, buffApplied: true };
    }

    return { killed: false };
  }
}
