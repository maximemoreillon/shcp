// Depenedencies
const path = require('path');
const express = require('express');
const cookieSession = require('cookie-session')
const history = require('connect-history-api-fallback');
const bodyParser = require("body-parser");
const http = require('http');
const mqtt = require('mqtt');
const socketio = require('socket.io');
const MongoDB = require('mongodb');
const httpProxy = require('http-proxy'); // For camera

// Custom modules
const credentials = require('../common/credentials');
var db_config = require ('./config/db_config');
var misc_config = require('./config/misc_config');

// TODO: SUBMODULE THIS
var socketio_authentication = require('./submodules/socketio_authentication_middleware/socketio_authentication_middleware');

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
var mqtt_client  = mqtt.connect( 'mqtt://192.168.1.2', {
  username: credentials.mqtt_username,
  password: credentials.mqtt_password
});

// proxy for camera
var cameraProxy = httpProxy.createProxyServer({ ignorePath: true});

/////////////
// Helper functions
////////////

// Middleware to check if user is logged in (has a user ID session)
// TODO: Externalize this
function checkAuth(req, res, next) {
  next();

  if (!req.session.user_id) {
    res.redirect('/login');
  }
  else {
    next();
  }
}

function checkAuthNoLogin(req, res, next) {
  if (!req.session.user_id) {
    res.sendStatus(401);
  }
  else {
    next();
  }
}

function mqtt_subscribe_all() {

  console.log(`[MQTT] Subscribing to all topics`);
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


/////////////
// EXPRESS //
/////////////

app.use(bodyParser.json());
app.use(history());
app.use(express.static(path.join(__dirname, 'dist')));


app.get('/camera', checkAuthNoLogin, function(req, res) {

  // API to proxy camera stream to the front end
  if(typeof req.query._id !== 'undefined'){


    MongoClient.connect(db_config.db_url, { useNewUrlParser: true }, function(err, db) {
      if (err) throw err;
      var dbo = db.db(db_config.db_name);

      var query = {_id: ObjectID(req.query._id)};

      dbo.collection(db_config.collection_name).findOne(query, function(err, result) {
        if (err) throw err;
        db.close();

        console.log(result.stream_url)
        // If the DB query was successful, create proxy to camera
        if(typeof result.stream_url !== 'undefined'){

          console.log("[Camera] Currently streaming " + result.stream_url);

          // Removing some headers because some cameras (ESP-32 cam) don't support large headers
          delete req.headers.cookie;
          delete req.headers.via;
          delete req.headers.referer;

          cameraProxy.web(req, res, {target: result.stream_url}, function(proxy_error) {
            if(proxy_error) console.log(proxy_error)
          });

        }
        else {
          console.log("[Camera] Camera not found in DB");
        }

      });
    });
  }
  else {
    res.sendStatus(404);
  }

});





////////////////
// Websockets //
////////////////
io.sockets.on('connection', function (socket) {
  // Deals with Websocket connections
  console.log('[WS] User connected');

  //socket.use(socketio_authentication.socketio_middleware(socket))

  socket.on('disconnect', function(){
    console.log('[WS] user disconnected');
  });

  socket.on('get_all_devices_from_back_end', function(){
    console.log("[WS] get_all_devices_from_back_end");
    MongoClient.connect(db_config.db_url, { useNewUrlParser: true }, function(err, db) {
      if (err) throw err;
      var dbo = db.db(db_config.db_name);
      dbo.collection(db_config.collection_name).find({}).toArray(function(err, find_result){
        if (err) throw err;
        db.close();
        io.sockets.emit('delete_and_create_all_in_front_end', find_result);
      });
    });
  })



  // Respond to WS messages
  socket.on("add_one_device_in_back_end", function(device) {


    console.log("[WS] add_one_device_in_back_end");

    console.log(device)

    MongoClient.connect(db_config.db_url, { useNewUrlParser: true }, function(err, db) {
      if (err) throw err;
      var dbo = db.db(db_config.db_name);

      // let the DB provide the ID
      delete device._id;

      dbo.collection(db_config.collection_name).insertOne(device, function(err, result) {
        if (err) throw err;
        db.close();

        // Update front end
        io.emit('add_or_update_some_in_front_end', result.ops);

        // Even if only one device is added, result.ops is still an array
        for(index in result.ops){
          //Subscribe to all new topics if provided
          if(typeof result.ops[index].status_topic !== 'undefined' && result.ops[index].status_topic != "") {
            console.log(`[MQTT] subscribing to ${result.ops[index].status_topic}`);
            mqtt_client.subscribe(result.ops[index].status_topic);
          }
        }
      });
    });

  });


  socket.on("delete_one_device_in_back_end", function(device) {
    console.log("[WS] delete_one_device_in_back_end");

    MongoClient.connect(db_config.db_url, { useNewUrlParser: true }, function(err, db) {
      if (err) throw err;
      var dbo = db.db(db_config.db_name);

      var query = { _id: ObjectID(device._id)};

      dbo.collection(db_config.collection_name).deleteOne( query , function(err, result) {
        if (err) throw err;
        db.close();

        // Update front end
        io.emit('delete_some_in_front_end', [device]);

        // TODO deal with MQTT subscribtions

      });
    });


  });

  socket.on("edit_one_device_in_back_end", function(device) {

    console.log("[WS] edit_one_device_in_back_end");
    MongoClient.connect(db_config.db_url, { useNewUrlParser: true }, function(err, db) {
      if (err) throw err;
      var dbo = db.db(db_config.db_name);

      // Look fore device by ID
      var query = { _id: ObjectID(device._id) };

      // Set the new device properties according to the WS payload
      var action = device;

      // No need to update the ID
      delete action._id;

      var options = { returnOriginal: false };

      // Using replace to get rid of previous device propertiess
      dbo.collection(db_config.collection_name).findOneAndReplace(query, action, options, function(err, result) {
        if (err) throw err;
        db.close();
        io.sockets.emit('add_or_update_some_in_front_end', [result.value]);

        // Deal with MQTT subscriptions
        if(typeof result.value.status_topic !== 'undefined' && result.value.status_topic != "") {
          console.log(`[MQTT] subscribing to ${result.value.status_topic}`);
          mqtt_client.subscribe(result.value.status_topic);
        }
      });
    });
  });

  socket.on("front_to_mqtt", function(message) {
    // Convert WS messages into MQTT messages
    console.log("[WS] front_to_mqtt");
    if(message.command_topic && message.payload){
      mqtt_client.publish(message.command_topic, message.payload);
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

        // This broadcast to all clients
        io.sockets.emit('add_or_update_some_in_front_end', find_result);
      });
    });
  });
});




///////////
// START //
///////////

mqtt_subscribe_all();

// Run the server
http_server.listen(misc_config.app_port, function(){
  console.log(`[HTTP] listening on port ${misc_config.app_port}`);
});
