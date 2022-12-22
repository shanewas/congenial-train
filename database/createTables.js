async function createTable(db, tableName, columns) {
    return new Promise((resolve, reject) => {
      try {
        const columnDefinitions = columns.join(',');
        db.run(`CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefinitions})`, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve({ message: `Table ${tableName} created` });
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }
  
  module.exports = {
    createTable,
  };
  