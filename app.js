const express = require("express");
const bodyParser = require("body-parser");
const https = require("https");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const path = require("path");
const axios = require("axios");
const request = require("request");
const uuid = require("uuid");
const mongoose = require("mongoose");
const session = require("express-session");

// start the Redis server
const User = require("./models/User");
const Image = require("./models/Image");
const Cache = require("./models/Cache");

const cacheMiddleware = require("./middleware/cacheMiddleware");
const { checkLogin } = require("./middleware/auth/authentication.js");

const root = path.resolve(__dirname, ".");
// Configure dotenv to read the .env file from the root folder
dotenv.config({ path: path.join(root, ".env") });

const port = process.env.PORT || 3000;
const app = express();
// const serviceAccount = require("./serviceAccountKey.json");
app.use(express.json());

//session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// Connect to the database
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//
const loginMiddleware = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    //set a session variable to redirect the user to the page they were trying to access after login
    req.session.redirectTo = req.path;
    //redirect the user to the login page
    return res.redirect(`/login`);
  }
  //if the user is logged in, proceed to the next middleware or route handler
  next();
};

app.use(bodyParser.urlencoded({ extended: true }));

// app.use(cacheMiddleware);

//auth
// app.use("/login", require("./routes/auth/login"));
// create a route to handle the Imgur authorization flow
app.get("/login", async (req, res) => {
  res.redirect(
    `https://api.imgur.com/oauth2/authorize?client_id=${process.env.IMGUR_CLIENT_ID}&response_type=code&state=APPLICATION_STATE`
  );
});

//imgur
// app.use("/upload", uploadImage);
// app.use("/delete", deleteImage);

// Default route.
app.get("/", (req, res) => {
  res.send("Hello, user!");
});

// app.use(loginMiddleware);
//get user list from database
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    //send the data to the client
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//similarly create a user by id route
app.get("/users/:id", (req, res) => {
  const { id } = req.params;
  User.findById(id)
    .then((user) => {
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: err.message });
    });
});

// http://localhost:3000/imgur/u?link=https://i.imgur.com/RKBqY5q.png
//=================================IMGUR API==================================
app.get("/imgur/u", async (req, res) => {
  let formData = {};
  formData.image = req.query.link;
  let description = "";
  if (req.query.description) {
    description = req.body.description;
  }

  // Check if the image is a link or raw image data
  if (image_data.startsWith("http")) {
    // If the image is a link, check if it is a valid link
    try {
      await axios.head(image_data);
    } catch {
      return { error: "Invalid image link" };
    }
    //then convert the link to base64
    image_data = await axios.get(image_data, { responseType: "arraybuffer" });
    image_data = Buffer.from(image_data.data, "binary").toString("base64");
  }

  //check if imageData is already in the database
  const image_check = await Image.findOne({ image: image_data });
  if (image_check) {
    return `https://i.imgur.com/${image_check.id}.png`;
  }

  request.post(
    {
      url: "https://api.imgur.com/3/image",
      headers: {
        Authorization: `Bearer ${req.session.access_token}`,
      },
      formData: formData,
    },
    (error, response, body) => {
      if (error) {
        reject(error);
        return;
      }

      const { data, success } = JSON.parse(body);
      if (!success) {
        reject(new Error("Failed to upload image"));
        return;
      }
      // return the response from the Imgur API
    }
  );
  // Save the response using Mongoose
  const image = new Image({
    id: json.data.id,
    title: json.data.title,
    description: json.data.description,
    datetime: json.data.datetime,
    type: json.data.type,
    animated: json.data.animated,
    width: json.data.width,
    height: json.data.height,
    size: json.data.size,
    views: json.data.views,
    bandwidth: json.data.bandwidth,
    vote: json.data.vote,
    favorite: json.data.favorite,
    nsfw: json.data.nsfw,
    section: json.data.section,
    account_url: json.data.account_url,
    account_id: json.data.account_id,
    is_ad: json.data.is_ad,
    in_most_viral: json.data.in_most_viral,
    has_sound: json.data.has_sound,
    tags: json.data.tags,
    ad_type: json.data.ad_type,
    ad_url: json.data.ad_url,
    edited: json.data.edited,
    in_gallery: json.data.in_gallery,
    deletehash: json.data.deletehash,
    name: json.data.name,
    link: json.data.link,
    image: image_data,
  });

  await image.save();
  res.send(json.data.link);
});

app.get("/imgur/d", async (req, res) => {
  // let link = req.query.link;
  // console.log(link);
  // res.send(link);
  res.send(await require("./imgur/delete").deleteImage(req, res));
});
//============================================================================

// ===============================
// create a protected route that requires authentication
app.get("/protected", (req, res) => {
  if (req.session.accessToken) {
    checkLogin(req).then((isValid) => {
      if (isValid) {
        //continue to the protected route
        let accessToken = req.session.accessToken;

        // make an API request using the access token
        request.get(
          {
            url: "https://api.imgur.com/3/account/me",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
          async (err, httpResponse, body) => {
            if (err) {
              return res.send("Error making API request");
            }

            // parse the API response body to an object
            const data = JSON.parse(body);

            // find the user in the database and update the document
            let user = await User.findOneAndUpdate(
              { id: data.data.id },
              { $set: { id: data.data.id, url: data.data.url } },
              { new: true }
            );
            if (!user) {
              user = new User({
                id: data.data.id,
                url: data.data.url,
              });
              await user.save();
            }
            if (req.session.redirectTo) {
              const redirectTo = req.session.redirectTo;
              delete req.session.redirectTo;
              res.redirect(redirectTo);
            } else {
              res.redirect("/");
            }
          }
        );
      } else {
        res.send("You are not logged in");
      }
    });
  } else {
    res.send("You are not logged in");
  }
});

//req.session.destroy();
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});
app.get("/callback", (req, res) => {
  console.log("callback");
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
        redirect_uri: process.env.IMGUR_REDIRECT_URI,
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
      // return res.redirect("/");
      //redirect to protected with req session
      //want to go the route user wanted to go before login page
      return res.redirect("/protected");
    }
  );
});

// // Set up the fail-safe route
// app.use((err, req, res, next) => {
//   // Handle the error and return a suitable response to the client
//   res
//     .status(500)
//     .send({ error: "An error occurred while processing the request" });
// });

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
