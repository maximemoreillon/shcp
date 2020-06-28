const socketio = require('socket.io')
const http_server= require('./http_server.js')

module.exports = socketio(http_server)
