/** @format */

const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000; // use Heroku-provided port or default to 3000
const multer = require("multer");
const fs = require("fs").promises;
const upload = multer({ dest: "uploads/" });

app.use(
  cors({
    origin: [
      "https://YOUR_WEB.cz",
      "http://localhost:5009",
      "http://193.86.YOUR.IP:5009",
    ],
  })
);

const uri = process.env.MONGODB_URI; // load uri from environment variable in heroku!
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.get("/collections", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("messages"); // change accordingly
    const collections = await db.listCollections().toArray();

    const collectionNames = collections
      .map((collection) => collection.name)
      .sort((a, b) => {
        // sort collections by name
        if (a < b) {
          return -1;
        }
        if (a > b) {
          return 1;
        }
        return 0;
      });
    console.log(collectionNames);
    res.status(200).json(collectionNames);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching collections");
  } finally {
    await client.close();
  }
});

app.get("/messages/:collectionName", async (req, res) => {
  const collectionName = req.params.collectionName;

  try {
    await client.connect();
    const db = client.db("messages");
    const collection = db.collection(collectionName);

    const messages = await collection
      .aggregate([
        {
          $addFields: {
            sender_id_INTERNAL: {
              $ifNull: ["$sender_id_INTERNAL", 0],
            },
          },
        },
        {
          $sort: {
            timestamp_ms: 1,
          },
        },
        {
          $addFields: {
            timestamp: {
              $toDate: "$timestamp_ms",
            },
          },
        },
      ])
      .toArray();
    console.log(messages);
    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error querying messages");
  } finally {
    await client.close();
  }
});

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).send("No file provided");
    return;
  }

  let fileContent;
  try {
    fileContent = await fs.readFile(req.file.path, "utf-8");
  } catch (error) {
    console.error("Error reading file:", error);
    res.status(500).send("Error reading file");
    return;
  }

  let jsonData;
  try {
    jsonData = JSON.parse(fileContent);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    res.status(400).send("Invalid JSON file");
    return;
  }

  const { participants, messages } = jsonData;
  if (!participants || !messages) {
    res.status(400).send("Invalid JSON structure");
    return;
  }

  const collectionName = participants[0].name;

  try {
    await client.connect();
    const db = client.db("messages");
    const collection = db.collection(collectionName);

    await collection.insertMany(messages);
    res.status(200).send(`Messages uploaded to collection: ${collectionName}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error uploading messages");
  } finally {
    await client.close();
    // Delete the temporary file
    await fs.unlink(req.file.path);
  }
});

app.delete("/delete/:collectionName", async (req, res) => {
  const collectionName = req.params.collectionName;

  try {
    await client.connect();
    const db = client.db("messages");
    const collection = db.collection(collectionName);

    await collection.drop();
    res.status(200).send(`Collection dropped: ${collectionName}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error dropping collection");
  } finally {
    await client.close();
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
