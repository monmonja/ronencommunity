// @ts-ignore
import Phaser from 'phaser';
import FireBaxie from "./fire-baxie";
import Baxie from "./baxie";


export default function getRandomisedBaxie(scene: any, x: number, y: number): Baxie {
  const baxie = new FireBaxie(scene, {
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
        "value": `${Math.ceil(Math.random() * 45) + 70}`
      },
      {
        "display_type": "number",
        "trait_type": "Stamina",
        "value": `${Math.ceil(Math.random() * 45) + 70}`
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
  }, x, y);

  return baxie;
}
