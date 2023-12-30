import { Router } from "express"
import { getMqttClient } from "../mqtt"

const router = Router()

router.post("/", (req, res) => {
  const { topic, payload } = req.body
  const publish_options: any = { qos: 1, retain: true }
  getMqttClient().publish(topic, payload, publish_options)
  res.send({
    topic,
    payload,
  })
})

export default router
