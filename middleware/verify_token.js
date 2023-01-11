const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // Extract the token from the request headers
  //check from session authorization
  //get token from express session if it exists
  if (req.session.token) {
    req.headers.authorization = req.session.token;
  }
  if (!token) {
    res.status(401).send({ error: "Unauthorized: No token provided" });
  }

  // Verify the token using the secret
  try {
    const decoded = jwt.verify(token, secret);
    req.userId = decoded.userId;
    req.email = decoded.email;
    next();
  } catch (error) {
    res.status(401).send({ error: "Unauthorized: Invalid token" });
  }
};
