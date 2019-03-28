// Depenedencies
var path = require('path');
var express = require('express');
var expressSession = require('express-session')
var bodyParser = require("body-parser");
var http = require('http');
var mqtt = require('mqtt');
var socketio = require('socket.io');
var MongoDB = require('mongodb');
var httpProxy = require('http-proxy');

// Custom modules
var db_config = require ('./config/db_config');
var misc_config = require('./config/misc_config');
var credentials = require('./config/credentials');

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

// proxy for camera
var cameraProxy = httpProxy.createProxyServer({ ignorePath: true});

/////////////
// Helper functions
////////////

// Function to check if user is logged in (has a user ID session)
function checkAuth(req, res, next) {
  if (!req.session.user_id) {
    res.render('login.ejs');
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
app.get('/',checkAuth, function(req, res) {
  res.render('index.ejs');
});

app.get('/dump', function(req, res) {
  MongoClient.connect(db_config.db_url, { useNewUrlParser: true }, function(err, db) {
    if (err) throw err;
    var dbo = db.db(db_config.db_name);
    dbo.collection(db_config.collection_name).find({}).toArray(function(err, result) {
      if (err) throw err;
      res.render('dump.ejs', {devices: result});
      db.close();
    });
  });
});

app.get('/camera', checkAuthNoLogin, function(req, res) {

  if(typeof req.query._id !== 'undefined'){
    MongoClient.connect(db_config.db_url, { useNewUrlParser: true }, function(err, db) {
      if (err) throw err;
      var dbo = db.db(db_config.db_name);

      // TODO: check if exists
      var query = {_id: ObjectID(req.query._id)};

      dbo.collection(db_config.collection_name).findOne(query, function(err, result) {
        if (err) throw err;
        db.close();

        console.log("[Camera] Currently streaming " + result.stream_url);

        // Removing some headers because the camera doesn't support large headers
        delete req.headers.cookie;
        delete req.headers.via;
        delete req.headers.referer;

        cameraProxy.web(req, res, {target: result.stream_url});

      });
    });
  }
  else {
    res.sendStatus(404);
  }

});

app.get('/login', function(req, res) {
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
      io.sockets.emit('delete_and_create_all_in_front_end', find_result);
    });
  });

  socket.on('disconnect', function(){
    console.log('[WS] user disconnected');
  });

  // Respond to WS messages
  socket.on("add_one_device_in_back_end", function(device) {

    console.log("[WS] add_one_device_in_back_end");

    MongoClient.connect(db_config.db_url, { useNewUrlParser: true }, function(err, db) {
      if (err) throw err;
      var dbo = db.db(db_config.db_name);

      // we'll let the db provide the id
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
