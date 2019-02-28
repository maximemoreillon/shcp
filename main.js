// Depenedencies
var path = require('path');
var express = require('express');
var expressSession = require('express-session')
var bodyParser = require("body-parser");
var http = require('http');
var mqtt = require('mqtt');
var socketio = require('socket.io');
var MongoDB = require('mongodb');

// Custom modules
var db_config = require ('./config/db_config');
var misc_config = require('./config/misc_config');
var credentials = require('./config/credentials');

// Object containing all the devices, initially populated by a MySQL DB

// MongoDB objects
var MongoClient = MongoDB.MongoClient;
var ObjectID = MongoDB.ObjectID;

// Create an instance of express app
var app = express();

// Instanciate web server
var http_server = http.Server(app);

// Instanciate Websockets
var io = socketio(http_server);

// Connect to MQTT
var mqtt_client  = mqtt.connect(
  'mqtt://192.168.1.2',
  {
    username: credentials.mqtt_username,
    password: credentials.mqtt_password
  }
);

/////////////
// Helper functions
////////////

function array_to_json(array){
  var out = {};
  for(index in array){
    var id = array[index]["_id"];
    out[id] = array[index];
    delete out[id]["_id"];
  }
  return out;
}

// Function to check if user is logged in (has a user ID session)
function checkAuth(req, res, next) {
  if (!req.session.user_id) {
    res.render('login.ejs');
  }
  else {
    next();
  }
}

function mqtt_subscribe_all() {
  // Subscribe to all topics
  MongoClient.connect(db_config.db_url, { useNewUrlParser: true }, function(err, db) {
    if (err) throw err;
    var dbo = db.db(db_config.db_name);
    dbo.collection(db_config.collection_name).find({}).toArray(function(err, result) {
      if (err) throw err;
      db.close();

      // Subscribe to all topics
      for(index in result) {
        if(typeof result[index].status_topic !== "undefined" && result[index].status_topic !== ""){
          console.log(`[MQTT] Subscribing to ${result[index].status_topic}`);
          mqtt_client.subscribe(result[index].status_topic);
        }
      }
    });
  });
}

///////////
// Init ///
///////////

mqtt_subscribe_all();



////////////////////
// EXPRESS CONFIG //
////////////////////

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressSession({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));


// Express routing

app.get('/', checkAuth, function(req, res) {
  res.render('index.ejs');
});

app.get('/dump', checkAuth, function(req, res) {
  MongoClient.connect(db_config.db_url, { useNewUrlParser: true }, function(err, db) {
    if (err) throw err;
    var dbo = db.db(db_config.db_name);
    dbo.collection(db_config.collection_name).find({}).toArray(function(err, result) {
      res.render('dump.ejs', {devices: result});
      db.close();
    });
  });
});

app.get('/login', checkAuth, function(req, res) {
  res.render('login.ejs');
});

app.post('/login', function (req, res) {
  var post = req.body;
  if (post.user === credentials.app_username && post.password === credentials.app_password) {
    // FOR NOW ONLY ONE USER
    req.session.user_id = 1;
    res.redirect('/');
  }
  else {
    // Improve this!
    res.render('login.ejs', {error: "Wrong username/password"} );
  }
});

app.get('/logout', function (req, res) {
  delete req.session.user_id;
  res.redirect('/');
});


// Run the server
http_server.listen(misc_config.app_port, function(){
  console.log(`[HTTP] listening on port ${misc_config.app_port}`);
});




////////////////
// Websockets //
////////////////

