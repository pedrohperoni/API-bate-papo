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
  type: joi.string().required().valid("message", "private_message"),
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
    res.status(409).send("Usuário já cadastrado.");
  }

  try {
    await db
      .collection("participants")
      .insertOne({ name: participant.name, lastStatus: Date.now() });
    console.log(Date.now());
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
  }
});

app.get("/messages", async (req, res) => {
  try {
    const messages = await db.collection("messages").find().toArray();
    res.send(messages);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.post("/messages", (req, res) => {});

app.post("/status", (req, res) => {});

app.listen(5000, () => {
  console.log("Server listening on port", 5000);
});
