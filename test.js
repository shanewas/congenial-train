const express = require("express");
const redis = require("redis");
const RedisServer = require("redis-server");

const app = express();

// Simply pass the port that you want a Redis server to listen on.
const server = new RedisServer(6379);
server.open((err) => {
  if (err === null) {
    console.log("Redis server is running on port 6379");
  }
});

// create a Redis client
const redisClient = redis.createClient({
  host: "localhost", // replace with your Redis host
  port: 6379, // replace with your Redis port
});

// set up your Express routes and middleware as needed

app.listen(3000, () => {
  console.log("Express server is running on port 3000");
});
