import * as Phaser from 'phaser';
import BaxieUi from "../../common/baxie/baxie-ui.mjs";
import {createButton} from "../../common/buttons.mjs";
import {GameModes} from "../../common/baxie/baxie-simulation.mjs";
import constants from "../../common/constants.mjs";
import {interactiveBoundsChecker} from "../../common/rotate-utils.mjs";
import {formatSkillName} from "../../common/utils/baxie.mjs";

export default class PositionSlotsScene extends Phaser.Scene {
  constructor() {
    super('PositionSlotsScene');
    this.isPlayerTurn = true;
  }



  init(data) {
    this.selectedBaxiesId = data.selectedBaxiesId ?? ['1250', '1251', '1252'];
    this.selectedBaxies = data.selectedBaxies ?? [
      {
        "_id": "68dbddfa96eb8e86151ff2ca",
        "nftId": "1250",
        "network": "ronin",
        "nftTokenId": "baxies",
        "createdAt": "2025-09-30T13:41:13.968Z",
        "data": {
          "name": "Baxie Ethernity #1250",
          "external_url": "https://baxieethernity.com/",
          "image": "https://metadata.ronen.network/0xb79f49ac669108426a69a26a6ca075a10c0cfe28_1250.png",
          "attributes": [
            {
              "display_type": "string",
              "trait_type": "Status",
              "value": "Finalized"
            },
            {
              "display_type": "string",
              "trait_type": "Class",
              "value": "Electric"
            },
            {
              "display_type": "string",
              "trait_type": "Gender",
              "value": "Male"
            },
            {
              "display_type": "string",
              "trait_type": "Tail",
              "value": "Fairy #3"
            },
            {
              "display_type": "string",
              "trait_type": "Ears",
              "value": "Fire #3"
            },
            {
              "display_type": "string",
              "trait_type": "Mouth",
              "value": "Electric #4"
            },
            {
              "display_type": "string",
              "trait_type": "Eyes",
              "value": "Plant #3"
            },
            {
              "display_type": "string",
              "trait_type": "Forehead",
              "value": "Electric #1"
            },
            {
              "display_type": "number",
              "trait_type": "Attack",
              "value": "66"
            },
            {
              "display_type": "number",
              "trait_type": "Defense",
              "value": "67"
            },
            {
              "display_type": "number",
              "trait_type": "Stamina",
              "value": "78"
            },
            {
              "display_type": "number",
              "trait_type": "Skill",
              "value": "2"
            },
            {
              "display_type": "string",
              "trait_type": "Mystic",
              "value": "0/5"
            },
            {
              "display_type": "string",
              "trait_type": "Purity",
              "value": "3/6"
            },
            {
              "display_type": "number",
              "trait_type": "Breed Count",
              "value": "0"
            },
            {
              "display_type": "number",
              "trait_type": "Reroll Count",
              "value": "3"
            },
            {
              "display_type": "date",
              "trait_type": "Birthdate",
              "value": 1757173635
            }
          ]
        },
        "tokenId": "1250",
        "hp": 101,
        "stamina": 78,
        "image": "https://metadata.ronen.network/0xb79f49ac669108426a69a26a6ca075a10c0cfe28_1250.png",
        "skills": [
          {
            "func": "voltOverload",
            "cost": 40,
            "cooldown": 7.6923076923076925,
            "image": "electric-volt-overload"
          },
          {
            "func": "chargeUp",
            "cost": 30,
            "cooldown": 7.6923076923076925,
            "image": "electric-charge-up"
          },
          {
            "func": "stormBreaker",
            "cost": 10,
            "cooldown": 7.6923076923076925,
            "image": "electric-storm-breaker"
          }
        ],
        "purity":"1/6",
        "position": "B"
      },
      {
        "_id": "68dbddfa96eb8e86151ff2cb",
        "nftTokenId": "baxies",
        "network": "ronin",
        "nftId": "1251",
        "createdAt": "2025-09-30T13:41:13.972Z",
        "data": {
          "name": "Baxie Ethernity #1251",
          "external_url": "https://baxieethernity.com/",
          "image": "https://metadata.ronen.network/0xb79f49ac669108426a69a26a6ca075a10c0cfe28_1251.png",
          "attributes": [
            {
              "display_type": "string",
              "trait_type": "Status",
              "value": "Finalized"
            },
            {
              "display_type": "string",
              "trait_type": "Class",
              "value": "Plant"
            },
            {
              "display_type": "string",
              "trait_type": "Gender",
              "value": "Male"
            },
            {
              "display_type": "string",
              "trait_type": "Tail",
              "value": "Plant #1"
            },
            {
              "display_type": "string",
              "trait_type": "Ears",
              "value": "Plant #2"
            },
            {
              "display_type": "string",
              "trait_type": "Mouth",
              "value": "Demon #3"
            },
            {
              "display_type": "string",
              "trait_type": "Eyes",
              "value": "Plant #2"
            },
            {
              "display_type": "string",
              "trait_type": "Forehead",
              "value": "Plant #1"
            },
            {
              "display_type": "number",
              "trait_type": "Attack",
              "value": "88"
            },
            {
              "display_type": "number",
              "trait_type": "Defense",
              "value": "99"
            },
            {
              "display_type": "number",
              "trait_type": "Stamina",
              "value": "87"
            },
            {
              "display_type": "number",
              "trait_type": "Skill",
              "value": "3"
            },
            {
              "display_type": "string",
              "trait_type": "Mystic",
              "value": "0/5"
            },
            {
              "display_type": "string",
              "trait_type": "Purity",
              "value": "5/6"
            },
            {
              "display_type": "number",
              "trait_type": "Breed Count",
              "value": "0"
            },
            {
              "display_type": "number",
              "trait_type": "Reroll Count",
              "value": "3"
            },
            {
              "display_type": "date",
              "trait_type": "Birthdate",
              "value": 1757173647
            }
          ]
        },
        "tokenId": "1251",
        "hp": 149,
        "stamina": 87,
        "image": "https://metadata.ronen.network/0xb79f49ac669108426a69a26a6ca075a10c0cfe28_1251.png",
        "skills": [
          {
            "func": "naturesResurgence",
            "cost": 30,
            "cooldown": 6.896551724137931,
            "image": "plant-natures-resurgence"
          },
          {
            "func": "thornGuard",
            "cost": 25,
            "cooldown": 6.896551724137931,
            "image": "plant-thorn-guard"
          },
          {
            "func": "bloomOvergrowth",
            "cost": 40,
            "cooldown": 6.896551724137931,
            "image": "plant-bloom-overgrowth"
          }
        ],
        "purity":"3/6",
        "position": "B"
      },
      {
        "_id": "68dbddfa96eb8e86151ff2cc",
        "nftTokenId": "baxies",
        "network": "ronin",
        "nftId": "1252",
        "createdAt": "2025-09-30T13:41:13.971Z",
        "data": {
          "name": "Baxie Ethernity #1252",
          "external_url": "https://baxieethernity.com/",
          "image": "https://metadata.ronen.network/0xb79f49ac669108426a69a26a6ca075a10c0cfe28_1252.png",
          "attributes": [
            {
              "display_type": "string",
              "trait_type": "Status",
              "value": "Finalized"
            },
            {
              "display_type": "string",
              "trait_type": "Class",
              "value": "Electric"
            },
            {
              "display_type": "string",
              "trait_type": "Gender",
              "value": "Male"
            },
            {
              "display_type": "string",
              "trait_type": "Tail",
              "value": "Electric #3"
            },
            {
              "display_type": "string",
              "trait_type": "Ears",
              "value": "Fairy #3"
            },
            {
              "display_type": "string",
              "trait_type": "Mouth",
              "value": "Fairy #1"
            },
            {
              "display_type": "string",
              "trait_type": "Eyes",
              "value": "Aqua #3"
            },
            {
              "display_type": "string",
              "trait_type": "Forehead",
              "value": "Aqua #1"
            },
            {
              "display_type": "number",
              "trait_type": "Attack",
              "value": "56"
            },
            {
              "display_type": "number",
              "trait_type": "Defense",
              "value": "58"
            },
            {
              "display_type": "number",
              "trait_type": "Stamina",
              "value": "68"
            },
            {
              "display_type": "number",
              "trait_type": "Skill",
              "value": "1"
            },
            {
              "display_type": "string",
              "trait_type": "Mystic",
              "value": "0/5"
            },
            {
              "display_type": "string",
              "trait_type": "Purity",
              "value": "2/6"
            },
            {
              "display_type": "number",
              "trait_type": "Breed Count",
              "value": "0"
            },
            {
              "display_type": "number",
              "trait_type": "Reroll Count",
              "value": "3"
            },
            {
              "display_type": "date",
              "trait_type": "Birthdate",
              "value": 1757173654
            }
          ]
        },
        "tokenId": "1252",
        "hp": 87,
        "stamina": 68,
        "image": "https://metadata.ronen.network/0xb79f49ac669108426a69a26a6ca075a10c0cfe28_1252.png",
        "skills": [
          {
            "func": "voltOverload",
            "cost": 40,
            "cooldown": 8.823529411764707,
            "image": "electric-volt-overload"
          },
          {
            "func": "chargeUp",
            "cost": 30,
            "cooldown": 8.823529411764707,
            "image": "electric-charge-up"
          },
          {
            "func": "stormBreaker",
            "cost": 10,
            "cooldown": 8.823529411764707,
            "image": "electric-storm-breaker"
          }
        ],
        "purity":"5/6",
        "position": "B"
      }
    ];
  }