io.sockets.on('connection', function (socket) {
  // Deals with Websocket connections

  console.log('[WS] User connected, sending the devices info');

  // Fetch and send all devices to client
  MongoClient.connect(db_config.db_url, { useNewUrlParser: true }, function(err, db) {
    if (err) throw err;
    var dbo = db.db(db_config.db_name);
    dbo.collection(db_config.collection_name).find({}).toArray(function(err, find_result){
      if (err) throw err;
      db.close();
      io.sockets.emit('create_all_devices', array_to_json(find_result));
    });
  });

  socket.on('disconnect', function(){
    console.log('[WS] user disconnected');
  });

  // Respond to WS messages
  socket.on("add_devices_in_back_end", function(inbound_JSON_message) {

    //NOTE: Could think of reading the complete DB again to make sure the devices are in sync

    console.log("[WS] add_devices_in_back_end");

    MongoClient.connect(db_config.db_url, { useNewUrlParser: true }, function(err, db) {
      if (err) throw err;
      var dbo = db.db(db_config.db_name);

      var new_devices = [];
      for(id in inbound_JSON_message){
        new_devices.push(inbound_JSON_message[id]);
      }

      dbo.collection(db_config.collection_name).insertMany(new_devices, function(err, result) {
        if (err) throw err;
        db.close();

        // Update front end
        io.emit('add_devices_in_front_end', array_to_json(result.ops));

        //Subscribe to all new topics
        for(index in result.ops){
          if(typeof result.ops[index].status_topic !== 'undefined' && result.ops[index].status_topic != "") {
            console.log(`[MQTT] subscribing to ${result.ops[index].status_topic}`);
            mqtt_client.subscribe(result.ops[index].status_topic);
          }
        }
      });
    });
  });


  socket.on("delete_devices_in_back_end", function(inbound_JSON_message) {
    console.log("[WS] delete_devices_in_back_end");

    MongoClient.connect(db_config.db_url, { useNewUrlParser: true }, function(err, db) {
      if (err) throw err;
      var dbo = db.db(db_config.db_name);

      var ids = [];
      Object.keys(inbound_JSON_message).forEach(function(entry) {
        ids.push(ObjectID(entry));
      });

      var query = { _id: { $in: ids } };

      dbo.collection(db_config.collection_name).deleteMany( query , function(err, result) {
        if (err) throw err;
        db.close();

        // Update front end
        // TODO: Use result from DB to send info to clients
        io.emit('delete_devices_in_front_end', inbound_JSON_message);

        // TODO deal with MQTT subscribtions

      });
    });

  });

  socket.on("edit_devices_in_back_end", function(inbound_JSON_message) {

    console.log("[WS] edit_devices_in_back_end");

    // TODO: get rid of the for loop!!

    for(var id in inbound_JSON_message) {

      MongoClient.connect(db_config.db_url, { useNewUrlParser: true }, function(err, db) {
        if (err) throw err;
        var dbo = db.db(db_config.db_name);

        var query = { _id: ObjectID(id) };
        var action = {};
        action['$set'] = inbound_JSON_message[id]

        dbo.collection(db_config.collection_name).updateOne(query, action, function(err, res) {
          if (err) throw err;
          dbo.collection(db_config.collection_name).find(query).toArray(function(err, find_result){
            if (err) throw err;
            db.close();

            io.sockets.emit('edit_devices_in_front_end', find_result);

            // TO DO: Deal with MQTT subscribe
            for(index in find_result){
              if(typeof find_result[index].status_topic !== 'undefined' && find_result[index].status_topic != "") {
                console.log(`[MQTT] subscribing to ${find_result[index].status_topic}`);
                mqtt_client.subscribe(find_result[index].status_topic);
              }
            }
          });
        });
      });
    }
  });

  socket.on("front_to_mqtt", function(inbound_JSON_message) {
    // Convert WS messages into MQTT messages

    console.log("[WS] front_to_mqtt");

    for(var id in inbound_JSON_message) {
      mqtt_client.publish(inbound_JSON_message[id].command_topic, inbound_JSON_message[id].state);
    }
  });
}); // end of socket on connect


///////////
// MQTT //
//////////

mqtt_client.on('connect', function () {
  // Callback when MQTT is connected

  console.log("[MQTT] connected");
});


mqtt_client.on('message', function (status_topic, payload) {
  // Callback for MQTT messages

  console.log("[MQTT] message arrived on " + status_topic + ": " + payload);

  MongoClient.connect(db_config.db_url, { useNewUrlParser: true }, function(err, db) {
    if (err) throw err;
    var dbo = db.db(db_config.db_name);

    var query = { status_topic: String(status_topic) };
    var action = { $set: {state: String(payload)} };

    dbo.collection(db_config.collection_name).updateMany( query, action, function(err, update_result) {
      if (err) throw err;
      dbo.collection(db_config.collection_name).find(query).toArray(function(err, find_result){
        if (err) throw err;
        db.close();
        io.sockets.emit('edit_devices_in_front_end', array_to_json(find_result));
      });
    });
  });
});
