// Depenedencies
var fs = require('fs');
var express = require('express');
var expressSession = require('express-session')
var bodyParser = require("body-parser");
var mqtt = require('mqtt');
var https = require('https');
var mysql = require('mysql');

// Custom modules
var credentials = require('./credentials');
var misc = require('./misc');
var routing = require("./routing");



// Array containign all the devices, populated by a MySQL DB
var devices;

// MQTT config
const mqtt_options = {
  username: credentials.mqtt_username,
  password: credentials.mqtt_password
};

var mqtt_client  = mqtt.connect('mqtt://192.168.1.2', mqtt_options);

function subscribe_all(){
  // Subscribe to all topics

  console.log("Subscribing to all MQTT topics");
  for(var id in devices) {
    mqtt_client.subscribe(devices[id].status_topic);
  }
}

function unsubscribe_all(){
  // Subscribe to all topics

  console.log("Subscribing to all MQTT topics");
  for(var id in devices) {
    mqtt_client.unsubscribe(devices[id].status_topic);
  }
}

// Configuration of MySQL
function get_devices_from_MySQL_and_subscribe (){
  // WHERE TO PUT THIS??
  console.log("Refreshing devices from MySQL");
  con.query("SELECT * FROM " + misc.MySQL_table_name, function (err, result, fields) {
    if (err) throw err;

    // Extract all results to local variable
    //{1:{topic:banana,payload:roger},2:{}}

    devices = {};
    for (var result_index = 0; result_index < result.length; result_index++){
      devices[result[result_index].id] = {};
      devices[result[result_index].id].type = result[result_index].type;
      devices[result[result_index].id].state = "UNKNOWN";
      devices[result[result_index].id].position_x = result[result_index].position_x;
      devices[result[result_index].id].position_y = result[result_index].position_y;
      devices[result[result_index].id].command_topic = result[result_index].command_topic;
      devices[result[result_index].id].status_topic = result[result_index].status_topic;
      devices[result[result_index].id].payload_on = result[result_index].payload_on;
      devices[result[result_index].id].payload_off = result[result_index].payload_off;
    }

    // Subscribtion can only be done from within the MySQL query
    // Otherwise the device array is not populated yet
    subscribe_all();

  });
}



var con = mysql.createConnection({
  host: "localhost",
  user: credentials.MySQL_username,
  password: credentials.MySQL_password,
  database: "home_automation"
});

// Connecting to MySQL DB
con.connect(function(err) {
  if (err) throw err;

  console.log("MySQL Connected!");

  // TODO:  WHERE TO DISCONNECT?

  // Retreve devices from table and Subscribe
  // WARNING: MQTT might not be connected yet so execute this within the connection function
  get_devices_from_MySQL_and_subscribe();

});



// Configuration of SSL (not optimal)
const ssl_options = {
  key: fs.readFileSync(__dirname+'/ssl/privkey.pem'),
  cert: fs.readFileSync(__dirname+'/ssl/fullchain.pem')
};



// Function to check if user is logged in (has a user ID session)
function checkAuth(req, res, next) {
  if (!req.session.user_id) {
    res.render('login.ejs');
  }
  else {
    next();
  }
}

// Configuration of express
const app = express();

// App uses sessions to store session ID and know that theuser is logged in
app.use(expressSession({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));

// App uses bodyparser to parse post requests
app.use(bodyParser.urlencoded({
    extended: true
}));

// Respond to various page requests
// set the view engine to ejs
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));


// Respond to requests
// index page
app.get('/', checkAuth, function(req, res) {
  res.render('index.ejs', {
    // Passingthe variables
  });
});

app.get('/manage_devices', checkAuth, function(req, res) {
  res.render('manage_devices.ejs', {
    // Passing variables
  });
});

app.get('/show_table', checkAuth, function(req, res) {
  res.render('show_table.ejs', {
    // Passing variables
  });
});

app.post('/login', function (req, res) {
  var post = req.body;
  if (post.user === credentials.app_username && post.password === credentials.app_password) {
    // FOR NOW ONLY ONE USER
    req.session.user_id = 1;
    res.redirect('/');
  } else {
    res.send('Bad user/pass');
  }
});

app.get('/logout', function (req, res) {
  delete req.session.user_id;
  res.redirect('/');
});

app.post('/add_device', checkAuth,function(req, res) {

  // unsubscribe from all
  // WARNING:  Could simply subscribe to the new topic...
  unsubscribe_all();

  // Inserting into MySQL according to POST request
  // TODO: MAke the query better
  var sql = "INSERT INTO "+ misc.MySQL_table_name
  +" (type, position_x, position_y, command_topic, status_topic, payload_on, payload_off) VALUES ('"
  + req.body.type +"', '"
  + req.body.position_x + "', '"
  + req.body.position_y + "', '"
  + req.body.command_topic + "','"
  + req.body.status_topic + "','"
  + req.body.payload_on + "','"
  + req.body.payload_off + "');";


  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("New device added");

    // Get the new list of devices with subscribe embedded inside
    get_devices_from_MySQL_and_subscribe();

  });

  res.redirect('/manage_devices');

});


app.post('/delete_device',function(req, res) {

  unsubscribe_all();

  console.log("Deleting device ID no " + req.body.id);
  var sql = "DELETE FROM "+misc.MySQL_table_name+" WHERE id = '"+req.body.id+"'";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Number of records deleted: " + result.affectedRows);

    // Get the new list of devices with subscribe embedded inside
    get_devices_from_MySQL_and_subscribe();
  });

  res.redirect('/manage_devices');

});

// Start the server
var https_server = https.createServer(ssl_options,app)
https_server.listen(8080);
console.log('Server started');

// Start websocket
var io = require('socket.io')(https_server);


/*
Websockets
*/

io.sockets.on('connection', function (socket) {
  // Deals with Websocket connections

  console.log('A user connected, sending the devices info by ws');
  // This sends only to the connecting client
  socket.emit('update_devices', devices);


  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on("front_to_mqtt", function(JSON_message) {
    console.log("Message from front end");

    for(var id in JSON_message) {
      mqtt_client.publish(devices[id].command_topic, JSON_message[id].state);
    }

  });


  socket.on("add_devices_in_back_end", function(JSON_message) {
    console.log("Message from front end");

    //Find way to make a multiquery
    for(var id in JSON_message) {
      // Make a SQL query with the content of the JSON message
    }

  });


  socket.on("delete_devices_in_back_end", function(JSON_message) {
    console.log("Message from front end");

    //Find way to make a multiquery
    for(var id in JSON_message) {
      // Make a SQL query with the content of the JSON message
    }

  });



});


/*
MQTT
*/


mqtt_client.on('connect', function () {
  console.log("MQTT connected");
});


function update_MySQL_states(status_topic, state) {
  // Update the state of the device in the DB
  // WARNING: ASYNC

  var sql = "UPDATE "+misc.MySQL_table_name
  +" SET state = '"+ state
  +"' WHERE status_topic = '"+status_topic+"'";

  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Updated state of device in MySQL with status topic: " + status_topic);
  });
}

mqtt_client.on('message', function (status_topic, payload) {

  // KEEP A LOCAL COPY
  console.log("MQTT message arrived on " + status_topic + ": " + payload);

  // Find all devices with the matching status_topic
  JSON_message = {};
  for(var id in devices) {
    if(devices[id].status_topic == status_topic) {

      // Keep a local copy of the state
      devices[id].state =  payload.toString();

      // Create a JSON message to be sent
      JSON_message[id] = {};
      JSON_message[id].state = devices[id].state
    }
  }

  io.sockets.emit('update_devices',JSON_message);

});
