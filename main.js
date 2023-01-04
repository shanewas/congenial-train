
// Generate a JWT for the user
function generateJWT(user) {
  return jwt.sign(user, "secret", { expiresIn: "1h" });
}

app.post("/send-email", (req, res) => {
  mail.sendEmail(req.body.to, req.body.subject, req.body.text);
  res.send({ message: "Email sent successfully" });
});

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

app.post("/users", (req, res) => {
  // Create a new document in the 'users' collection
  db.collection("users")
    .add({
      name: req.body.name,
      email: req.body.email,
    })
    .then((doc) => {
      // Document created successfully
      res.send({ message: "User added successfully", docId: doc.id });
    })
    .catch((error) => {
      // Error creating document
      res.send({ error: "Error adding user: " + error });
    });
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




app.get("/data", async (req, res) => {
  try {
    const db = await connect();
    const tableName = "swift";
    const columns = [
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
    ];
    const where = null; // optional WHERE clause

    const rows = await select(db, tableName, columns, where);
    //set json data to response
    return res.send(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error retrieving data");
  }
});

app.post("/login", (req, res) => {
  // Look up the user's hashed password in the database
  db.collection("users")
    .where("email", "==", req.body.email)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        // No matching user found
        res.send({ error: "Invalid email or password" });
      } else {
        // User found, compare provided password to stored hashed password
        snapshot.forEach((doc) => {
          bcrypt.compare(
            req.body.password,
            doc.data().password,
            (error, result) => {
              if (error) {
                res.send({ error: "Error comparing passwords: " + error });
              } else if (result) {
                // Passwords match, generate and send JWT
                const user = { email: doc.data().email };
                const token = generateJWT(user);
                res.send({ message: "Logged in successfully", token: token });
              } else {
                // Passwords do not match
                res.send({ error: "Invalid email or password" });
              }
            }
          );
        });
      }
    })
    .catch((error) => {
      // Error fetching user
      res.send({ error: "Error fetching user: " + error });
    });
});

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");



app.post("/register", (req, res) => {
  // Validate the request body
  if (!req.body.email || !req.body.password) {
    res.send({ error: "Missing email or password" });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
    // Invalid email format
    res.send({ error: "Invalid email format" });
  } else {
    // Generate a unique code for the user
    const code = Math.floor(Math.random() * 1000000).toString();
    // Send the code to the user's email address
    transporter
      .sendMail({
        from: "trinity@discord.com",
        to: req.body.email,
        subject: "Email Verification Code",
        text: `Your email verification code is: ${code}`,
      })
      .then(() => {
        // Code sent successfully, hash the user's password
        bcrypt.hash(req.body.password, 10, (error, hash) => {
          if (error) {
            res.send({ error: "Error hashing password: " + error });
          } else {
            // Save the user to the database
            db.collection("users")
              .add({
                email: req.body.email,
                password: hash,
                verificationCode: code,
              })
              .then((doc) => {
                // User saved successfully
                res.send({ message: "Verification code sent to email" });
              })
              .catch((error) => {
                // Error saving user
                res.send({ error: "Error registering user: " + error });
              });
          }
        });
      })
      .catch((error) => {
        // Error sending code
        res.send({ error: "Error sending verification code: " + error });
      });
  }
});

app.post("/verify-email", (req, res) => {
  // Check if the provided code matches the code sent to the user's email
  db.collection("users")
    .where("email", "==", req.body.email)
    .where("verificationCode", "==", req.body.code)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        // Code does not match
        res.send({ error: "Invalid verification code" });
      } else {
        // Code matches, update the user's emailVerified field
        snapshot.docs[0].ref
          .update({
            emailVerified: true,
          })
          .then(() => {
            res.send({ message: "Email verified successfully" });
          })
          .catch((error) => {
            res.send({ error: "Error verifying email: " + error });
          });
      }
    })
    .catch((error) => {
      res.send({ error: "Error checking verification code: " + error });
    });
});