  preload() {
    for (let i = 0; i < this.selectedBaxies.length; i++) {
      const baxie = this.selectedBaxies[i];
      const key = `baxie-${baxie.tokenId}`;
      this.load.image(key, baxie.image);

      const maxSkill = Math.ceil(Number(baxie.purity.split('/')[0]) / 2);
      baxie.selectedSkills = baxie.skills.slice(0, maxSkill).map((skill) => skill.func);
    }
  }

  createSkills(baxie, itemWidth) {
    const baxieSkillContainer = this.add.container(0, 295);
    const radius = 30;
    const y = radius + 10;
    const skillWidth = radius * 2;
    const spacing = 20;
    const totalWidth = baxie.skills.length * skillWidth + (baxie.skills.length - 1) * spacing;
    const startX = -totalWidth / 2 + radius + (itemWidth / 2);
    const maxSkill = Math.ceil(Number(baxie.purity.split('/')[0]) / 2);

    const skillText = this.add.text(itemWidth - 30, -10, `${baxie.selectedSkills.length}/${maxSkill}`, {
      fontSize: "16px",
      color: "#ffff00",
      backgroundColor: "#000000",
      padding: { x: 5, y: 5 },
    })
      .setOrigin(0.5);
    baxieSkillContainer.add(skillText);

    baxie.skills.forEach((skill, index) => {
      const x = startX + index * (skillWidth + spacing);
      const skillContainer = this.add.container(x, y);

      const border = this.add.graphics()
      border.fillStyle(0xAC022F, 1);
      border.fillCircle(0, 0, radius + 2);
      console.log('baxie.selectedSkills', baxie.selectedSkills, skill.func)
      if (!baxie.selectedSkills.includes(skill.func)) {
        border.visible = false;
      }
      skillContainer.add(border);

      const name = this.add.text(0, radius + 20, formatSkillName(skill.func), {
        fontSize: "12px",
        color: "#ffff00",
        backgroundColor: "#000000",
        padding: { x: 5, y: 5 },
      })
        .setOrigin(0.5);
      skillContainer.add(name)

      const image = this.add.image(0, 0, skill.image)
        .setScale(0.09)
        .setOrigin(0.5);
      skillContainer.add(image);

      skillContainer
        .setInteractive(
          new Phaser.Geom.Rectangle(-radius, -radius, radius * 2, radius * 2),
          interactiveBoundsChecker,
        )
        .on("pointerover", () => {
          this.input.manager.canvas.style.cursor = "pointer";
        })
        .on("pointerout", () => {
          this.input.manager.canvas.style.cursor = "default";
        })
        .on('pointerdown', () => {
          if (!border.visible) {
            if (baxie.selectedSkills.length < maxSkill) {
              border.visible = !border.visible;
              baxie.selectedSkills.push(skill.func);
            }
          } else {
            border.visible = !border.visible;
            baxie.selectedSkills.splice(baxie.selectedSkills.indexOf(skill.func), 1);
          }
          skillText.text = `${baxie.selectedSkills.length}/${maxSkill}`;
        });
      baxieSkillContainer.add(skillContainer);
    });

    return baxieSkillContainer;
  }

