// Depenedencies
const db = require('./db.js')
const mqtt = require('./mqtt.js')
const websockets = require('./websockets.js')
const http_server = require('./http_server.js')
const express = require('./express.js')
const dotenv = require('dotenv')
const pjson = require('./package.json')
const authentication_function = require('./ws_auth.js')

dotenv.config()

const port = process.env.APP_PORT || 80

const init = async () => {
  console.log(`-- SHCP v${pjson.version} --`)

  const app = express.init()
  const server = http_server.init(app)
  websockets.init(server)
  await db.connect()
  mqtt.init()

}

init()