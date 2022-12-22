const { dotenv, path, root, axios, request } = require("../imgur/config");
const { connect } = require("../database/connect.js");
const { createTable } = require("../database/createTables");
const { insert } = require("../database/insert");
// Set the path to the root folder

let json = {
  data: {
    id: "uMOQ411",
    title: "random image",
    description: "for testing random image",
    datetime: 1671597587,
    type: "image/png",
    animated: false,
    width: 1251,
    height: 687,
    size: 864226,
    views: 0,
    bandwidth: 0,
    vote: null,
    favorite: false,
    nsfw: null,
    section: null,
    account_url: null,
    account_id: 72002127,
    is_ad: false,
    in_most_viral: false,
    has_sound: false,
    tags: [],
    ad_type: 0,
    ad_url: "",
    edited: "0",
    in_gallery: false,
    deletehash: "9HaUmlJqjZpuY1Y",
    name: "",
    link: "https://i.imgur.com/uMOQ411.png",
  },
  success: true,
  status: 200,
};

async function uploadToImgur(image, imageInfo) {
  return new Promise((resolve, reject) => {
    let formData = {};
    formData.image = image;

    // if ("albumHash" in imageInfo) {
    //   formData.album = imageInfo.albumHash;
    // }

    // if ("type" in imageInfo) {
    //   formData.type = imageInfo.type;
    // }

    // if ("name" in imageInfo) {
    //   formData.name = imageInfo.name;
    // }

    // if ("title" in imageInfo) {
    //   formData.title = imageInfo.title;
    // }

    // if ("description" in imageInfo) {
    //   formData.description = imageInfo.description;
    // }

    // if ("disable_audio" in imageInfo) {
    //   formData.disable_audio = imageInfo.disable_audio;
    // }

    // formData.client_secret = process.env.IMGUR_SECRET;

    request.post(
      {
        // url: "https://api.imgur.com/3/image",
        // headers: {
        //   Authorization: `Bearer ${process.env.IMGUR_TOKEN}`,
        // },
        // formData: formData,
      },
      (error, response, body) => {
        // if (error) {
        //   reject(error);
        //   return;
        // }

        // const { data, success } = JSON.parse(body);
        // if (!success) {
        //   reject(new Error("Failed to upload image"));
        //   return;
        // }

        // resolve(data); // return the response from the Imgur API

        resolve(json);
      }
    );
  });
}

async function uploadImage(image, imageInfo) {
  let imageData;
  if (image.startsWith("http")) {
    // Download the image and convert it to base64
    const response = await axios.get(image, { responseType: "arraybuffer" });
    imageData = Buffer.from(response.data, "binary").toString("base64");
  } else {
    // If image is base64, just use it
    imageData = image;
  }

  // Upload the image to Imgur and get the response data
  const imgurResponse = await uploadToImgur(imageData, imageInfo);
  console.log(imgurResponse.data.link);
  // Connect to the SQLite database
  const db = await connect();

  // Create the table if it doesn't exist
  createTable(db, imageInfo.name, [
    "id",
    "title",
    "description",
    "datetime",
    "type",
    "animated",
    "width",
    "height",
    "size",
    "views",
    "bandwidth",
    "vote",
    "favorite",
    "nsfw",
    "section",
    "account_url",
    "account_id",
    "is_ad",
    "in_most_viral",
    "has_sound",
    "tags",
    "ad_type",
    "ad_url",
    "edited",
    "in_gallery",
    "deletehash",
    "name",
    "link",
  ]).then(() => {
    // Save the image information and Imgur response in the "imageInfo.name" table
    insert(db, imageInfo.name, [
      imgurResponse.data.id,
      imgurResponse.data.title,
      imgurResponse.data.description,
      imgurResponse.data.datetime,
      imgurResponse.data.type,
      imgurResponse.data.animated,
      imgurResponse.data.width,
      imgurResponse.data.height,
      imgurResponse.data.size,
      imgurResponse.data.views,
      imgurResponse.data.bandwidth,
      imgurResponse.data.vote,
      imgurResponse.data.favorite,
      imgurResponse.data.nsfw,
      imgurResponse.data.section,
      imgurResponse.data.account_url,
      imgurResponse.data.account_id,
      imgurResponse.data.is_ad,
      imgurResponse.data.in_most_viral,
      imgurResponse.data.has_sound,
      imgurResponse.data.tags,
      imgurResponse.data.ad_type,
      imgurResponse.data.ad_url,
      imgurResponse.data.edited,
      imgurResponse.data.in_gallery,
      imgurResponse.data.deletehash,
      imgurResponse.data.name,
      imgurResponse.data.link,
    ]);
  });
  return imgurResponse;
}

module.exports = {
  uploadImage,
};

//postdata
// {
//   "image": "https://i.imgur.com/L0DsN2f.jpg",
//   "imageInfo": {
//       "album": "demo test",
//       "name": "sssss",
//       "title": "random image",
//       "age": 21,
//       "description": "for testing random image",
//       "json": {
//           "test": "test",
//           "test2": 21
//       }
//   }
// }
