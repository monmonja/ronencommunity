import { MongoClient } from "mongodb";

import config from "../config/default.json" with { type: "json" };

let client;

export async function getConnection () {
  let connection;

  if (!client) {
    try {
      connection = await MongoClient.connect(config.mongo.connectionString);

      const events = ["serverClosed", "topologyClosed", "error", "timeout", "close"];

      events.forEach((ev) => {
        connection.on(ev, () => client = null);
      });

      connection.on("serverDescriptionChanged", (event) => {
        if (event.newDescription.error) {
          client = null;
        }
      });

      client = connection;
    } catch (error) {
      throw new Error(error);
    }
  }

  return client;
}
