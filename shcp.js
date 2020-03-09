// Depenedencies
const path = require('path');
const express = require('express');
const history = require('connect-history-api-fallback');
const bodyParser = require("body-parser");
const http = require('http');
const mqtt = require('mqtt');
const socketio = require('socket.io');
const MongoDB = require('mongodb');
const httpProxy = require('http-proxy'); // For camera
const jwt = require('jsonwebtoken');
const cors = require('cors');
const formidable = require('formidable'); // Needed for foorplan upload
const fs = require('fs'); // Needed for upload and serving of floorplan
const socketio_authentication_middleware = require('@moreillon/socketio_authentication_middleware')


const PORT = 7070;
const secrets = require('./secrets');

const db_config = {
  db_url : secrets.mongodb_url,
  db_name : "shcp",
  collection_name : "devices",
}


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
var mqtt_client  = mqtt.connect( secrets.MQTT.broker_url, {
  username: secrets.MQTT.username,
  password: secrets.MQTT.password
});

// proxy for cameras
var cameraProxy = httpProxy.createProxyServer({ ignorePath: true});

/////////////
// EXPRESS //
/////////////

app.use(bodyParser.json());

app.use(history({
  // Ignore routes for connect-history-api-fallback
  rewrites: [
    { from: '/camera', to: '/camera'},
    { from: '/floorplan', to: '/floorplan'},
  ]
}));
app.use(express.static(path.join(__dirname, 'dist')));

app.use(cors())

app.get('/floorplan',(req, res) => {
  res.sendFile(path.join(__dirname, 'floorplan/floorplan'));
});

app.post('/floorplan_upload',  (req, res) => {

  // TODO: authenticate using JWT

  var form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    if (err) throw err;

    if('image' in files){
      var oldpath = files.image.path;
      var newpath = './floorplan/floorplan';
      fs.rename(oldpath, newpath, (err) => {
        if (err) throw err;
        res.send('OK')
      });
    }
    else {
      res.status(503).send('Image not found in files')
    }

  });
});

app.get('/camera', (req, res) => {
  // API to proxy camera stream to the front end

  console.log('[Express] Request for camera')

  // Check if the request contains enough information
  if(!req.query._id || !req.query.jwt) return res.sendStatus(400).send('Missing ID or JWT');

  // Verify token
  // TODO: Send token in authorization header
  jwt.verify(req.query.jwt, secrets.jwt_secret, (err, decoded) => {

    if(err) return res.sendStatus(401).send("Invalid JWT")

    if(decoded) {

      MongoClient.connect(db_config.db_url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
        if (err) return res.sendStatus(500).send("Error connecting to the DB")
        db.db(db_config.db_name)
        .collection(db_config.collection_name)
        .findOne({_id: ObjectID(req.query._id)}, (err, result) => {
          if (err) return res.sendStatus(500).send("Error getting camera from the DB")
          db.close();

          // If the DB query was successful, create proxy to camera
          if(!result.stream_url) return res.sendStatus(500).send("DB entry does not have ")

          console.log("[Camera] Currently streaming " + result.stream_url);

          // Removing some headers because some cameras (ESP-32 cam) don't support large headers
          delete req.headers.cookie;
          delete req.headers.via;
          delete req.headers.referer;

          cameraProxy.web(req, res, {target: result.stream_url}, (proxy_error) => {
            if(proxy_error) {
              return res.sendStatus(500).send("Error proxying camera")
              console.log(proxy_error)
            }
          });


        }); // End of findOne
      }); // End of MongoClient.connect
    }
  });




});





////////////////
// Websockets //
////////////////

function authentication_function(payload, callback){

  console.log("[Auth] authentication_function")

  if('jwt' in payload){
    console.log('user is trying to authenticate using JWT')
    jwt.verify(payload.jwt, secrets.jwt_secret, (err, decoded) => {
      // Just check if JWT can be decoded, i.e. secret is valid

      if(err) return callback(err, false)

      console.log("[Auth] JWT is valid")
      callback(err, {
        username: decoded.username,
      })


    });
  }

  else if('credentials' in payload){
    console.log('user is trying to authenticate using credentials')
    if(payload.credentials.username === secrets.app.username
      && payload.credentials.password === secrets.app.password ){
      console.log("[Auth] Credentials are valid")
      callback(false, {
        jwt: jwt.sign({
          username: secrets.app.username
        }, secrets.jwt_secret)
      })
    }
    else {
      console.log("[Auth] Credentials are not valid")
      callback(false, false)
    }
  }
}



