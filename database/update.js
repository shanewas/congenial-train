/**
 * Updates rows in a table in a SQLite database.
 *
 * @param {Object} db - The SQLite database object.
 * @param {string} tableName - The name of the table.
 * @param {Object} values - An object containing the column names and new values for the updated rows.
 * @param {string} where - A boolean expression specifying the criteria for updating rows.
 * @returns {Promise<void>} - A promise that resolves when the rows are updated.
 */
async function update(db, tableName, values, where) {
    return new Promise((resolve, reject) => {
      let sql = `UPDATE ${tableName} SET `;
      const valuesList = [];
      for (const key in values) {
        valuesList.push(`${key} = ${values[key]}`);
      }
      sql += valuesList.join(', ');
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
    update
  };
  