// Depenedencies
var fs = require('fs');
var express = require('express');
var expressSession = require('express-session')
var bodyParser = require("body-parser");
var http = require('http');

var mqtt = require('mqtt');

// Database
var MongoDB = require('mongodb');
var ObjectID = require('mongodb').ObjectID;
var MongoClient = require('mongodb').MongoClient;

// Custom modules
var credentials = require('./credentials');
var misc = require('./misc');

// Object containing all the devices, initially populated by a MySQL DB
var devices = {};

// MQTT config
const mqtt_options = {
  username: credentials.mqtt_username,
  password: credentials.mqtt_password
};

// Connect to MQTT
var mqtt_client  = mqtt.connect('mqtt://192.168.1.2', mqtt_options);

function subscribe_all(){
  // Subscribe to all topics

  console.log("Subscribing to all MQTT topics");

  for(var id in devices) {
    if(typeof devices[id].status_topic !== 'undefined'){
      if(devices[id].status_topic != ""){
        mqtt_client.subscribe(devices[id].status_topic);
      }
    }
  }
}

function unsubscribe_all(){
  // Subscribe to all topics

  console.log("Unsubscribing to all MQTT topics");
  for(var id in devices) {
    mqtt_client.unsubscribe(devices[id].status_topic);
  }
}

MongoClient.connect(misc.MongoDB_URL, function(err, db) {
  if (err) throw err;
  var dbo = db.db(misc.MongoDB_DB_name);
  dbo.collection(misc.MongoDB_collection_name).find({}).toArray(function(err, result) {
    if (err) throw err;

    // destroy all devices
    devices = {};

    // Local variable
    result.forEach(function(entry) {
      var id = entry['_id'];
      devices[id] = entry;
      delete devices[id]['_id']; // Not clean
    });

    // subscribe all
    subscribe_all();

    db.close();
  });
});


// Function to check if user is logged in (has a user ID session)
function checkAuth(req, res, next) {
  if (!req.session.user_id) {
    res.render('login.ejs');
  }
  else {
    next();
  }
}



////////////////////
// EXPRESS CONFIG //
////////////////////

const app = express();

app.set('views', __dirname + '/views');

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

app.use(express.static(__dirname + '/public'));

// Routing

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


// Start the web server
var http_server = http.createServer(app)
http_server.listen(8080);

// Start websocket
var io = require('socket.io')(http_server);


////////////////
// Websockets //
////////////////

io.sockets.on('connection', function (socket) {
  // Deals with Websocket connections

  // BUG: This can be executed before fetching all devices from the DB
  console.log('A user connected, sending the devices info by ws');

  // This sends only to the connecting client
  socket.emit('create_all_devices', devices);

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });



  socket.on("add_devices_in_back_end", function(inbound_JSON_message) {

    //NOTE: Could think of reading the complete DB again to make sure the devices are in sync

    console.log("add_devices_in_back_end");

    MongoClient.connect(misc.MongoDB_URL, function(err, db) {
      if (err) throw err;
      var dbo = db.db(misc.MongoDB_DB_name);

      var new_devices = [];
      for(id in inbound_JSON_message){
        new_devices.push(inbound_JSON_message[id]);
      }

      dbo.collection(misc.MongoDB_collection_name).insertMany(new_devices, function(err, result) {
        if (err) throw err;

        var outbound_JSON_message = {};

        // edit local variable
        result.ops.forEach(function(entry) {
          var id = entry['_id'];
          devices[id] = entry;
          delete devices[id]['_id']; // Not clean

          outbound_JSON_message[id] = devices[id];
        });

        // Send update to front End
        io.emit('add_devices_in_front_end', outbound_JSON_message);

        // subscribe to MQTT topics
        // TODO: Subscribe only to the new ones
        subscribe_all();


        db.close();
      });
    });

  });


  socket.on("delete_devices_in_back_end", function(inbound_JSON_message) {
    console.log("delete_devices_in_back_end");

    MongoClient.connect(misc.MongoDB_URL, function(err, db) {
      if (err) throw err;
      var dbo = db.db(misc.MongoDB_DB_name);

      var ids = [];
      Object.keys(inbound_JSON_message).forEach(function(entry) {
        ids.push(ObjectID(entry));
      });

      var query = { _id: { $in: ids } };

      dbo.collection(misc.MongoDB_collection_name).deleteMany( query , function(err, obj) {
        if (err) throw err;

        unsubscribe_all();

        // THIS SHOULD BE DONE BASED ON DB RESULT
        for(id in inbound_JSON_message){
          delete devices[id];
        }

        // Send update to clients
        io.emit('delete_devices_in_front_end', inbound_JSON_message);

        // Suscribe to all mqtt
        subscribe_all();

        db.close();
      });
    });

  });

  socket.on("edit_devices_in_back_end", function(inbound_JSON_message) {

    console.log("edit_devices_in_back_end");

    // TODO: find way to make all ine one query
    for(var id in inbound_JSON_message) {

      MongoClient.connect(misc.MongoDB_URL, function(err, db) {

        if (err) throw err;
        var dbo = db.db(misc.MongoDB_DB_name);

        var query = { _id: ObjectID(id) };

        var new_properties = {};
        new_properties['$set'] = inbound_JSON_message[id]


        dbo.collection(misc.MongoDB_collection_name).updateOne(query, new_properties, function(err, res) {
          if (err) throw err;

          unsubscribe_all();

          // update local variable
          for(property in inbound_JSON_message[id]) {
            devices[id][property] = inbound_JSON_message[id][property];
          }

          var outbound_JSON_message = {};
          outbound_JSON_message[id] = inbound_JSON_message[id];
          io.emit('edit_devices_in_front_end', outbound_JSON_message);

          subscribe_all();

          db.close();
        });
      });
    }
  });

  socket.on("front_to_mqtt", function(inbound_JSON_message) {

    console.log("front_to_mqtt");

    for(var id in inbound_JSON_message) {
      mqtt_client.publish(inbound_JSON_message[id].command_topic, inbound_JSON_message[id].state);
    }
  });



}); // end of socket on connect


///////////
// MQTT //
//////////

mqtt_client.on('connect', function () {
  console.log("MQTT connected");
});


mqtt_client.on('message', function (status_topic, payload) {

  console.log("MQTT message arrived on " + status_topic + ": " + payload);

  // Translate the MQTT message into JSON message
  var inbound_JSON_message = {};

  // Find the devices that have a matching MQTT status topic
  for(var id in devices) {
    if(devices[id].status_topic == status_topic) {
      inbound_JSON_message[id] = {};
      inbound_JSON_message[id].state = payload.toString();
    }
  }

  for(var id in inbound_JSON_message) {

    MongoClient.connect(misc.MongoDB_URL, function(err, db) {

      if (err) throw err;
      var dbo = db.db(misc.MongoDB_DB_name);

      var new_properties = {};
      new_properties['$set'] = inbound_JSON_message[id];

      var query = { _id: ObjectID(id) };

      dbo.collection(misc.MongoDB_collection_name).updateOne(query, new_properties, function(err, res) {
        if (err) throw err;

        // Update the local variable
        for(var property in inbound_JSON_message[id]){
          devices[id][property] = inbound_JSON_message[id][property];
        }

        // Update the front end
        var outbound_JSON_message = {};
        outbound_JSON_message[id] = inbound_JSON_message[id];
        io.sockets.emit('edit_devices_in_front_end', outbound_JSON_message);

        db.close();
      });
    });
  }
});