  createTogglePositionButtons(baxie, x = 0, y = 0) {
    const positions = ['back', 'center', 'front'];
    let activePosition = 'center';

    // Style configs
    const buttonWidth = 80;
    const buttonHeight = 40;
    const spacing = 10;

    const buttons = positions.map((pos, index) => {
      const btn = this.add.rectangle(
        index * (buttonWidth + spacing),
        0,
        buttonWidth,
        buttonHeight,
        pos === activePosition ? 0x00aaff : 0x666666
      ).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        activePosition = pos;
        baxie.position = activePosition;
        buttons.forEach((b, i) => {
          b.fillColor = positions[i] === activePosition ? 0x00aaff : 0x666666;
        });
      });

      return btn;
    });

    const labels = positions.map((pos, index) =>
      this.add.text(
        index * (buttonWidth + spacing),
        0,
        pos.charAt(0).toUpperCase() + pos.slice(1),
        { color: '#ffffff', fontSize: '16px' }
      ).setOrigin(0.5)
    );

    // Group everything into one container
    const container = this.add.container(x, y, [...buttons, ...labels]);

    // Return container + helper
    container.getActivePosition = () => activePosition;

    return container;
  }


  create() {
    this.backgroundDay = this.add
      .image(0, 0, 'bg')
      .setOrigin(0, 0)
      .setInteractive();

    const label = this.add.text(20, 20, `Position and skill slots`, {
      fontSize: "30px",
      fontFamily: constants.fonts.troika,
      color: "#FFF",
      fontStyle: "bold"
    }).setOrigin(0, 0);
    label.setShadow(2, 2, '#000', 4, true, true);

    const slotSpacing = 20;
    const startX = 50;
    const startY = 60;
    const width = (this.game.scale.width - 170) / 3;
    const height = 430;

    for (let i = 0; i < this.selectedBaxies.length; i++) {
      const x = startX + (i * (width + slotSpacing));
      const y = startY;
      const baxie = this.selectedBaxies[i];

      const container = this.add.container(x, y);

      const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.5).setOrigin(0);
      container.add(bg);

      const sprite = this.add.image(width / 2, -5, `baxie-${baxie.tokenId}`)
        .setOrigin(0.5, 0)
        .setScale(0.115);
      container.add(sprite);

      baxie.position = 'center';
      container.add(this.createTogglePositionButtons(baxie, 53, 240));
      container.add(this.createSkills(baxie, width));
    }

    createButton({
      scene: this,
      x: (this.game.scale.width / 2) - 50,
      y: this.game.scale.height - 70,
      width: 100,
      height: 50,
      text: 'Rooms',
      onPointerDown: async () => {
        this.scene.start('RoomSelectionScene', {
          selectedBaxies: this.selectedBaxies.map((b) => {
            return {
              tokenId: b.tokenId,
              skills: b.selectedSkills,
              position: b.position,
            };
          }),
        });
      },
    });
    // this.afterCreate();
  }
}
