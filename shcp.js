// Depenedencies
const bodyParser = require("body-parser")
const socketio = require('socket.io')
const MongoDB = require('mongodb')
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
const mqtt_client  = require('./mqtt.js')




/////////////
// EXPRESS //
/////////////

app.use(bodyParser.json())
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

const mqtt_controller =  require('./mqtt_controllers/mqtt_controller.js')
mqtt_client.on('connect', mqtt_controller.connection_callback)
mqtt_client.on('message',mqtt_controller.message_callback)




// Run the server
http_server.listen(port, () => {
  console.log(`[Express] listening on port ${port}`);
});
