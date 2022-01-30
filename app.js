import express, { json } from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";
import joi from "joi";

dotenv.config();

const app = express();
app.use(json());
app.use(cors());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect().then(() => {
  db = mongoClient.db("API-bate-papo");
});

const participantsSchema = joi.object({
  name: joi.string().required(),
});

const messageSchema = joi.object({
  to: joi.string().required(),
  text: joi.string().required(),
  type: joi.string().required(),
});

app.get("/participants", async (req, res) => {
  try {
    const participants = await db.collection("participants").find().toArray();
    res.send(participants);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.post("/participants", async (req, res) => {
  const participant = req.body;
  const currentTime = dayjs().format("HH:mm:ss");
  const validation = participantsSchema.validate(participant);

  if (validation.error) {
    res.sendStatus(422);
    return;
  }

  const nameAlreadyExists = await db
    .collection("participants")
    .findOne({ name: participant.name });

  if (nameAlreadyExists) {
    res.status(409).send("Usuário já cadastrado, tente outro nome.");
    return;
  }

  try {
    await db
      .collection("participants")
      .insertOne({ name: participant.name, lastStatus: Date.now() });
    await db.collection("messages").insertOne({
      from: participant.name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      currentTime,
    });

    res.sendStatus(201);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
    return;
  }
});

app.post("/messages", async (req, res) => {
  console.log("tentando");
  const message = req.body;
  const user = req.headers.user;
  const currentTime = dayjs().format("HH:mm:ss");
  let messageType = message.type;
  if (message.to !== "Todos") {
    messageType = "private_message";
  }

  const validation = messageSchema.validate(message);
  if (validation.error) {
    res.sendStatus(422);
    return;
  }

  const checkUser = await db.collection("participants").findOne({ name: user });
  if (!checkUser) {
    res.sendStatus(422);
    return;
  }

  try {
    await db.collection("messages").insertOne({
      from: user,
      to: message.to,
      text: message.text,
      type: messageType,
      time: currentTime,
    });
    console.log(
      "from",
      user,
      "to",
      message.to,
      "text",
      message.text,
      "type",
      messageType
    );
    res.sendStatus(201);
  } catch (error) {
    res.sendStatus(500);
    return;
  }
});

app.get("/messages", async (req, res) => {
  const limit = parseInt(req.query.limit);
  const user = req.headers.user;

  try {
    const messages = await db.collection("messages").find().toArray();
    const userMessages = messages.filter(
      (message) =>
        message.from === user || message.to === user || message.to === "Todos"
    );
    const limitMessages = userMessages.slice(-limit);

    res.send(limitMessages);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.post("/status", async (req, res) => {
  const user = req.headers.user;
  const checkUser = await db
    .collection("participants")
    .findOne({ name: req.headers.user });
  if (!checkUser) {
    res.sendStatus(404);
    return;
  }
  try {
    await db
      .collection("participants")
      .updateOne({ name: user }, { $set: { lastStatus: dateNow } });
    res.sendStatus(200);
  } catch {
    res.sendStatus(404);
    return;
  }
});

app.listen(5000, () => {
  console.log("Server listening on port", 5000);
});
