//require the axios library
const axios = require("axios");

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
  verifyAccessToken,
};
