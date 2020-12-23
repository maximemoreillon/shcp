// Depenedencies
const bodyParser = require("body-parser")
const socketio = require('socket.io')
const cors = require('cors')
const axios = require('axios')
const dotenv = require('dotenv')
const pjson = require('./package.json')
const socketio_authentication_middleware = require('@moreillon/socketio_authentication_middleware')

dotenv.config()

console.log(` -- SHCP v${pjson.version} started --`)


const port = process.env.APP_PORT || 80


// Create an instance of express app
const app = require('./express.js')
const http_server = require('./http_server.js')
const io = require('./socketio.js')
const mqtt_client  = require('./mqtt.js')


const authentication_function = require('./ws_auth.js')
const devices_controller = require('./ws_controllers/devices.js')
const mqtt_controller =  require('./mqtt_controllers/mqtt_controller.js')


///////////
// MQTT //
//////////

mqtt_client.on('connect', mqtt_controller.connection_callback)
mqtt_client.on('message', mqtt_controller.message_callback)


/////////////
// EXPRESS //
/////////////

app.use(bodyParser.json())
app.use(cors())


app.get('/',(req, res) => {
  res.send('SHCP API')
})

app.get('/info',(req, res) => {
  res.send({
    application_name: 'SHCP',
    author: 'Maxime MOREILLON',
    version: pjson.version,
    mqtt_broker_url: process.env.MQTT_URL,
    mongodb_url: process.env.MONGODB_URL || 'undefined',

  })
})

app.use('/floorplan', require('./express_routes/floorplan.js'))



////////////////
// Websockets //
////////////////

io.sockets.on('connection', (socket) => {
  // Deals with Websocket connections
  console.log('[WS] User connected')

  socket.use(socketio_authentication_middleware(socket, authentication_function))

  // Respond to WS messages

  // Basic CUD operations
  // Updates are emitted to everyone
  socket.on("add_one_device_in_back_end", devices_controller.create_device)
  socket.on("delete_one_device_in_back_end", devices_controller.delete_device)
  socket.on("edit_one_device_in_back_end", devices_controller.update_device)

  // individual sockets
  socket.on('get_all_devices_from_back_end', devices_controller.get_all_devices(socket))
  socket.on("front_to_mqtt", devices_controller.front_to_mqtt)

  socket.on('disconnect', () => { console.log('[WS] user disconnected') })

})




// Run the server
http_server.listen(port, () => { console.log(`[Express] listening on port ${port}`) })
