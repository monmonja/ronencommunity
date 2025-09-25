
export default class Baxie {
  attributes = {};
  currentHP = 0;
  currentStamina = 0;
  currentAttack = 0;
  currentDefense = 0;
  effects = [];
  skills = [];

  static makeBaxie(nftData) {
    return new Baxie(nftData);
  }

  constructor(nftData) {
    this.tokenId = nftData.nftId;

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


  getCurrentStamina () {
    return this.currentStamina;
  }

  getCurrentDefense () {
    return this.currentDefense * 0.3;
  }

  getCurrentAttack () {
    return this.currentAttack;
  }

  useStamina (stamina) {
    this.currentStamina = Math.max(this.currentStamina - stamina, 0);

    return this.currentStamina;
  }

  getGameInfo () {
    return {
      tokenId: this.tokenId,
      hp: this.currentHP,
      stamina: this.currentStamina,
    }
  }

  // Generic skill executor
  useSkill(skillName, enemies) {
    const skill = this.skills.find(s => s.func === skillName);
    if (!skill) {
      throw new Error(`Skill ${skillName} not found`);
    }
    if (this.currentStamina < skill.cost) {
      throw new Error(`Not enough stamina`);
    }

    this.useStamina(skill.cost);
    return this[skillName](enemies);
  }

  addEffect(effect) {
    this.effects.push(effect);
  }

  hasEffect(effect) {
    return this.effects.filter((e) => e.type === effect && e.turnsLeft > 0).length > 0;
  }
}