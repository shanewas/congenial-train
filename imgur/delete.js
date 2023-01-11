const axios = require("axios");
const Image = require("../models/Image");
const request = require("request");

async function deleteImage(req, res) {
  let imageData = req.query.link;
  //want to search in two fields in the database for the image data the fields are link and imageData
  const image = await Image.findOne({
    $or: [{ imageData: imageData }, { link: imageData }],
  });
  //if image is not found in the database
  // if (!image) {
  //   res.send({ success: false, message: "Image not found" });
  // }
  // bDmDiCiwI36uTiG
  const deletehash = "bDmDiCiwI36uTiG";
  const access_token = "e145ab96196e476be072e79d9914a4330dfda074";

  //delete from imgur using deletehash also remove from database after successful deletion
  try {
    await axios
      .delete(
        `https://api.imgur.com/3/image/${deletehash}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
        (error, response, body) => {
          //send response to client
          res.send({ response });
          if (error) {
            res.send({ success: false, message: response });
          }
        }
      )
      .then((response) => {
        res.send({ success: true, message: "Image deleted" });
      });
    await Image.findOneAndDelete({ imageData: imageData })
      .then(() => {
        res.send({ success: true, message: "Image deleted" });
      })
      .catch((err) => console.log(err));
  } catch (error) {
    res.send({ success: false, message: "Image not found" });
  }
}

module.exports = { deleteImage };

// request.post(
//   {
//     // url: "https://api.imgur.com/3/image",
//     // headers: {
//     //   Authorization: `Bearer ${process.env.IMGUR_TOKEN}`,
//     // },
//     // formData: formData,
//   },
//   (error, response, body) => {
//     // if (error) {
//     //   reject(error);
//     //   return;
//     // }

//     // const { data, success } = JSON.parse(body);
//     // if (!success) {
//     //   reject(new Error("Failed to upload image"));
//     //   return;
//     // }

//     // resolve(data); // return the response from the Imgur API

//     resolve(json);
//   }
// );
