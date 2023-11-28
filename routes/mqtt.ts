import { Router } from "express"
import { get_mqtt_client } from "../mqtt"
const router = Router()

router.post("/", (req, res, next) => {
  const { topic, payload } = req.body

  console.log(`[MQTT] Publishing to ${topic}`)

  const publish_options: any = { qos: 1, retain: true }

  get_mqtt_client().publish(topic, payload, publish_options)

  res.send("OK")
})

export default router
