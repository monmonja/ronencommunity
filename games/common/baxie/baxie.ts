// @ts-ignore
import Phaser from 'phaser';

export type BaxieAttributeMetadata = {
  display_type: "string" | "number" | "date";
  trait_type:
    | "Status"
    | "Class"
    | "Gender"
    | "Tail"
    | "Ears"
    | "Mouth"
    | "Eyes"
    | "Forehead"
    | "Attack"
    | "Defense"
    | "Stamina"
    | "Skill"
    | "Mystic"
    | "Purity"
    | "Breed Count"
    | "Reroll Count"
    | "Birthdate";
  value: string | number;
};

export type BaxieMetadata = {
  name: string;
  external_url: string;
  image: string;
  attributes: BaxieAttributeMetadata[];
};

export type BaxieAttributes = {
  status: string;
  class: string;
  gender: string;
  tail: string;
  ears: string;
  mouth: string;
  eyes: string;
  forehead: string;
  attack: number;
  defense: number;
  stamina: number;
  skill: number;
  mystic: string;
  purity: string;
  "breed count": number;
  "reroll count": number;
  birthdate: number;
};

export type Effects = {
  type: string,
  turnsLeft: number,
  damage?: number,
  percent?: number,
}

export type Skills = {
  func: string,
  cost: number,
}

export default class Baxie extends Phaser.GameObjects.Container {
  [x: string]: any;
  baxieData:BaxieMetadata;
  attributes!: BaxieAttributes;
  enemies:Baxie[] = [];
  selectedEnemy:Baxie|null = null;

  currentHP = 0;
  currentStamina = 0;
  currentAttack = 0;
  currentDefense = 0;
  effects: Effects[] = [];
  skills: Skills[] = [];

  constructor(scene: any, data: BaxieMetadata, x: number, y: number) {
    super(scene, x, y); // Container will be positioned at (x,y)
    this.baxieData = data;

    // Convert attributes array to object
    if (data.attributes && Array.isArray(data.attributes)) {
      this.attributes = data.attributes.reduce((acc, attr) => {
        const key = attr.trait_type.toLowerCase();
        let value: string | number = attr.value;

        if (attr.display_type === "number") {
          value = Number(attr.value);
        }

        // @ts-ignore
        acc[key] = value;
        return acc;
      },  {} as BaxieAttributes);
    }

    this.currentHP = this.getMaxHP();
    this.currentStamina = 100; //this.getMaxStamina();
    this.currentAttack = this.getMaxAttack();
    this.currentDefense = this.getMaxDefense();

    this.renderCharacter();

    scene.add.existing(this);
  }

  renderSkills(container: Phaser.GameObjects.Container) {
    // Clear existing children
    container.removeAll(true);

    this.skills.forEach((skill: Skills, index: number) => {
      const skillCircle = this.scene.add.circle(0, index * 30 + 15, 12, 0x6666ff);
      container.add(skillCircle);

      const skillText = this.scene.add.text(0, index * 30, `${skill.func} (Cost: ${skill.cost})`, {
        fontSize: "16px",
        color: "#ffff00",
        backgroundColor: "#000000",
        padding: { x: 5, y: 5 },
      }).setInteractive();

      skillText.on('pointerdown', () => {
        console.log(`Skill ${skill.func} clicked`);
        this.useStamina(skill.cost);

        const enemiesAlive = this.enemies.filter((b) => b.currentHP > 0);
        this[skill.func](enemiesAlive);
        this.scene.game.events.emit('EndTurn');
      });

      container.add(skillText);
    });
  }

  renderCharacter() {
    // Clear any existing children
    this.removeAll(true);

    // Just a simple circle as a placeholder body
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xff4444, 1);
    graphics.fillCircle(0, 0, 20);

    // Add a text label for debugging
    const nameText = this.scene.add.text(0, -30, this.baxieData.name || "Baxie", {
      fontSize: "20px",
      color: "#ffffff",
    }).setOrigin(0.5);

    // Add HP text below
    this.hpText = this.scene.add.text(0, 25, `HP: ${this.currentHP}`, {
      fontSize: "20px",
      color: "#ffffff",
    }).setOrigin(0.5);

    this.spText = this.scene.add.text(0, 45, `SP: ${this.getCurrentStamina()}`, {
      fontSize: "20px",
      color: "#ffffff",
    }).setOrigin(0.5);

    // Add them to the container
    this.add([graphics, nameText, this.hpText, this.spText]);
  }

  getMaxStamina() {
    let stamina = this.attributes.stamina ?? 0;

    // https://docs.baxieethernity.com/gameplay/classes-and-skills#class-advantages
    if (['Electric', 'Fairy'].includes(this.attributes.class)) {
      stamina += 10;
    }

    return stamina;
  }

  getMaxAttack() {
    let attack = this.attributes.attack ?? 0;

    // https://docs.baxieethernity.com/gameplay/classes-and-skills#class-advantages
    if (['Fire', 'Demon'].includes(this.attributes.class)) {
      attack += 10;
    }

    // Mystic
    attack += parseInt(this.attributes.mystic.split('/')[0], 10) * 3;

    return attack;
  }

  getMaxDefense() {
    let defense = this.attributes.defense;

    // https://docs.baxieethernity.com/gameplay/classes-and-skills#class-advantages
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

  restoreAttack () {
    // check effects

    return this.currentAttack;
  }


  useStamina (stamina: number = 0) : number {
    this.currentStamina = Math.max(this.currentStamina - stamina, 0);
    this.spText.setText(`SP: ${this.getCurrentStamina()}`);

    return this.currentStamina;
  }

  attackFromOther(damage: number) {
    this.currentHP -= damage;
    console.log('damage', damage)
    this.hpText.setText(this.currentHP);
  }
}
