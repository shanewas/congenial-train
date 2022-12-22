const express = require("express");
const session = require("express-session");
const app = express();
const { dotenv, path, root, axios, request } = require("./imgur/config");

app.use(
  session({
    secret: `${process.env.IMGUR_SECRET}`, // a secret key to sign the session ID cookie
    resave: false, // don't save the session if it hasn't changed
    saveUninitialized: false, // don't create a session if the user hasn't logged in
  })
);

const { uploadImage } = require("./imgur/upload");
const { deleteImage } = require("./imgur/delete");
const bodyParser = require("body-parser");
// ...
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.post("/upload", async (req, res) => {
  try {
    const image = req.body.image; // the image file or URL
    const imageInfo = req.body.imageInfo; // object containing metadata about the image
    const response = await uploadImage(image, imageInfo);
    res.send(response);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.delete("/delete", (req, res) => {
  const deletehash = req.query.deletehash;
  const link = req.query.link;
  const tableName = req.query.tableName;

  if (deletehash) {
    // Use the Imgur delete API to delete the image using the deletehash
    deleteImage(deletehash)
      .then(() => {
        res.status(200).send({ message: "Image deleted successfully" });
      })
      .catch((error) => {
        res.status(500).send({ message: "Error deleting image" });
      });
  } else if (link && tableName) {
    // Search the database for the link
    search(db, tableName, { link: link })
      .then((results) => {
        if (results.length > 0) {
          // Retrieve the deletehash from the search results
          const deletehash = results[0].deletehash;
          // Use the Imgur delete API to delete the image using the deletehash
          deleteImage(deletehash)
            .then(() => {
              res.status(200).send({ message: "Image deleted successfully" });
            })
            .catch((error) => {
              res.status(500).send({ message: "Error deleting image" });
            });
        } else {
          res.status(404).send({ message: "Image not found" });
        }
      })
      .catch((error) => {
        res.status(500).send({ message: "Error searching database" });
      });
  } else {
    res.status(400).send({
      message: "deletehash or (link and tableName) parameters required",
    });
  }
});

// Default route.
app.get("/", (req, res) => {
  // Check if the user is logged in.
  if (req.session.accessToken) {
    // The user is logged in.
    res.send("Hello, user!");
  } else {
    // The user is not logged in.
    // Redirect the user to the Imgur OAuth authorization page.
    res.redirect(
      `https://api.imgur.com/oauth2/authorize?client_id=${process.env.IMGUR_CLIENT_ID}&response_type=code&state=APPLICATION_STATE`
    );
  }
});

app.get("/callback", (req, res) => {
  const { code } = req.query;

  // Exchange the authorization code for an access token.
  request.post(
    {
      url: "https://api.imgur.com/oauth2/token",
      form: {
        grant_type: "authorization_code",
        code,
        client_id: process.env.IMGUR_CLIENT_ID,
        client_secret: process.env.IMGUR_SECRET,
      },
    },
    (error, response, body) => {
      if (error) {
        return res.status(500).send(error);
      }

      const { access_token, refresh_token, expires_in } = JSON.parse(body);

      // Save the access token and refresh token in the session.
      req.session.accessToken = access_token;
      req.session.refreshToken = refresh_token;

      // Redirect the user to the home page.
      return res.redirect("/");
    }
  );
});

app.listen(3000, () => {
  console.log("API listening on port 3000");
});
