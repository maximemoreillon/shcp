import mqtt, { MqttClient } from "mqtt"
import { update_many_devices } from "./controllers/devices"
import device from "./models/device"

const {
  MQTT_USERNAME,
  MQTT_PASSWORD,
  MQTT_URL = "mqtt://localhost",
} = process.env

export const connection_options = {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
}

export let client: MqttClient

export const init = () => {
  console.log("[MQTT] Initialization")
  client = mqtt.connect(MQTT_URL, connection_options)
  client.on("connect", connection_callback)
  client.on("message", message_callback)
}

const subscribe_all = async () => {
  console.log(`[MQTT] Subscribing to all topics`)

  const devices = await device.find({})

  devices
    .filter((device: any) => device.status_topic)
    .forEach(({ status_topic }: any) => {
      //console.log(`[MQTT] Subscribing to ${status_topic}`)
      client.subscribe(status_topic)
    })
}

const connection_callback = () => {
  // Callback when MQTT is connected
  console.log("[MQTT] connected")
  subscribe_all()
}

const message_callback = async (topic: string, payload: any) => {
  // Callback for MQTT messages
  // Used to update the state of devices in the back and front end

  const query = { status_topic: topic }
  const action = { $set: { state: String(payload) } }

  //console.log(`[MQTT] message on ${topic}: ${String(payload)}`)

  // Input not very nice
  await update_many_devices({ query, action })
}

export const broker_url = MQTT_URL
export const getMqttClient = () => client
