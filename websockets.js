const socketio = require("socket.io")

const socketio_authentication_middleware = require("@moreillon/socketio_authentication_middleware")
const authentication_function = require("./ws_auth.js")

let io

exports.init = (http_server) => {
  console.log("[WS] Initializing")
  io = socketio(http_server)
  io.sockets.on("connection", connection_callback)
}

const connection_callback = (socket) => {
  // Deals with Websocket connections
  console.log("[WS] User connected")

  // Auth using middleware
  socket.use(
    socketio_authentication_middleware(socket, authentication_function)
  )

  socket.on("disconnect", () => {
    console.log("[WS] user disconnected")
  })

  // // individual sockets
  socket.on("front_to_mqtt", front_to_mqtt)

  socket.on("disconnect", () => {
    console.log("[WS] user disconnected")
  })
}

const front_to_mqtt = ({ command_topic, payload }) => {
  // Convert WS messages into MQTT messages

  if (!command_topic || !payload) return

  console.log(`[WS to MQTT] Publishing to ${command_topic}`)

  const publish_options = { qos: 1, retain: true }

  require("./mqtt")
    .get_mqtt_client()
    .publish(command_topic, payload, publish_options)
}

exports.get_io = () => io
exports.io = io
