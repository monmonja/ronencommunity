export default class SkillManager {
  static skills = [
    { func: 'tidalShield', cost: 35, cooldown: 15, image: 'water-tidal-shield',
      description: 'Shields all allies for 20% of max Stamina for 2 turns.',
    },
    { func: 'bubbleTrap', cost: 30, cooldown: 15, image: 'water-bubble-trap',
      description: '100% damage and 20% chance to silence the enemy for 1 turn.'
    },
    { func: 'oceansEmbrace', cost: 40, cooldown: 15, image: 'water-oceans-embrace',
      description: 'Heals lowest-HP ally for 15% HP and grants them +5 Defense for 2 turns.'
    },
    { func: 'voltOverload', cost: 40, cooldown: 15, image: 'electric-volt-overload',
      description: 'Strikes 2 random enemies (75% Attack each). 20% chance to stun for 1 turn.'
    },
    { func: 'chargeUp', cost: 20, cooldown: 15, image: 'electric-charge-up',
      description: 'Restores 10% Stamina, increases own Attack by 10% for 1 turn.'
    },
    { func: 'stormBreaker', cost: 30, cooldown: 15, image: 'electric-storm-breaker',
      description: '50% damage to all enemies. Stunned enemies take +20% extra damage this turn.'
    },
    { func: 'shadowStrike', cost: 40, cooldown: 15, image: 'shadow-shadow-strike',
      description: 'Ignores 20% of enemy Defense, lifesteals 15% of damage dealt.',
    },
    { func: 'cursedChains', cost: 30, cooldown: 15, image: 'shadow-cursed-chains',
      description: '120% single-target damage, reduces enemy Stamina by 20%. If Stamina reaches 0, target takes +10% extra damage for 1 turn.',
    },
    { func: 'soulFeast', cost: 20, cooldown: 15, image: 'shadow-soul-feast',
      description: 'Sacrifices 20% of own HP to deal 50% damage to all enemies. If an enemy falls, Demon restores 15% of the sacrificed HP.'
    },
    { func: 'arcaneBlessing', cost: 35, cooldown: 15, image: 'fairy-arcane-blessing',
      description: 'Heals all allies by 12% HP, boosts their Attack by 5% for 2 turns.',
    },
    { func: 'pixieVeil', cost: 25, cooldown: 15, image: 'fairy-pixie-veil',
      description: 'Reduces ally damage taken by 15% for 1 turn.',
    },
    { func: 'celestialHarmony', cost: 40, cooldown: 15, image: 'fairy-celestial-harmony',
      description: 'Restores 50% of one ally’s Stamina and increases their skill damage by 15% for 2 turns.',
    },
    { func: 'blazingBurst', cost: 50, cooldown: 15, image: 'fire-blazing-burst',
      description: '140% single-target damage. 20% chance to burn (damage over 2 turns).'
    },
    { func: 'infernoWave', cost: 35, cooldown: 15, image: 'fire-inferno-wave',
      description: '60% Attack damage to all enemies. 15% chance to reduce their Attack by 5% for 1 turn.'
    },
    { func: 'phoenixReign', cost: 20, cooldown: 15, image: 'fire-phoenix-reign',
      description: 'If Fire Baxie defeats an enemy, it restores 15% Stamina and gains +50% Attack for 1 turn.'
    },
    { func: 'naturesResurgence', cost: 30, cooldown: 15, image: 'plant-natures-resurgence',
      description: 'Restores 15% Stamina to all allies.',
    },
    { func: 'thornGuard', cost: 25, cooldown: 15, image: 'plant-thorn-guard',
      description: 'Reflects 20% of incoming physical damage for 2 turns',
    },
    { func: 'bloomOvergrowth', cost: 40, cooldown: 15, image: 'plant-bloom-overgrowth',
      description: 'Heals all allies for 10% HP'
    },
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
    let frontBaxies = shuffle(baxies.filter((baxie) => baxie.isAlive() && baxie.position === 'front'));
    let centerBaxies = shuffle(baxies.filter((baxie) => baxie.isAlive() && baxie.position === 'center'));
    let backBaxies = shuffle(baxies.filter((baxie) => baxie.isAlive() && (baxie.position === 'back' || baxie.position === '')));

    if (excludeId) {
      frontBaxies = frontBaxies.filter((baxie) => baxie.tokenId !== excludeId);
      backBaxies = backBaxies.filter((baxie) => baxie.tokenId !== excludeId);
    }

    const selected = [];

    // Take from front first
    for (let i = 0; i < frontBaxies.length && selected.length < count; i++) {
      selected.push(frontBaxies[i]);
    }

    // If not enough, take from center
    for (let i = 0; i < centerBaxies.length && selected.length < count; i++) {
      selected.push(centerBaxies[i]);
    }

    // If not enough, take from back
    for (let i = 0; i < backBaxies.length && selected.length < count; i++) {
      selected.push(backBaxies[i]);
    }

    if (selected.length === 0) {
      console.log('--------------------')
    }

    return selected;
  }
}