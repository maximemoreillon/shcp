const mqtt = require('mqtt')
const dotenv = require('dotenv')

dotenv.config()

module.exports = mqtt.connect(
  process.env.MQTT_URL,
  {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD
  }
)
