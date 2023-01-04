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

  socket.on("disconnect", () => {
    console.log("[WS] user disconnected")
  })
}

exports.get_io = () => io
exports.io = io
