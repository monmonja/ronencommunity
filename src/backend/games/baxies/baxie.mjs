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
  position = "back";
  /**
   * @type BaxieEffect[]
   */
  effects = [];
  /**
   * @type {BaxieSkill[]}
   */
  skills = [];
  skillsTimer = {};

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

        acc[key] = value;

        return acc;
      },  {});
    }

    this.currentHP = this.getMaxHP();
    this.currentStamina = this.getMaxStamina() ;
    this.currentAttack = this.getMaxAttack();
    this.currentDefense = this.getMaxDefense();
  }

  populateSkills(skills) {
    const skillCount = skills.length;//Math.ceil(Number(this.attributes.purity.split("/")[0]) / 2);

    if (skills.filter((skill) => typeof skill !== "string").length > 0) {
      return skills;
    }

    this.skills = SkillManager.getBaxieSkill(skills.slice(0, skillCount), this.getMaxStamina());
  }

  isAlive() {
    return this.currentHP > 0;
  }

  getMaxStamina() {
    return this.attributes.stamina ?? 0;
  }

  getMaxAttack() {
    return this.attributes.attack ?? 0;
  }

  getMaxDefense() {
    return this.attributes.defense;
  }

  getMaxHP() {
    return this.getMaxDefense() * 1.5;
  }

  getPhysicalDamage(enemy) {
    let attack = this.currentAttack;

    for (const effect of this.getActiveEffect()) {
      if (effect.type === EFFECTS.attackBoost && effect.turnsLeft > 0) {
        attack += attack * effect.value;
      }
    }

    return this.calculateDamage(attack * 0.4, enemy.getCurrentDefense(), true);
  }

  canAttack() {
    if (!this.isAlive()) {
      return false;
    }

    for (const effect of this.getActiveEffect()) {
      if (effect.type === EFFECTS.stunned && effect.turnsLeft > 0) {
        console.log('Cannot attack, stunned');
        return false;
      }
    }

    return true;
  }

  reasonCannotAttack() {
    if (!this.isAlive()) {
      return "Not alive";
    }

    for (const effect of this.getActiveEffect()) {
      if (effect.type === EFFECTS.stunned && effect.turnsLeft > 0) {
        return `#${this.tokenId} is stunned, skipping attack.`;
      }
    }

    return 'Dont know';
  }


  canUseSkill(skillName, gameMode) {
    const skill = this.skills.find(s => s.func === skillName);

    if (!skill) {
      return false;
    }

    for (const effect of this.getActiveEffect()) {
      if (effect.type === EFFECTS.silence && effect.turnsLeft > 0) {
        return false;
      }
    }

    if (gameMode === GameModes.skillCountdown) {
      const now = Date.now(); // same as new Date().getTime()
      const cooldownMs = skill.cooldown * 1000; // convert sec → ms
      const lastUse = this.skillsTimer[skillName] || 0;

      if (lastUse === 0) {
        return true;
      }

      return now >= lastUse + cooldownMs;
    }

    if (gameMode === GameModes.autoBattler) {
      return this.currentStamina > skill.cost;
    }

    return true;
  }

  calculateDamage(attack, defense, allowCrit = false) {
    const critChance = 0.1; // 10% chance
    const critMultiplier = 1.5; // 50% more damage (use 1.5x instead of 0.2x)

    // ✅ Base damage starts as the raw attack value
    let baseDamage = attack;

    const damageReduction = Math.min(defense * 0.007, 0.7);

    baseDamage *= (1 - damageReduction);

    const minDamage = attack * 0.1;

    // ✅ Critical hit check
    if (allowCrit && Math.random() < critChance) {
      baseDamage *= critMultiplier;
    }

    // ✅ Apply active effects
    for (const effect of this.getActiveEffect()) {
      if (effect.type === EFFECTS.extraDamageTaken && effect.turnsLeft > 0) {
        baseDamage += baseDamage * effect.value;
      }

      if (effect.type === EFFECTS.reduceDamageTaken && effect.turnsLeft > 0) {
        baseDamage -= baseDamage * effect.value;
      }
    }

    return Math.floor(Math.max(baseDamage, minDamage));
  }

  getCurrentStamina () {
    return this.currentStamina;
  }

  getCurrentDefense () {
    let defense = this.currentDefense;

    for (const effect of this.getActiveEffect()) {
      if (effect.type === EFFECTS.defenseBoost && effect.turnsLeft > 0) {
        defense += effect.value;
      }

      if (effect.type === EFFECTS.shield && effect.turnsLeft > 0) {
        defense += effect.value;
      }
    }

    return defense;
  }

  getSkillAttack () {
    let attack = this.currentAttack;

    for (const effect of this.getActiveEffect()) {
      if (effect.type === EFFECTS.attackBoost && effect.turnsLeft > 0) {
        attack += attack * effect.value;
      }
    }

    return attack;
  }

  addHp(hp) {
    this.currentHP = Math.min(this.currentHP + hp, this.getMaxHP());
  }

  removeHp(hp) {
    this.currentHP = Math.max(1, this.currentHP - hp);
  }

  takeDamage(damage) {
    this.currentHP = Math.max(this.currentHP - damage, 0);

    return this.currentHP;
  }

  takeSkillDamage(damage) {
    for (const effect of this.getActiveEffect()) {
      if (effect.type === EFFECTS.skillDamageBoost && effect.turnsLeft > 0) {
        damage += damage * effect.value;
      }
    }

    this.currentHP = Math.max(this.currentHP - damage, 0);

    return this.currentHP;
  }

  useStamina (stamina) {
    this.setStamina(Math.max(this.currentStamina - stamina, 0));

    return this.currentStamina;
  }

  setStamina (stamina) {
    this.currentStamina = Math.min(stamina, this.getMaxStamina());
  }

  getGameInfo (full = false) {
    if (full) {
      return {
        tokenId: this.tokenId,
        maxHP: Math.ceil(this.getMaxHP()),
        hp: Math.ceil(this.currentHP) ?? 0,
        maxSP: Math.ceil(this.getMaxStamina()),
        sp: Math.ceil(this.currentStamina)  ?? 0,
        image: this.image,
        skills: this.skills,
        position: this.position,
        effects: this.effects,
        purity: this.attributes.purity,
      };
    } else {
      return {
        tokenId: this.tokenId,
        maxHP: Math.ceil(this.getMaxHP()),
        hp: Math.ceil(this.currentHP) ?? 0,
        maxSP: Math.ceil(this.getMaxStamina()),
        sp: Math.ceil(this.currentStamina)  ?? 0,
        effects: this.effects,
      };
    }
  }

  // Generic skill executor
  useSkill({ skillName, enemies, allies = [], gameMode = GameModes.turnBasedSP, turnIndex = 0 } = {}) {
    const skill = this.skills.find(s => s.func === skillName);

    if (!skill) {
      throw new Error(`Skill ${skillName} not found`);
    }

    if (this.currentStamina < skill.cost) {
      throw new Error("Not enough stamina");
    }

    console.log(`${this.tokenId} is using ${skillName}, current SP ${this.currentStamina}, cost: ${skill.cost}`);
    this.useStamina(skill.cost);
    this.skillsTimer[skillName] = Date.now();

    this.gameTurnIndex = turnIndex;
    return this[skillName](enemies, allies);
  }

  getActiveEffect() {
    const effects = [];

    for (const effect of this.effects) {
      if (effect.turnsLeft > 0) {
        effects.push(effect);
      }
    }

    return effects;
  }

  addEffect(effect) {
    if (this.hasEffect(effect.type)) {
      if ([EFFECTS.stunned, EFFECTS.silence, EFFECTS.shield, EFFECTS.reflect].includes(effect.type)) {
        // refresh effect duration
        const existingEffect = this.effects.find((e) => e.type === effect.type);

        existingEffect.turnIndexAdded = this.gameTurnIndex;
        existingEffect.turnsLeft = effect.turnsLeft;
      } else {
        effect.turnIndexAdded = this.gameTurnIndex;

        this.effects.push(effect);
      }
    } else {
      effect.turnIndexAdded = this.gameTurnIndex;

      this.effects.push(effect);
    }
  }

  hasEffect(effect) {
    return this.effects.filter((e) => e.type === effect && e.turnsLeft >= 0).length > 0;
  }

  afterTurnEffects(key, effect) {
    if (key === EFFECTS.burn) {
      this.currentHP = Math.max(this.currentHP - effect.value, 0);
    }
  }
}