io.sockets.on('connection', (socket) => {
  // Deals with Websocket connections
  console.log('[WS] User connected');

  socket.use(socketio_authentication_middleware(socket, authentication_function));

  socket.on('disconnect', () => {
    console.log('[WS] user disconnected');
  });

  socket.on('get_all_devices_from_back_end', () => {
    console.log("[WS] get_all_devices_from_back_end");
    MongoClient.connect(db_config.db_url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
      if (err) throw err;
      db.db(db_config.db_name)
      .collection(db_config.collection_name)
      .find({}).toArray((err, find_result) =>{
        if (err) throw err;
        db.close();
        io.sockets.emit('delete_and_create_all_in_front_end', find_result);
      });
    });
  })



  // Respond to WS messages
  socket.on("add_one_device_in_back_end", (device) => {

    console.log("[WS] add_one_device_in_back_end");

    MongoClient.connect(db_config.db_url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
      if (err) throw err;
      var dbo = db.db(db_config.db_name);

      // let the DB provide the ID
      delete device._id;

      dbo.collection(db_config.collection_name).insertOne(device, (err, result) => {
        if (err) throw err;
        db.close();

        // Update front end
        io.emit('add_or_update_some_in_front_end', result.ops);

        // Even if only one device is added, result.ops is still an array
        for(let op of result.ops){
          //Subscribe to all new topics if provided
          if('status_topic' in op) {
            if( op.status_topic != "") {
              console.log(`[MQTT] subscribing to ${op.status_topic}`);
              mqtt_client.subscribe(op.status_topic);
            }
          }
        }
      });
    });

  });


  socket.on("delete_one_device_in_back_end", (device) => {
    console.log("[WS] delete_one_device_in_back_end");

    MongoClient.connect(db_config.db_url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
      if (err) throw err;

      var query = { _id: ObjectID(device._id)};

      db.db(db_config.db_name)
      .collection(db_config.collection_name)
      .deleteOne( query , (err, result) => {
        if (err) throw err;

        // Update front end
        io.emit('delete_some_in_front_end', [device]);

        if('status_topic' in device){
          console.log(`[MQTT] Device had a subscribed topic, checking if unsubscribing necessary`)
          db.db(db_config.db_name)
          .collection(db_config.collection_name).find({})
          .toArray((err, result) => {
            if (err) throw err;
            db.close();

            let device_with_same_status_topic = result.find(e => e.status_topic === device.status_topic)
            if(!device_with_same_status_topic){
              console.log(`[MQTT] Unsubscribing from topic ${device.status_topic}`)
            }
            else {
              console.log(`[MQTT] topic ${device.status_topic} is used by another device, keep subscribtion`)
            }
          })
        }
        else {
          db.close();
        }

      });
    });

  });

  socket.on("edit_one_device_in_back_end", (device) => {

    console.log("[WS] edit_one_device_in_back_end");
    MongoClient.connect(db_config.db_url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
      if (err) throw err;


      // Look fore device by ID
      var query = { _id: ObjectID(device._id) };

      // Set the new device properties according to the WS payload
      var action = device;

      // No need to update the ID
      delete action._id;

      var options = { returnOriginal: false };

      // Using replace to get rid of previous device propertiess
      db.db(db_config.db_name)
      .collection(db_config.collection_name)
      .findOneAndReplace(query, action, options, (err, result) => {
        if (err) throw err;
        db.close();
        io.sockets.emit('add_or_update_some_in_front_end', [result.value]);

        // Deal with MQTT subscriptions
        // SOMETHING FISHY HERE
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

function mqtt_subscribe_all() {
  console.log(`[MQTT] Subscribing to all topics`);
  // Subscribe to all topics
  MongoClient.connect(db_config.db_url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
    if (err) throw err;
    db.db(db_config.db_name)
    .collection(db_config.collection_name).find({})
    .toArray((err, result) => {
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

mqtt_client.on('connect', () => {
  // Callback when MQTT is connected
  console.log("[MQTT] connected");
});


mqtt_client.on('message', (status_topic, payload) => {
  // Callback for MQTT messages
  // Used to update the state of devices in the back and front end

  //console.log("[MQTT] message arrived on " + status_topic + ": " + payload);

  MongoClient.connect(db_config.db_url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
    if (err) throw err;
    var dbo = db.db(db_config.db_name);

    var query = { status_topic: String(status_topic) };
    var action = { $set: {state: String(payload)} };

    // TODO: TRY USING FINDANDMOFIY

    // Update DB
    dbo.collection(db_config.collection_name).updateMany( query, action, (err, update_result) => {
      if (err) throw err;

      // Update front end
      dbo.collection(db_config.collection_name).find(query).toArray((err, find_result) =>{
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
http_server.listen(PORT, () => {
  console.log(`[Express] listening on port ${PORT}`);
});
