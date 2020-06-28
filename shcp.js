// Depenedencies
const bodyParser = require("body-parser")
const mqtt = require('mqtt')
const socketio = require('socket.io')
const MongoDB = require('mongodb')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const axios = require('axios')
const dotenv = require('dotenv')

dotenv.config()


const socketio_authentication_middleware = require('@moreillon/socketio_authentication_middleware')

const port = process.env.APP_PORT || 80


const db_config = {
  db_url : process.env.MONGODB_URL,
  db_name : "shcp",
  collection_name : "devices",
  options : {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
}


// MongoDB objects
const MongoClient = MongoDB.MongoClient
const ObjectID = MongoDB.ObjectID

// Create an instance of express app
const app = require('./express.js')
const http_server = require('./http_server.js')
const io = require('./socketio.js')

// Instanciate web server

// Instanciate Websockets

// Connect to MQTT
var mqtt_client  = mqtt.connect(
  process.env.MQTT_URL,
  {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD
  }
)




/////////////
// EXPRESS //
/////////////

app.use(bodyParser.json());
app.use(cors())
app.get('/',(req, res) => { res.send('SHCP API, Maxime MOREILLON')})
app.use('/floorplan', require('./express_routes/floorplan.js'))

////////////////
// Websockets //
////////////////
const authentication_function = require('./ws_auth.js')
const devices_controller = require('./ws_controllers/devices.js')

io.sockets.on('connection', (socket) => {
  // Deals with Websocket connections
  console.log('[WS] User connected');

  socket.use(socketio_authentication_middleware(socket, authentication_function))

  // Respond to WS messages
  socket.on('get_all_devices_from_back_end', devices_controller.get_all_devices_from_back_end)
  socket.on("add_one_device_in_back_end", devices_controller.add_one_device_in_back_end)
  socket.on("delete_one_device_in_back_end", devices_controller.delete_one_device_in_back_end)
  socket.on("edit_one_device_in_back_end", devices_controller.update_one_device_in_back_end)
  socket.on("front_to_mqtt", devices_controller.front_to_mqtt)

  socket.on('disconnect', () => { console.log('[WS] user disconnected') })

})


///////////
// MQTT //
//////////

function mqtt_subscribe_all() {
  console.log(`[MQTT] Subscribing to all topics`);
  // Subscribe to all topics
  MongoClient.connect(db_config.db_url, db_config.options, (err, db) => {
    if (err) return console.error(err)

    db.db(db_config.db_name)
    .collection(db_config.collection_name).find({})
    .toArray((err, result) => {
      db.close();
      if (err) return console.error(err)

      // Subscribe to all topics
      result.forEach((device) => {
        if(device.status_topic) {
          console.log(`[MQTT] Subscribing to ${device.status_topic}`)
          mqtt_client.subscribe(device.status_topic)
        }
      })
    })
  })
}

mqtt_client.on('connect', () => {
  // Callback when MQTT is connected
  console.log("[MQTT] connected");

  mqtt_subscribe_all();
})


mqtt_client.on('message', (status_topic, payload) => {
  // Callback for MQTT messages
  // Used to update the state of devices in the back and front end

  //console.log(payload.toString())


  MongoClient.connect(db_config.db_url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
    if (err) throw err;
    var dbo = db.db(db_config.db_name);

    var query = { status_topic: String(status_topic) };
    var action = { $set: {state: String(payload)} };

    // TODO: TRY USING FINDANDMOFIY

    // Update DB
    dbo.collection(db_config.collection_name).updateMany( query, action, (err, update_result) => {
      if (err) {
        db.close();
        return console.log("[DB] Error upating devices");
      }

      // Update front end
      dbo.collection(db_config.collection_name).find(query).toArray((err, find_result) =>{
        db.close();
        if (err) return console.log("[DB] Error getting devices");

        // This broadcast to all clients
        io.sockets.emit('add_or_update_some_in_front_end', find_result);
      })
    })
  })
})




// Run the server
http_server.listen(port, () => {
  console.log(`[Express] listening on port ${port}`);
});
