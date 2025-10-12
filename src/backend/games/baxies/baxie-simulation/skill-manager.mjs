export default class SkillManager {
  static skills = [
    { func: 'tidalShield', cost: 35, cooldown: 15, image: 'water-tidal-shield' },
    { func: 'bubbleTrap', cost: 30, cooldown: 15, image: 'water-bubble-trap' },
    { func: 'oceansEmbrace', cost: 40, cooldown: 15, image: 'water-oceans-embrace' },
    { func: 'voltOverload', cost: 40, cooldown: 15, image: 'electric-volt-overload' },
    { func: 'chargeUp', cost: 30, cooldown: 15, image: 'electric-charge-up' },
    { func: 'stormBreaker', cost: 10, cooldown: 15, image: 'electric-storm-breaker' },
    { func: 'shadowStrike', cost: 40, cooldown: 15, image: 'shadow-shadow-strike' },
    { func: 'cursedChains', cost: 30, cooldown: 15, image: 'shadow-cursed-chains' },
    { func: 'soulFeast', cost: 10, cooldown: 15, image: 'shadow-soul-feast' },
    { func: 'arcaneBlessing', cost: 35, cooldown: 15, image: 'fairy-arcane-blessing' },
    { func: 'pixieVeil', cost: 25, cooldown: 15, image: 'fairy-pixie-veil' },
    { func: 'celestialHarmony', cost: 40, cooldown: 15, image: 'fairy-celestial-harmony' },
    { func: 'blazingBurst', cost: 35, cooldown: 15, image: 'fire-blazing-burst' },
    { func: 'infernoWave', cost: 40, cooldown: 15, image: 'fire-inferno-wave' },
    { func: 'phoenixReign', cost: 10, cooldown: 15, image: 'fire-phoenix-reign' },
    { func: 'naturesResurgence', cost: 30, cooldown: 15, image: 'plant-natures-resurgence' },
    { func: 'thornGuard', cost: 25, cooldown: 15, image: 'plant-thorn-guard' },
    { func: 'bloomOvergrowth', cost: 40, cooldown: 15, image: 'plant-bloom-overgrowth' },
  ]

  /**
   * @param {array} currentSkills
   */
  static getBaxieSkill(currentSkills, stamina) {
    const minStamina = 40;

    return this.skills
      .filter((skill) => currentSkills.includes(skill.func))
      .map(skill => {
        // inverse scaling
        let newCooldown = (skill.cooldown * minStamina) / stamina;

        // optional: prevent cooldown from going below 1 second
        if (newCooldown < 1) newCooldown = 1;

        return {
          ...skill,
          cooldown: newCooldown
        };
      });
  }

  /**
   *
   * @param baxies {Baxie[]}
   * @param count
   * @param excludeId
   * @returns {*[]}
   */
  static getBaxieFromPosition(baxies, count, excludeId = null) {
    const shuffle = (arr) => arr
      .map(a => ({ sort: Math.random(), value: a }))
      .sort((a, b) => a.sort - b.sort)
      .map(a => a.value);
    let frontBaxies = shuffle(baxies.filter((baxie) => baxie.isAlive() && baxie.position === 'F'));
    let backBaxies = shuffle(baxies.filter((baxie) => baxie.isAlive() && baxie.position === 'B'));

    if (excludeId) {
      frontBaxies = frontBaxies.filter((baxie) => baxie.tokenId !== excludeId);
      backBaxies = backBaxies.filter((baxie) => baxie.tokenId !== excludeId);
    }

    const selected = [];

    // Take from front first
    for (let i = 0; i < frontBaxies.length && selected.length < count; i++) {
      selected.push(frontBaxies[i]);
    }

    // If not enough, take from back
    for (let i = 0; i < backBaxies.length && selected.length < count; i++) {
      selected.push(backBaxies[i]);
    }

    return selected;
  }
}