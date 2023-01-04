const { Router } = require("express")

const router = Router()

router.post("/", (req, res, next) => {
  const { topic, payload } = req.body

  console.log(`[WS to MQTT] Publishing to ${topic}`)

  const publish_options = { qos: 1, retain: true }

  require("../mqtt").get_mqtt_client().publish(topic, payload, publish_options)

  res.send("OK")
})

module.exports = router
