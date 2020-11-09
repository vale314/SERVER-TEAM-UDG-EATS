const mysql = require("mysql");
const config = require("config");

const connectDB = mysql.createConnection(config.get("CONFIG"));

const connection = () =>
  connectDB.connect((err) => {
    if (err) return console.error(err);
    else {
      console.log("mysql connect");
      connectDB.end();
    }
  });

module.exports = {
  connectDB: connectDB,
  connection: connection,
};
