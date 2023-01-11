const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  id: { type: String },
  url: { type: String },
  token: { type: String },
  bio: { type: String },
  reputation: { type: Number },
  created: { type: Date },
  role: { type: String },
  pro_expiration: { type: Date },
  images: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Image",
    },
  ],
  delay: { type: Number, min: 1, max: 60 },
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
