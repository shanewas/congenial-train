const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  datetime: Number,
  type: String,
  animated: Boolean,
  width: Number,
  height: Number,
  size: Number,
  views: Number,
  bandwidth: Number,
  vote: String,
  favorite: Boolean,
  nsfw: String,
  section: String,
  account_url: String,
  account_id: Number,
  is_ad: Boolean,
  in_most_viral: Boolean,
  has_sound: Boolean,
  tags: [], // change this to an array of strings
  ad_type: Number,
  ad_url: String,
  edited: String,
  in_gallery: Boolean,
  deletehash: String,
  name: String,
  link: String,
  image: String,
});

const Image = mongoose.model("Image", ImageSchema);

module.exports = Image;
