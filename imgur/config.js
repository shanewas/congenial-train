const dotenv = require("dotenv");
const path = require("path");

const root = path.resolve(__dirname, "..");
// Configure dotenv to read the .env file from the root folder
dotenv.config({ path: path.join(root, ".env") });

const axios = require("axios");
const request = require("request");

module.exports = {
  dotenv,
  path,
  root,
  axios,
  request
};
