import 'phaser';
import Baxie from "./baxie";
export default class DemonBaxie extends Baxie {

  //  – Ignores 20% of enemy Defense, lifesteals 15% of damage dealt.
  shadowStrike(target: Baxie) {
    const ignoreDefense = target.getCurrentDefense() * 0.2;
    const effectiveDefense = target.getCurrentDefense() - ignoreDefense;

    const rawDamage = this.getCurrentAttack() - effectiveDefense;
    const damage = Math.max(rawDamage, 0);

    // Apply damage
    target.attackFromOther(damage);

    // Lifesteal 15%
    const lifesteal = Math.floor(damage * 0.15);
    this.currentHP = Math.min(this.currentHP + lifesteal, this.getMaxHP());

    return { damage, lifesteal };
  }

  /**
   * Cursed Chains – 120% single-target damage, reduces enemy Stamina by 20%.
   * If Stamina reaches 0, target takes +10% extra damage for 1 turn.
   */
  cursedChains(target: Baxie) {
    const damageMultiplier = 1.2;
    const rawDamage = (this.getCurrentAttack() * damageMultiplier) - target.getCurrentDefense();
    const damage = Math.max(rawDamage, 0);

    // Apply damage
    target.attackFromOther(damage);

    // Reduce stamina
    target.currentStamina = Math.max(0, target.currentStamina - (target.getMaxStamina() * 0.2));

    let debuffApplied = false;
    if (target.currentStamina === 0) {
      // Apply a temporary effect: takes +10% damage for 1 turn
      target.effects.push({ type: "extraDamageTaken", percent: 0.1, turnsLeft: 1 });
      debuffApplied = true;
    }

    return { damage, staminaReduced: true, debuffApplied };
  }

  /**
   * Soul Feast – Sacrifices 20% of own HP to deal 50% damage to all enemies.
   * If an enemy falls, Demon restores 15% of the sacrificed HP.
   */
  soulFeast(enemies: Baxie[]) {
    const hpSacrifice = Math.floor(this.getMaxHP() * 0.2);
    this.currentHP = Math.max(1, this.currentHP - hpSacrifice); // cannot suicide

    const damageDealt: { target: Baxie; damage: number; killed: boolean }[] = [];
    let restoreAmount = 0;

    enemies.forEach(enemy => {
      const rawDamage = (this.getCurrentAttack() * 0.5) - enemy.getCurrentDefense();
      const damage = Math.max(rawDamage, 0);

      enemy.attackFromOther(damage);

      const killed = enemy.currentHP <= 0;

      if (killed) {
        restoreAmount = Math.floor(hpSacrifice * 0.15);
      }

      damageDealt.push({ target: enemy, damage, killed });
    });

    this.currentHP = Math.min(this.currentHP + restoreAmount, this.getMaxHP());

    return { sacrificed: hpSacrifice, damageDealt, restored: restoreAmount };
  }

}
