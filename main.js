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


function get_devices_from_MySQL_query_results(result){


  devices = {};

  for (var result_index = 0; result_index < result.length; result_index++){

    devices[result[result_index].id] = {};

    for(property in result[result_index]) {
      if(property != 'id'){
        devices[result[result_index].id][property] = result[result_index][property]
      }
    }
  }

  return devices;
}

// Configuration of MySQL
function get_devices_from_MySQL_and_subscribe (){
  // WHERE TO PUT THIS??
  console.log("get_devices_from_MySQL_and_subscribe");

  con.query("SELECT * FROM "+misc.MySQL_table_name, function (error, result, fields) {
    if (error) throw error;

    devices = get_devices_from_MySQL_query_results(result);

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

  console.log("MySQL Connected");

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

/////////////
// Routing //
/////////////

app.get('/', checkAuth, function(req, res) {
  res.render('index.ejs', {
    // Passingthe variables
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


// Start the server
var https_server = https.createServer(ssl_options,app)
https_server.listen(8080);

// Start websocket
var io = require('socket.io')(https_server);


////////////////
// Websockets //
////////////////

io.sockets.on('connection', function (socket) {
  // Deals with Websocket connections

  console.log('A user connected, sending the devices info by ws');

  // This sends only to the connecting client
  socket.emit('create_all_devices', devices);


  socket.on('disconnect', function(){
    console.log('user disconnected');
  });



  socket.on("add_devices_in_back_end", function(inbound_JSON_message) {
    console.log("add_devices_in_back_end");

    var outbound_JSON_message = {};


    for(var id in inbound_JSON_message) {

      /*
      var post  = {id: 1, title: 'Hello MySQL'};
      var query = connection.query('INSERT INTO posts SET ?', post, function (error, results, fields) {
        if (error) throw error;
        // Neat!
      });
      console.log(query.sql); // INSERT INTO posts SET `id` = 1, `title` = 'Hello MySQL'
      */

      var query = con.query('INSERT INTO ?? SET ?;', [misc.MySQL_table_name, inbound_JSON_message[id]], function (error, results, fields) {
        if (error) throw error;

        console.log(query.sql);


        // Add the device to the local array
        var new_device_id = results.insertId;
        devices[new_device_id] = inbound_JSON_message[id];


        // Send the new device to the front end for update
        outbound_JSON_message[new_device_id] = devices[new_device_id];
        io.emit('add_devices_in_front_end', outbound_JSON_message);

        // Subscribe MQTT
        mqtt_client.subscribe(devices[new_device_id].status_topic);
      });
    }

  });


  socket.on("delete_devices_in_back_end", function(inbound_JSON_message) {
    console.log("delete_devices_in_back_end");

    unsubscribe_all();

    ids = Object.keys(inbound_JSON_message);

    // Achieved using a multi query
    var query = con.query('DELETE FROM ?? WHERE id IN ( ? );', [misc.MySQL_table_name, ids], function (error, results, fields) {
      if (error) throw error;

      for(id in inbound_JSON_message){
        delete devices[id];
      }

      io.emit('delete_devices_in_front_end', inbound_JSON_message);
      subscribe_all();
    });
  });

  socket.on("edit_devices_in_back_end", function(inbound_JSON_message) {

    console.log("edit_devices_in_back_end");
    console.log(inbound_JSON_message);

    unsubscribe_all();

    for(var id in inbound_JSON_message) {

      // Update the database
      // TODO: all in one query
      // TODO: CHeck if the update was successful
      // IT SEEMS LIKE THE ID IS MISSING
      var query = con.query('UPDATE ?? SET ? WHERE id=?;', [misc.MySQL_table_name, inbound_JSON_message[id], id], function (error, results, fields) {
        if (error) throw error;
        console.log(query.sql);
      });

      // Update local variable
      for(var property in inbound_JSON_message[id]){
        devices[id][property] = inbound_JSON_message[id][property];
      }
    }

    // Simply fprward the message to everyone
    io.emit('edit_devices_in_front_end', inbound_JSON_message);

    // Subscribe to all new topics
    subscribe_all();
  });

  socket.on("front_to_mqtt", function(inbound_JSON_message) {

    console.log("front_to_mqtt");

    for(var id in inbound_JSON_message) {
      mqtt_client.publish(inbound_JSON_message[id].command_topic, inbound_JSON_message[id].state);
    }
  });
});


/*
MQTT
*/


mqtt_client.on('connect', function () {
  console.log("MQTT connected");
});


mqtt_client.on('message', function (status_topic, payload) {

  console.log("MQTT message arrived on " + status_topic + ": " + payload);


  // TODO: clean up

  // Translate the MQTT message into JSON message
  JSON_message = {};
  for(var id in devices) {
    if(devices[id].status_topic == status_topic) {
      JSON_message[id] = {};
      JSON_message[id].state = payload.toString();
    }
  }

  // Update the database
  for(var id in JSON_message) {

    var query = con.query('UPDATE ?? SET ? WHERE id=?;', [misc.MySQL_table_name, JSON_message[id], id], function (error, results, fields) {
      if (error) throw error;
      console.log(query.sql);

    });

    for(var property in JSON_message[id]){
      devices[id][property] = JSON_message[id][property];
    }
  }

  // Update the front end
  io.sockets.emit('edit_devices_in_front_end', JSON_message);

});
