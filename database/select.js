/**
 * Retrieves rows from a table in a SQLite database.
 *
 * @param {Object} db - The SQLite database object.
 * @param {string} tableName - The name of the table.
 * @param {string[]} columns - An array of column names to be retrieved.
 * @param {string} [where] - An optional boolean expression specifying the criteria for selecting rows.
 * @returns {Promise<Object[]>} - A promise that resolves with an array of objects representing the retrieved rows.
 */
async function select(db, tableName, columns, where) {
    return new Promise((resolve, reject) => {
      let sql = `SELECT ${columns.join(',')} FROM ${tableName}`;
      if (where) {
        sql += ` WHERE ${where}`;
      }
  
      db.all(sql, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
  
  module.exports = {
    select
  };
  