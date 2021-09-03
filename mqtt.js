const mqtt = require('mqtt')
const devices_controller = require('./controllers/devices.js')

const connection_options = {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD
}

const broker_url = process.env.MQTT_URL || 'mqtt:localhost'

let client

const init = () => {
  mqtt_client = mqtt.connect(broker_url, connection_options)
  mqtt_client.on('connect', connection_callback)
  mqtt_client.on('message', message_callback)
}


const subscribe_all = async () => {
  console.log(`[MQTT] Subscribing to all topics`)
  // Subscribe to all topics

  const devices = await devices_controller.read_all()

  devices
  .filter(device => device.status_topic)
  .forEach(({status_topic}) => {
    //console.log(`[MQTT] Subscribing to ${status_topic}`)
    mqtt_client.subscribe(status_topic)
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
  await devices_controller.update_many({ query, action })

}



exports.broker_url = broker_url
exports.connection_options = connection_options
exports.init = init
exports.get_mqtt_client = () => client
exports.client = client