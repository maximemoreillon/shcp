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


// Send to console if debugging
debugging = true;
function debug(message) {
  if(debugging) {
    console.log(message);
  }
}


// Array containign all the devices, populated by a MySQL DB
var devices = [];

// MQTT config
const mqtt_options = {
  username: credentials.mqtt_username,
  password: credentials.mqtt_password
};

var mqtt_client  = mqtt.connect('mqtt://192.168.1.2', mqtt_options);

function subscribe_all(){
  // Subscribe to all topics

  debug("Subscribing to " + devices.length + " topics");

  // Subscribe to MQTT topics
  for (var device_index = 0; device_index < devices.length; device_index++){
    var device = devices[device_index];
    debug("MQTT subscribing to: " + device.status_topic);
    mqtt_client.subscribe(device.status_topic);
  }
}

function unsubscribe_all(){
  // Subscribe to all topics

  debug("Subscribing to " + devices.length + " topics");

  // Subscribe to MQTT topics
  for (var device_index = 0; device_index < devices.length; device_index++){
    var device = devices[device_index];
    debug("MQTT subscribing to: " + device.status_topic);
    mqtt_client.unsubscribe(device.status_topic);
  }
}

// Configuration of MySQL
function get_devices_from_MySQL (){
  // WHERE TO PUT THIS??
  debug("Refreshing devices from MySQL");
  con.query("SELECT * FROM " + misc.MySQL_table_name, function (err, result, fields) {
    if (err) throw err;

    // Extract all results to local array
    devices = [];
    for (var device_index = 0; device_index < result.length; device_index++){
      // MIGHT NOT NEED TO TAKE ALL KEYS ONE BY ONE

      devices[device_index] = {}; // This erases everything about the array!

      devices[device_index].type = result[device_index].type;
      devices[device_index].position_x = result[device_index].position_x;
      devices[device_index].position_y = result[device_index].position_y;
      devices[device_index].command_topic = result[device_index].command_topic;
      devices[device_index].status_topic = result[device_index].status_topic;

      // Payload
      devices[device_index].payload_on = result[device_index].payload_on;
      devices[device_index].payload_off = result[device_index].payload_off;


      devices[device_index].id = result[device_index].id; // Necessary for delete buttons


      devices[device_index].state = "UNKNOWN";

      switch (result[device_index].type) {
        case "light":
          devices[device_index].image = "images/light.svg";
          break;
        case "lock":
          devices[device_index].image = "images/lock.svg";
          break;
        case "climate":
          devices[device_index].image = "images/ac.svg";
          break;
        default:
          devices[device_index].image = "images/question-mark.svg";
      }

      // The state element is used only for when a client connects and needs to receive all the states
      //devices[device_index].state = result[device_index].state;
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

  // Retreve devices from table and Subscribe
  // WARNING: MQTT might not be connected yet
  get_devices_from_MySQL();

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
    devices: devices
  });
});

app.get('/manage_devices', checkAuth, function(req, res) {
  res.render('manage_devices.ejs', {
    // Passing the variables
    devices: devices
  });
});

app.get('/show_table', checkAuth, function(req, res) {
  res.render('show_table.ejs', {
    // Passing the variables
    devices: devices
  });
});

app.post('/login', function (req, res) {
  var post = req.body;
  if (post.user === credentials.app_username && post.password === credentials.app_password) {
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

  unsubscribe_all();

  // Inserting into MySQL according to POST request
  var sql = "INSERT INTO "+ misc.MySQL_table_name
  +" (type, position_x, position_y, command_topic, status_topic, payload_on, payload_off) VALUES ('"
  + req.body.type +"', '"
  + req.body.position_x + "', '"
  + req.body.position_y + "', '"
  + req.body.command_topic + "','"
  + req.body.status_topic + "','"
  + req.body.payload_on + "','"
  + req.body.payload_off + "');";

  console.log(sql);


  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("New device added");

    // Get the new list of devices with subscribe
    get_devices_from_MySQL();

  });

  res.redirect('/manage_devices');

});


app.post('/delete_device',function(req, res) {

  unsubscribe_all();

  console.log("Deleting ID no " + req.body.id);
  var sql = "DELETE FROM "+misc.MySQL_table_name+" WHERE id = '"+req.body.id+"'";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Number of records deleted: " + result.affectedRows);

    // Get the new list of devices
    get_devices_from_MySQL();
  });



  res.redirect('/manage_devices');

});

// Start the server
var https_server = https.createServer(ssl_options,app)
https_server.listen(8080);
console.log('Server started');

// Start websocket
var io = require('socket.io')(https_server);


//
// WebSocket and MQTT
//
function set_all_devices_states_ws() {
  debug("Setting the state of all devices through Websocket");
  for (var device_index = 0; device_index < devices.length; device_index++){
    var device = devices[device_index];

    // Prepare data to be sent by WebSocket
    var data = {topic: device.status_topic, payload: device.state};

    // Sending to HTML
    io.sockets.emit('indicator',data);
  }
}


io.sockets.on('connection', function (socket) {
  // Deals with Websocket connections

  debug('A user connected');
  set_all_devices_states_ws();

  socket.on('disconnect', function(){
    debug('user disconnected');
  });

  socket.on("switch", function(data) {
    debug("Socket message: " + data.topic +": " + data.payload);

    /*
    TWO OPTIONS HERE:
    1) Make all devices respond to the "TOGGLE" payload
    2) Handle the toggling here, i.e. send the payload opposite to the current state
    /*
    Normally, devices should respond to the TOGGLE payload
    mqtt_client.publish(data.topic, data.payload);
    */

    // SHOULD BE REMOVED LATER
    for (var device_index = 0; device_index < devices.length; device_index++){
      var device = devices[device_index];
      if(device.command_topic == data.topic) {
        if(device.state == device.payload_on) {
          mqtt_client.publish(data.topic, device.payload_off);
        }
        else {
          mqtt_client.publish(data.topic, device.payload_on);
        }
      }
    }
  });
});


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

mqtt_client.on('message', function (topic, message) {
  // message is Buffer


  debug("MQTT message arrived on " + topic + ": " + message);

  // Update the state in the DB
  for (var device_index = 0; device_index < devices.length; device_index++){
    var device = devices[device_index];
    if(device.status_topic == topic) {

      state = message.toString();

      // Prepare data to be sent by WebSocket and send it through websocket
      console.log("Sending state by websocket: " + topic + ": " +state);
      var data = {topic: topic, payload: state};
      io.sockets.emit('indicator',data);

      // Keep a track of the states on the server
      devices[device_index].state = state;
    }
  }
});
