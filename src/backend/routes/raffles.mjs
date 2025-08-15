import { JsonRpcProvider, formatEther } from "ethers";
import config from "../config/localhost.json" with { type: "json" };
import { validateCsrfMiddleware } from "../components/middlewares.mjs";
import { rateLimiterMiddleware } from "../components/rate-limiter.mjs";
import {getRaffleId, getUtcNow, raffleEndingIn, raffleEndsInDHM} from "../components/utils.mjs";
import {
  addRaffleRecord,
  getTotalAmountOnRaffleId,
  getEntriesFromRaffleId,
  getAllRaffles,
} from "../components/db.mjs";

export function initRafflesRoutes(app, mongoDbConnection) {
  app.get("/raffles", rateLimiterMiddleware, async (req, res) => {
    const raffleId = getRaffleId(getUtcNow());

    return res.render("raffle/index", {
      currentRaffleId: getRaffleId(getUtcNow()),
      raffleId,
      totalAmount: await getTotalAmountOnRaffleId({
        mongoDbConnection, raffleId
      }),
      entries: await getEntriesFromRaffleId({
        mongoDbConnection, raffleId
      }),
      allRaffles: await getAllRaffles({
        mongoDbConnection
      }),
      ...raffleEndsInDHM()
    });
  });

  app.get("/raffle/:raffleId", rateLimiterMiddleware, async (req, res) => {
    let { raffleId } = req.params;

    if (raffleId) {
      // Validate raffleId format: two chars, dash, four chars
      const isValid = /^[0-9]{2}-[0-9]{4}$/.test(raffleId);

      if (!isValid) {
        return res.status(400).json({error: "Invalid raffleId format"});
      }
    } else {
      raffleId = getRaffleId(getUtcNow());
    }

    return res.render("raffle/index", {
      currentRaffleId: getRaffleId(getUtcNow()),
      raffleId,
      totalAmount: await getTotalAmountOnRaffleId({
        mongoDbConnection, raffleId
      }),
      entries: await getEntriesFromRaffleId({
        mongoDbConnection, raffleId
      }),
      allRaffles: await getAllRaffles({
        mongoDbConnection
      }),
      ...raffleEndsInDHM()
    });
  });

  app.post("/join-raffle", validateCsrfMiddleware, rateLimiterMiddleware, async (req, res) => {
    const { txHash, amount } = req.body;

    try {
      const provider = new JsonRpcProvider(config.web3.rpcUrl, {
        name: config.web3.chainName,
        chainId: config.web3.chainId
      });

      const receipt = await provider.getTransactionReceipt(txHash);

      if (!receipt) {
        res.status(200).json({ verified: false, status: "pending" });

        return;
      }

      if (!receipt) {
        res.status(200).json({ verified: false, status: "pending" });

        return;
      }

      if (receipt.status === 1) {
        const tx = await provider.getTransaction(txHash);

        if (receipt.from.toLowerCase() !== req.session.wallet?.address.toLowerCase()) {
          res.status(200).json({ verified: true, status: "failed", message: "Wallet is not the same as logged in wallet." });

          return;
        }

        if (receipt.to.toLowerCase() !== config.web3.raffleAddress.toLowerCase()) {
          res.status(200).json({ verified: true, status: "failed", message: "Not sending to the raffle wallet" });

          return;
        }

        if (formatEther(tx.value) !== amount) {
          res.status(200).json({verified: true, status: "failed", message: "Not same amount."});

          return;
        }

        await addRaffleRecord({
          mongoDbConnection,
          txHash,
          amount: formatEther(tx.value),
          to: receipt.to,
          from: receipt.from,
          status: "verified"
        });

        res.cookie("has-raffle-entry", "true", {
          maxAge: raffleEndingIn(getUtcNow())
        });

        res.status(200).json({ verified: true, status: "success" });
      } else {
        res.status(200).json({ verified: true, status: "failed" });
      }
    } catch (err) {
      res.status(400).json({ status: "failed", message: "Invalid signature", error: err.message });
    }
  });

  app.get("/pick-raffle-winner", async (req, res) => {
    try {
      const raffleId = getRaffleId(getUtcNow());

      // 1️⃣ Check if a winner already exists
      const existingWinner = await mongoDbConnection
        .db()
        .collection(config.mongo.table.raffleWinners)
        .findOne({ raffleId });

      if (existingWinner) {
        return res.status(400).send({
          error: "Winner already picked for this raffle",
          winner: existingWinner.winner,
        });
      }

      const entries = await getEntriesFromRaffleId({ mongoDbConnection, raffleId });

      if (entries.length === 0) {
        return res.status(404).send("No entries for this raffle");
      }

      const pickWeightedWinner = (entries) => {
        const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);

        let cumulative = 0;
        const ranges = entries.map(entry => {
          const start = cumulative;
          cumulative += entry.amount / totalAmount;
          return { wallet: entry.from, start, end: cumulative };
        });

        const r = Math.random();

        return ranges.find(range => r >= range.start && r < range.end)?.wallet;
      };

      const winnerWallet = pickWeightedWinner(entries);

      await mongoDbConnection
        .db()
        .collection(config.mongo.table.raffleWinners)
        .insertOne({
          raffleId,
          winner: winnerWallet.toLowerCase(),
          pickedAt: getUtcNow()
        });

      res.send({ winner: winnerWallet });
    } catch {
      res.status(500).send("Server error");
    }
  });
}
