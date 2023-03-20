/** @format */

const express = require("express");
const app = express();
const path = require("path");
const morgan = require("morgan");
const dotenv = require("dotenv");
dotenv.config();
const port = process.env.PORT || 3000;

app.use(morgan("dev"));

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "build/index.html"));
  });
}

app.listen(port, () => {
  console.log("Server running on port: ", port);
});
