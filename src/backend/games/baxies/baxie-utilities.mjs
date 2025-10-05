import ElectricBaxie from "./electric-baxie.mjs";
import DemonBaxie from "./demon-baxie.mjs";
import FairyBaxie from "./fairy-baxie.mjs";
import AquaBaxie from "./aqua-baxie.mjs";
import PlantBaxie from "./plant-baxie.mjs";
import FireBaxie from "./fire-baxie.mjs";

export function makeBaxie(nftData) {
  const type = nftData.data.attributes.find((attr) => attr.trait_type === 'Class')?.value;

  switch (type) {
    case 'Electric':
      return new ElectricBaxie(nftData);
    case 'Demon':
      return new DemonBaxie(nftData);
    case 'Fairy':
      return new FairyBaxie(nftData);
    case 'Aqua':
      return new AquaBaxie(nftData);
    case 'Plant':
      return new PlantBaxie(nftData);
    case 'Fire':
      return new FireBaxie(nftData);
  }
}
