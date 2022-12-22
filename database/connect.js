const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

async function connect() {
  const dbPath = process.env.DB_PATH || '.';
  const dbName = process.env.DB_NAME || 'database.db';
  const dbFile = `${dbPath}/${dbName}`;

  return new Promise((resolve, reject) => {
    // Check if the database file exists
    fs.access(dbFile, fs.constants.F_OK, err => {
      // If the file doesn't exist, create it
      if (err) {
        fs.closeSync(fs.openSync(dbFile, 'w'));
      }

      // Connect to the database
      const db = new sqlite3.Database(dbFile, err => {
        if (err) {
          reject(err);
        } else {
          resolve(db);
        }
      });
    });
  });
}

module.exports = {
  connect
};
