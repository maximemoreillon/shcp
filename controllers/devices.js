const { ObjectID } = require("mongodb")
const { get_collection } = require("../db.js")
const { get_io } = require("../websockets.js")
const createHttpError = require("http-errors")

const subscribe_to_device_topic = ({ status_topic }) => {
  if (!status_topic) return

  console.log(`[MQTT] subscribing to ${status_topic}`)
  // Not very nice
  require("../mqtt.js").get_mqtt_client().subscribe(status_topic)
}

const unsubscribe_from_device_topic = async ({ status_topic }) => {
  if (!status_topic) return

  const devices_with_same_topic = await get_collection()
    .find({ status_topic })
    .toArray()

  if (devices_with_same_topic.length) return

  console.log(`[MQTT] Unsubscribing from ${status_topic}`)
  require("../mqtt.js").get_mqtt_client().unsubscribe(status_topic)
}

exports.create_device = async (req, res, next) => {
  try {
    const device = req.body
    const result = await get_collection().insertOne(device)

    const created_device = result.ops[0]
    get_io().sockets.emit("some_devices_added_or_updated", [created_device])

    subscribe_to_device_topic(created_device)

    console.log(`[MongoDB] Device ${created_device._id} created`)

    res.send(created_device)
  } catch (error) {
    next(error)
  }
}

exports.read_all_devices = async (req, res, next) => {
  try {
    const devices = await get_collection().find({}).toArray()
    res.send(devices)
  } catch (error) {
    next(error)
  }
}

exports.read_device = async (req, res, next) => {
  const { _id } = req.params

  const query = { _id: ObjectID(_id) }

  try {
    const device = await get_collection().findOne(query)

    console.log(`[MongoDB] Queried device ${_id}`)

    res.send(device)
  } catch (error) {
    next(error)
  }
}

exports.update_device = async (req, res, next) => {
  console.log("Attempting to update device")
  const { _id } = req.params
  const new_properties = req.body

  const query = { _id: ObjectID(_id) }
  const options = { returnOriginal: false }

  try {
    const result = await get_collection().findOneAndReplace(
      query,
      new_properties,
      options
    )

    const updated_device = result.value

    get_io().sockets.emit("some_devices_added_or_updated", [updated_device])

    // TODO: unsubscribe from previous topic and subscribe to new one, if any
    subscribe_to_device_topic(updated_device)

    console.log(`[MongoDB] Device ${updated_device._id} updated`)

    res.send(updated_device)
  } catch (error) {
    next(error)
  }
}

exports.update_many_devices = async ({ query, action }) => {
  await get_collection().updateMany(query, action)

  const updated_devices = await get_collection().find(query).toArray()

  // Technically, should subscribe to new topics

  get_io().sockets.emit("some_devices_added_or_updated", updated_devices)

  return updated_devices
}

exports.delete_device = async (req, res, next) => {
  const { _id } = req.params

  const query = { _id: ObjectID(_id) }

  try {
    const { value: device } = await get_collection().findOneAndDelete(query)
    if (!device) throw createHttpError(404, `Device ${_id} not found`)

    await unsubscribe_from_device_topic(device)
    get_io().sockets.emit("device_deleted", device)
    console.log(`[MongoDB] Device ${_id} deleted`)

    res.send(device)
  } catch (error) {
    next(error)
  }
}
