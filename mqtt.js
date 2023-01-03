const mqtt = require("mqtt")
const {
  read_all_devices,
  update_many_devices,
} = require("./controllers/devices.js")

const {
  MQTT_USERNAME,
  MQTT_PASSWORD,
  MQTT_URL = "mqtt:localhost",
} = process.env

const connection_options = {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
}

let client

const init = () => {
  console.log("[MQTT] Initialization")
  client = mqtt.connect(MQTT_URL, connection_options)
  client.on("connect", connection_callback)
  client.on("message", message_callback)
}

const subscribe_all = async () => {
  console.log(`[MQTT] Subscribing to all topics`)
  // Subscribe to all topics

  const devices = await read_all_devices()

  devices
    .filter((device) => device.status_topic)
    .forEach(({ status_topic }) => {
      //console.log(`[MQTT] Subscribing to ${status_topic}`)
      client.subscribe(status_topic)
    })
}

const connection_callback = () => {
  // Callback when MQTT is connected
  console.log("[MQTT] connected")
  subscribe_all()
}

const message_callback = async (topic, payload) => {
  // Callback for MQTT messages
  // Used to update the state of devices in the back and front end

  const query = { status_topic: topic }
  const action = { $set: { state: String(payload) } }

  //console.log(`[MQTT] message on ${topic}: ${String(payload)}`)

  // Input not very nice
  await update_many_devices({ query, action })
}

exports.broker_url = MQTT_URL
exports.connection_options = connection_options
exports.init = init
exports.get_mqtt_client = () => client
exports.client = client
