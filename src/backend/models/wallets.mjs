import {getUtcNow} from "../utils/date-utils.mjs";
 import config from "../config/default.json" with { type: "json" };
import {getConnection} from "../components/db.mjs";

export default class Wallets {
  constructor(address) {
    this.address = address;
  }

  static async addRecord({ address } = {}) {
    const mongoDbConnection = await getConnection();

    await mongoDbConnection.db().collection(config.mongo.table.wallets).updateOne(
      { address: address.toLowerCase(), network: "ronin" }, // match criteria
      {
        $setOnInsert: {
          createdAt: getUtcNow()
        }
      },
      { upsert: true }
    );
  }

  static async findByWallet({ address } = {}) {
    const mongoDbConnection = await getConnection();

    return await mongoDbConnection.db().collection(config.mongo.table.wallets)
      .findOne({ address });
  }
}
