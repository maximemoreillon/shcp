// Depenedencies
var fs = require('fs');
var express = require('express');
var expressSession = require('express-session')
var bodyParser = require("body-parser");
var mqtt = require('mqtt');
var https = require('https');
var MongoDB = require('mongodb');
var ObjectID = require('mongodb').ObjectID;
var MongoClient = require('mongodb').MongoClient;



// Custom modules
var credentials = require('./credentials');
var misc = require('./misc');
var routing = require("./routing");

// Array containing all the devices, initially populated by a MySQL DB
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
    mqtt_client.subscribe(devices[id].status_topic);
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

    console.log("MongoDB query result:");

    result.forEach(function(entry) {
      var id = entry['_id'];
      devices[id] = entry;
      delete devices[id]['_id']; // Not clean

    });

    // TODO: Update local variables
    console.log(devices);

    // subscribe all
    subscribe_all();

    db.close();
  });
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
        console.log("Number of documents inserted: " + result.insertedCount);

        // edit local variable
        result.ops.forEach(function(entry) {
          var id = entry['_id'];
          devices[id] = entry;
          delete devices[id]['_id']; // Not clean
        });

        console.log(devices);

        // Send update to front End
        // TODO: Send only the new devices
        io.emit('add_devices_in_front_end', devices);

        // subscribe to devices
        // TODO: only subscribe to new ones
        subscribe_all();

        db.close();
      });
    });


    // Old MySQL code
    /*
    for(var id in inbound_JSON_message) {

      var outbound_JSON_message = {};

      var query = MySQL_connection.query('INSERT INTO ?? SET ?;', [misc.MySQL_table_name, inbound_JSON_message[id]], function (error, results, fields) {
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
    */

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
        console.log(obj.result.n + " document(s) deleted");

        unsubscribe_all();

        // Update local variable
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


    // Old MySQL code
    /*
    // Achieved using a multi query
    var query = MySQL_connection.query('DELETE FROM ?? WHERE id IN ( ? );', [misc.MySQL_table_name, ids], function (error, results, fields) {
      if (error) throw error;

      // Update local variable
      for(id in inbound_JSON_message){
        delete devices[id];
      }

      // Update front end
      io.emit('delete_devices_in_front_end', inbound_JSON_message);
      subscribe_all();
    });
    */
  });

  socket.on("edit_devices_in_back_end", function(inbound_JSON_message) {

    console.log("edit_devices_in_back_end");
    console.log(inbound_JSON_message);

    // Unsubscribe to all MQTT topics
    unsubscribe_all();

    // Old MySQL code
    /*
    // Update the database
    // TODO: all in one query
    for(var id in inbound_JSON_message) {

      var query = MySQL_connection.query('UPDATE ?? SET ? WHERE id=?;', [misc.MySQL_table_name, inbound_JSON_message[id], id], function (error, results, fields) {
        if (error) throw error;
        console.log(query.sql);

        // Update local variable
        for(var property in inbound_JSON_message[id]){
          devices[id][property] = inbound_JSON_message[id][property];
        }

        // Update all clients with the info
        var outbound_JSON_message = {};
        outbound_JSON_message[id] = inbound_JSON_message[id];
        io.emit('edit_devices_in_front_end', outbound_JSON_message);
      });
    }
    */

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

  // Translate the MQTT message into JSON message
  inbound_JSON_message = {};

  // Find the devices that have a matching MQTT status topic
  for(var id in devices) {
    if(devices[id].status_topic == status_topic) {
      inbound_JSON_message[id] = {};
      inbound_JSON_message[id].state = payload.toString();
    }
  }


  // Old MySQL code
  /*
  // Update the database
  for(var id in inbound_JSON_message) {

    var query = MySQL_connection.query('UPDATE ?? SET ? WHERE id=?;', [misc.MySQL_table_name, inbound_JSON_message[id], id], function (error, results, fields) {
      if (error) throw error;
      console.log(query.sql);

      // Update the local variable
      for(var property in inbound_JSON_message[id]){
        devices[id][property] = inbound_JSON_message[id][property];
      }

      // Update the front end
      var outbound_JSON_message = {};
      outbound_JSON_message[id] = inbound_JSON_message[id];
      io.sockets.emit('edit_devices_in_front_end', outbound_JSON_message);

    });
  }

  */

    // Version without database update
    /*
    for(var id in inbound_JSON_message) {

      // Update the local variable
      for(var property in inbound_JSON_message[id]){
        devices[id][property] = inbound_JSON_message[id][property];
      }

      // Update the front end
      var outbound_JSON_message = {};
      outbound_JSON_message[id] = inbound_JSON_message[id];
      io.sockets.emit('edit_devices_in_front_end', outbound_JSON_message);

    }
    */
});
