import express, { json } from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(json());
app.use(cors());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect().then(() => {
  db = mongoClient.db("API-bate-papo");
});

app.get("/participants", (req, res) => {
  db.collection("participants")
    .find({})
    .toArray()
    .then((x) => {
      res.send(x);
    });
});

app.post("/participants", (req, res) => {
  db.collection("participants")
    .insertOne(req.body)
    .then(() => {
      res.sendStatus(201);
    });
});

app.get("/messages", (req, res) => {
  res.send("OK");
});

app.post("/messages", (req, res) => {});

app.post("/status", (req, res) => {});

app.listen(5000, () => {
  console.log("Server listening on port", 5000);
});
