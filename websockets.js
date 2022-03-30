
const socketio = require('socket.io')

const devices_controller = require('./controllers/devices.js')

const socketio_authentication_middleware = require('@moreillon/socketio_authentication_middleware')
const authentication_function = require('./ws_auth.js')

let io

exports.init = (http_server) => {
    console.log('[WS] Initializing')
    io = socketio(http_server)
    io.sockets.on('connection', connection_callback)
}

const connection_callback = (socket) => {
    // Deals with Websocket connections
    console.log('[WS] User connected')

    // Auth using middleware
    socket.use(socketio_authentication_middleware(socket, authentication_function))

    socket.on('disconnect', () => { console.log('[WS] user disconnected') })

    // Respond to WS messages

    // Basic CRUD operations
    // Should ideally be done using HTTP and not WS
    // Updates are emitted to everyone
    socket.on("create_device", create_device)
    socket.on("delete_device", delete_device)
    socket.on("update_device", update_device)

    // // individual sockets
    socket.on('get_all_devices', get_all_devices(socket))
    socket.on("front_to_mqtt", front_to_mqtt)

    socket.on('disconnect', () => { console.log('[WS] user disconnected') })



}

const create_device = async (device) => {
  await devices_controller.create(device)
}

const update_device = async (device) => {
  const {_id, ...device_properties} = device
  await devices_controller.update(_id,device_properties)
}

const delete_device = async (device) => {
  await devices_controller.delete(device)
}

const get_all_devices = (socket) => {

    // Wrapping so as to get access to socket
    return () => {
        console.log(`[WS] sending all devices to socket ${socket.id}`)
        devices_controller
          .read_all()
          .then(devices => socket.emit('all_devices', devices))
    }

}


const front_to_mqtt = (message) => {
    // Convert WS messages into MQTT messages

    if (!message.command_topic || !message.payload) return

    console.log(`[WS to MQTT] Publishing to ${message.command_topic}`)

    const publish_options = { qos: 1, retain: true }

    require('./mqtt.js')
      .get_mqtt_client()
      .publish(message.command_topic, message.payload, publish_options)
}


exports.get_io = () => io
exports.io = io
