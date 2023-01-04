//require the axios library
const axios = require("axios");

async function checkLogin(req) {
  //check if req.session.isLoggedIn exists, if not create one and set it to false
  if (req.session.isLoggedIn === undefined) {
    req.session.isLoggedIn = false;
  }

  if (req.session.isLoggedIn) {
    // The user is logged in.
    return true;
  } else {
    // The user is not logged in.
    // Check if there is an access token stored in the session.
    if (req.session.accessToken) {
      // There is an access token. Verify its validity.
      const isValid = await verifyAccessToken(req.session.accessToken);
      if (isValid) {
        // If the access token is valid, log in the user and reset the timer.
        req.session.isLoggedIn = true;
      }
      return isValid;
    } else {
      // There is no access token.
      return false;
    }
  }
}

async function verifyAccessToken(accessToken) {
  try {
    // make a request to the Imgur API to verify the access token
    const response = await axios.get("https://api.imgur.com/3/account/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.status === 200;
  } catch (error) {
    return false;
  }
}

module.exports = {
  checkLogin,
};
