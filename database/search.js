/**
 * Searches a SQLite table for rows matching the specified criteria, using indexing to improve performance.
 *
 * @param {Object} db - A SQLite database object.
 * @param {string} tableName - The name of the table to search.
 * @param {Object} searchCriteria - An object containing key-value pairs representing the search criteria.
 * @param {string[]} [columns] - An optional array of columns to return. If not specified, all columns will be returned.
 * @param {number} [limit] - An optional limit on the number of rows to return.
 * @param {Object} [orderBy] - An optional object containing the column name and order to sort the results by.
 *
 * @returns {Promise} A promise that resolves with an array of rows matching the search criteria.
 */
async function search(
    db,
    tableName,
    searchCriteria,
    columns = [],
    limit,
    orderBy
  ) {
    return new Promise((resolve, reject) => {
      let sql = `SELECT ${columns.join(",") || "*"} FROM ${tableName} WHERE `;
      const criteria = [];
      const values = [];
  
      // Build the WHERE clause and values array from the search criteria object
      for (const key in searchCriteria) {
        criteria.push(`${key} = ?`);
        values.push(searchCriteria[key]);
      }
      sql += criteria.join(" AND ");
  
      // Use an index for faster searching if one exists on the search criteria columns
      const indexColumns = Object.keys(searchCriteria);
      const indexName = `${tableName}_${indexColumns.join("_")}_idx`;
      sql += ` AND ${indexName}`;
  
      // Add the LIMIT clause if specified
      if (limit) {
        sql += ` LIMIT ${limit}`;
      }
  
      // Add the ORDER BY clause if specified
      if (orderBy) {
        sql += ` ORDER BY ${orderBY.column} ${orderBy.order}`;
      }
      db.all(sql, values, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
  
  module.exports = {
    search,
  };
  