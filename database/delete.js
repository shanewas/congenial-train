/**
 * Deletes rows from a table in a SQLite database.
 *
 * @param {Object} db - The SQLite database object.
 * @param {string} tableName - The name of the table.
 * @param {string} where - A boolean expression specifying the criteria for deleting rows.
 * @returns {Promise<void>} - A promise that resolves when the rows are deleted.
 */
async function deleteRows(db, tableName, where) {
    return new Promise((resolve, reject) => {
      let sql = `DELETE FROM ${tableName}`;
      if (where) {
        sql += ` WHERE ${where}`;
      }
  
      db.run(sql, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  
  module.exports = {
    deleteRows
  };
  