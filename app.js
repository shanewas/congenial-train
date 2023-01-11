const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const path = require("path");
const axios = require("axios");
const request = require("request");
const mongoose = require("mongoose");

// start the Redis server
const User = require("./models/User");
const Image = require("./models/Image");
const { findOneAndUpdate } = require("./models/User");

const root = path.resolve(__dirname, ".");
// Configure dotenv to read the .env file from the root folder
dotenv.config({ path: path.join(root, ".env") });

const port = process.env.PORT || 3000;
const app = express();
// const serviceAccount = require("./serviceAccountKey.json");
app.use(express.json());

//session
const isProduction = process.env.NODE_ENV === "production";

// Connect to the database
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//
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
app.get("/users", verifyToken, async (req, res) => {
  try {
    const users = await User.find();
    //send the data to the client
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//set delay for user
app.post("/users/delay", verifyToken, async (req, res) => {
  //delay min 1 max 30. set a validation
  if (req.body.delay < 1 || req.body.delay > 30) {
    return res.status(400).send("Delay must be between 1 and 30");
  }
  const user = await User.findOneAndUpdate(
    { id: req.jwt.userid },
    {
      $set: {
        delay: req.body.delay,
      },
    },
    { upsert: true, new: true }
  );
  user.save();
  res.json({ delay: user.delay });
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

//similarly create a user by id route
app.get("/users/:id/:token", (req, res) => {
  const user = {
    id: req.params.id,
    token: req.params.token,
  };
  res.json(user);
});

// http://localhost:3000/imgur/u?link=https://i.imgur.com/RKBqY5q.png
//=================================IMGUR API==================================
app.post("/imgur", verifyToken, async (req, res) => {
  // Get the authorization header and check if it is a Bearer token
  let formData = {};
  let imageData = req.body.image || "";
  let description = req.body.description || "";

  // Check if the image is a link or raw image data
  if (imageData.startsWith("http")) {
    // If the image is a link, check if it is a valid link
    try {
      await axios.head(imageData);
    } catch {
      return res.status(400).send({ error: "Invalid image !" });
    }
    //then convert the link to base64
    imageData = await axios.get(imageData, { responseType: "arraybuffer" });
    imageData = Buffer.from(imageData.data, "binary").toString("base64");
  }

  //check if imageData is already in the database
  const imageCheck = await Image.findOne({ image: imageData });
  if (imageCheck) {
    return res.send({ link: imageCheck.link });
  }
  formData.image = imageData;
  formData.description = description;
  try {
    const response = await axios.post(
      "https://api.imgur.com/3/image",
      formData,
      {
        headers: {
          Authorization: `Bearer ${req.jwt.access_token}`,
        },
      }
    );
    const { data, success } = response.data;
    if (!success) {
      throw new Error("Failed to upload image");
    }
    // Save the response using Mongoose
    const image = new Image({ ...data, image: imageData });
    await image.save();
    const user = await User.findOneAndUpdate(
      { id: req.jwt.userid },
      { $push: { images: image._id } },
      { upsert: true, new: true }
    );
    await user.save();
    return res.send({ link: data.link });
  } catch (error) {
    return res.status(500).send({ error: "An error occurred" });
  }
});

app.delete("/imgur", verifyToken, async (req, res) => {
  let link = req.query.link;
  console.log(link);
  // Search the database for the deletehash associated with the link
  const image = await Image.findOne({ link });
  if (!image) {
    return res.status(400).json({ error: "Invalid image link" });
  }
  const deletehash = image.deletehash;

  // Delete the image from Imgur using the delete hash
  try {
    const response = await axios.delete(
      `https://api.imgur.com/3/image/${deletehash}`,
      {
        headers: {
          Authorization: `Bearer ${req.jwt.access_token}`,
        },
      }
    );
    const { data, success } = response.data;
    console.log(data);
    if (!success) {
      throw new Error("Image deletion failed!");
    }

    // Remove the image from the database
    await Image.findOneAndRemove({ deletehash });
    //delete the entry from images under user table
    const user = await User.findOneAndUpdate(
      { id: req.jwt.userid },
      { $pull: { images: image._id } },
      { upsert: true, new: true }
    );
    await user.save();
    return res.status(200).json({ message: "Image deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "An error occurred" });
  }
});

//============================================================================

// ===============================
// create a protected route that requires authentication
app.get("/protected", async (req, res) => {
  let jwttoken = req.query.jwttoken;
  try {
    // Verify the JWT and extract the access token and refresh token
    const decoded = jwt.verify(jwttoken, process.env.JWT_SECRET);
    const accessToken = decoded.access_token;
    const refreshToken = decoded.refresh_token;
    // Check if the JWT has expired
    if (Date.now() / 1000 > decoded.exp) {
      // If the JWT has expired, use the refresh token to obtain a new access token
      jwttoken = await refreshToken(refreshToken);
    }

    // Make an API request using the access token
    request.get(
      {
        url: "https://api.imgur.com/3/account/me",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      async (err, httpResponse, body) => {
        if (err) {
          return res.status(500).json({ error: "Error making API request" });
        }

        // parse the API response body to an object
        const data = JSON.parse(body);
        // find or create the user in the database and update the document
        // map the user data from the API response to the user model
        let user = await User.findOneAndUpdate(
          { id: data.data.id },
          {
            $set: {
              id: data.data.id,
              url: data.data.url,
              token: jwttoken,
              bio: data.data.bio,
              reputation: data.data.reputation,
              created: data.data.created,
            },
          },
          { upsert: true, new: true }
        );
        await user.save();
        // Set the new JWT as a cookie
        res.cookie("jwttoken", jwttoken, {
          httpOnly: true,
          sameSite: "lax",
        });
        // Respond with the updated user and new JWT token
        res.json(user);
      }
    );
  } catch (error) {
    // If the JWT is invalid or has expired, respond with a 401 status
    return res.status(401).json({ error: "Unauthorized" });
  }
});

app.delete("/logout", async (req, res) => {
  const authorizationHeader = req.headers["authorization"];
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authorizationHeader.split(" ")[1];

  try {
    // Find the user in the database by token and clear the token field
    await User.findOneAndUpdate({ token: token }, { $set: { token: null } });
    res.clearCookie("jwttoken");
    return res.status(200).json({ message: "Successfully logged out" });
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
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
      //change the expires in to jwt exp formate
      exp = Date.now() / 1000 + expires_in;
      const jwttoken = jwt.sign(
        {
          access_token: access_token,
          refresh_token: refresh_token,
          exp: exp,
        },
        process.env.JWT_SECRET
      );
      res.redirect(`/protected?jwttoken=${jwttoken}`);
    }
  );
});

async function refreshToken(refreshToken) {
  const url = "https://api.imgur.com/oauth2/token";
  const options = {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: process.env.IMGUR_CLIENT_ID,
    client_secret: process.env.IMGUR_SECRET,
  };
  const response = await axios.post(url, options);
  const { data } = response;
  const { access_token, expires_in } = data;
  const decoded = jwt.decode(jwttoken);
  const jwttoken = jwt.sign(
    { ...decoded, access_token, expires_in },
    process.env.JWT_SECRET,
    { expiresIn: expires_in }
  );
  //destructure the jwttoken
  return jwttoken;
}

async function verifyToken(req, res, next) {
  const authorizationHeader = req.headers["authorization"];
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return res.status(401).send({ error: "Unauthorized" });
  }
  const token = authorizationHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (Date.now() / 1000 > decoded.exp) {
      if (decoded.refresh_token) {
        const newToken = await refreshToken(decoded.refresh_token);
        req.headers["authorization"] = `Bearer ${newToken}`;
        req.jwt = jwt.verify(newToken, process.env.JWT_SECRET);
        next();
      } else {
        return res.status(401).send({ error: "Unauthorized" });
      }
    }
    // Check the provided token with the stored token under the user's token field
    const user = await User.findOne({ token });
    if (!user) {
      return res.status(401).send({ error: "Unauthorized" });
    }
    //append userid with the decoded jwt
    decoded.userid = user.id;
    console.log(user.id);
    req.jwt = decoded;
    next();
  } catch (error) {
    return res.status(401).send({ error: "Unauthorized" });
  }
}

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
