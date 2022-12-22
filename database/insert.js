/**
 * Inserts a row into a table in a SQLite database.
 *
 * @param {Object} db - The SQLite database object.
 * @param {string} tableName - The name of the table.
 * @param {Array} values - An array of values to be inserted into the row.
 * @returns {Promise<number>} - A promise that resolves with the ID of the inserted row.
 */
async function insert(db, tableName, values) {
    return new Promise((resolve, reject) => {
      const placeholders = values.map(() => '?').join(',');
      const sql = `INSERT INTO ${tableName} VALUES (${placeholders})`;
  
      db.run(sql, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }
  
  module.exports = {
    insert
  };
  