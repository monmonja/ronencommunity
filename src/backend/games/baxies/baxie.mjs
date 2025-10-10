import {EFFECTS} from "./effects.mjs";
import {GameModes} from "../../../../games/common/baxie/baxie-simulation.mjs";
import SkillManager from "./baxie-simulation/skill-manager.mjs";

export default class Baxie {
  /**
   * @type BaxieAttributesType
   */
  attributes = {};
  currentHP = 0;
  currentStamina = 0;
  currentAttack = 0;
  currentDefense = 0;
  position = 'B';
  /**
   * @type BaxieEffect
   */
  effects = [];
  skills = [];
  fixedSkills = [];

  constructor(nftData) {
    this.tokenId = nftData.nftId;
    this.image = nftData.data.image;

    // Convert attributes array to object
    if (nftData.data.attributes && Array.isArray(nftData.data.attributes)) {
      this.attributes = nftData.data.attributes.reduce((acc, attr) => {
        const key = attr.trait_type.toLowerCase();
        let value = attr.value;

        if (attr.display_type === "number") {
          value = Number(attr.value);
        }

        // @ts-ignore
        acc[key] = value;
        return acc;
      },  {});
    }

    this.currentHP = this.getMaxHP();
    this.currentStamina = this.getMaxStamina();
    this.currentAttack = this.getMaxAttack();
    this.currentDefense = this.getMaxDefense();
    console.log(`Baxie ${this.tokenId} created with HP: ${this.currentHP}, Stamina: ${this.currentStamina}, Attack: ${this.currentAttack}, Defense: ${this.currentDefense}, type ${this.attributes.class}`);
  }

  populateSkills(skills) {
    const skillCount = Math.ceil(Number(this.attributes.purity.split('/')[0]) / 2);

    this.skills = SkillManager.getBaxieSkill(skills.slice(0, skillCount));
  }

  isAlive() {
    return this.currentHP > 0;
  }

  getMaxStamina() {
    let stamina = this.attributes.stamina ?? 0;

    // https://docs.BaxieUiethernity.com/gameplay/classes-and-skills#class-advantages
    if (['Electric', 'Fairy'].includes(this.attributes.class)) {
      stamina += 10;
    }

    return stamina;
  }

  getMaxAttack() {
    let attack = this.attributes.attack ?? 0;

    // https://docs.BaxieUiethernity.com/gameplay/classes-and-skills#class-advantages
    if (['Fire', 'Demon'].includes(this.attributes.class)) {
      attack += 10;
    }

    // Mystic
    attack += parseInt(this.attributes.mystic.split('/')[0], 10) * 3;

    return attack;
  }

  getMaxDefense() {
    let defense = this.attributes.defense;

    // https://docs.BaxieUiethernity.com/gameplay/classes-and-skills#class-advantages
    if (['Aqua', 'Plant'].includes(this.attributes.class)) {
      defense += 10;
    }

    // mystic
    defense += parseInt(this.attributes.mystic.split('/')[0], 10) * 3;

    return defense;
  }

  getMaxHP() {
    return 100;//Math.ceil(this.getMaxDefense() * 1.2);
  }

  reasonCannotAttack() {
    if (!this.isAlive()) {
      return 'Not alive';
    }

    for (const effect of this.effects) {
      if (effect.type === EFFECTS.stunned && effect.turnsLeft > 0) {
        return `Cannot attack it is stunned for ${effect.turnsLeft} more turn(s).`;
      }
      if (effect.type === EFFECTS.silence && effect.turnsLeft > 0) {
        return `Cannot attack it is silence for ${effect.turnsLeft} more turn(s).`;
      }
    }
  }

  canAttack() {
    if (!this.isAlive()) {
      return false;
    }

    for (const effect of this.effects) {
      if (effect.type === EFFECTS.stunned && effect.turnsLeft > 0) {
        return false;
      }
      if (effect.type === EFFECTS.silence && effect.turnsLeft > 0) {
        return false;
      }
    }

    return true;
  }

  getCurrentStamina () {
    return this.currentStamina;
  }

  getCurrentDefense () {
    let defense = this.currentDefense;

    for (const effect of this.effects) {
      if (effect.type === EFFECTS.defenseBoost && effect.turnsLeft > 0) {
        defense += effect.value;
      }

      if (effect.type === EFFECTS.shield && effect.turnsLeft > 0) {
        defense += effect.value;
      }
    }

    return defense * 0.3;
  }

  getCurrentAttack () {
    let attack = this.currentAttack;

    for (const effect of this.effects) {
      if (effect.type === EFFECTS.attackBoost && effect.turnsLeft > 0) {
        attack += attack * effect.value;
      }

      if (effect.type === EFFECTS.skillDamageBoost && effect.turnsLeft > 0) {
        attack += attack * effect.skillDamageBoost;
      }
    }

    return attack;
  }

  takeDamage(damage) {
    for (const effect of this.effects) {
      if (effect.type === EFFECTS.extraDamageTaken && effect.turnsLeft > 0) {
        damage += damage * effect.value;
      }

      if (effect.type === EFFECTS.reduceDamageTaken && effect.turnsLeft > 0) {
        damage -= damage * effect.value;
      }
    }

    this.currentHP = Math.max(this.currentHP - damage, 0);

    return this.currentHP;
  }

  useStamina (stamina) {
    this.currentStamina = Math.max(this.currentStamina - stamina, 0);

    return this.currentStamina;
  }

  getGameInfo (full = false) {
    if (full) {
      return {
        tokenId: this.tokenId,
        hp: Math.ceil(this.currentHP),
        stamina: this.currentStamina,
        image: this.image,
        skills: this.skills,
        position: this.position,
      }
    } else {
      return {
        tokenId: this.tokenId,
        hp: Math.ceil(this.currentHP),
        stamina: this.currentStamina,
      }
    }
  }

  // Generic skill executor
  useSkill(skillName, enemies, allies = [], gameMode = GameModes.turnBasedSP) {
    const skill = this.skills.find(s => s.func === skillName);

    if (!skill) {
      throw new Error(`Skill ${skillName} not found`);
    }

    if (gameMode === GameModes.turnBasedSP && this.currentStamina < skill.cost) {
      throw new Error(`Not enough stamina`);
    }

    this.useStamina(skill.cost);

    return this[skillName](enemies, allies);
  }

  addEffect(effect) {
    this.effects.push(effect);
  }

  hasEffect(effect) {
    return this.effects.filter((e) => e.type === effect && e.turnsLeft > 0).length > 0;
  }

  afterTurnEffects(key, effect) {
    if (key === EFFECTS.burn) {
      this.currentHP -= effect.value;
    }
  }
}