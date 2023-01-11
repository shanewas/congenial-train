const mongoose = require("mongoose");

const Cache = mongoose.model("Cache", {
  key: String,
  data: Object,
});

module.exports = Cache;
