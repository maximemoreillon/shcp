var mysql = require('mysql');
var credentials = require('./credentials');
var misc = require('./misc');


var con = mysql.createConnection({
  host: "localhost",
  user: credentials.MySQL_username,
  password: credentials.MySQL_password,
  database: "home_automation"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");

  // Deleting old TABLE
  var sql = "DROP TABLE IF EXISTS " + misc.MySQL_table_name;
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table deleted");
  });


  // Creating new table
  var sql = "CREATE TABLE "+ misc.MySQL_table_name + " ("
  + "id INT AUTO_INCREMENT PRIMARY KEY, "
  + "type VARCHAR(255), "
  + "position_x VARCHAR(255), "
  + "position_y VARCHAR(255), "
  + "command_topic VARCHAR(255), "
  + "status_topic VARCHAR(255), "
  + "payload_on VARCHAR(255), "
  + "payload_off VARCHAR(255)"
  + ")";

  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table created");
    process.exit();
  });
});
