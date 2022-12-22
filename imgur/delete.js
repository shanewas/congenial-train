const axios = require("axios");

const IMGUR_CLIENT_ID = "your_client_id";
const IMGUR_API_URL = "https://api.imgur.com/3";

async function deleteImage(deletehash) {
  try {
    // Make a DELETE request to the Imgur API using the deletehash
    const response = await axios.delete(
      `${IMGUR_API_URL}/image/${deletehash}`,
      {
        headers: {
          Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
}

module.exports = { deleteImage };
