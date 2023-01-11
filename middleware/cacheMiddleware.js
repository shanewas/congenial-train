const LRU = require("lru-cache");
const Cache = require("../models/Cache.js");

const cache = new LRU({
  max: 500,
  maxSize: 5000,
  sizeCalculation: (value, key) => {
    return 1;
  },
});

function cacheMiddleware(req, res, next) {
  const key = req.originalUrl;
  Cache.findOne({ key: key }, (err, cacheEntry) => {
    if (err) return next(err);
    if (cacheEntry) {
      console.log(`Data retrieved from cache for key: ${key}`);
      return res.send(cacheEntry.data);
    }
    // retrieve data from database and store it in cache
    Cache.find({ key: key }, (err, data) => {
      if (err) return next(err);
      if (!data) {
        // If there is no data to store in cache, just continue
        return next();
      }
      const cacheEntry = new Cache({ key: key, data: data });
      cacheEntry.save((err) => {
        if (err) return next(err);
        res.send(data);
      });
    });
  });
}

module.exports = cacheMiddleware;
