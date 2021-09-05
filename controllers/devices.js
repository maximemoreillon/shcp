const { ObjectID } = require('mongodb')
const { get_collection } = require('../db.js')
const { get_io } = require('../websockets.js')


const subscribe_if_possible = (device) => {
    if (!device.status_topic || device.status_topic === "") return

    // Not very nice
    console.log(`[MQTT] subscribing to ${device.status_topic}`)
    require('../mqtt.js')
      .get_mqtt_client()
      .subscribe(device.status_topic)
}


const unsubscribe_if_possible = async ({status_topic}) => {

  if (!status_topic) return

  const devices_with_same_topic = await get_collection()
      .find({status_topic})
      .toArray()

  if(devices_with_same_topic.length) return
  
  console.log(`[MQTT] Unsubscribing from ${status_topic}`)
  require('../mqtt.js').get_mqtt_client().unsubscribe(status_topic)

}

exports.read_all = async () => {

    const result =  await get_collection()
        .find({})
        .toArray()

    console.log(`[MongoDB] Queried all devices`)

    return result
}

exports.read = async (device_id) => {

    const query = { _id: ObjectID(device_id) }

    const result =  await get_collection()
        .findOne(query)

    console.log(`[MongoDB] Queried device ${device_id}`)

    return result
}

exports.create = async (device) => {
    const result =  await get_collection()
        .insertOne(device)

    const created_device = result.ops[0]
    get_io().sockets.emit('some_devices_added_or_updated', [created_device])

    // subscribe if possible
    subscribe_if_possible(created_device)

    console.log(`[MongoDB] Device ${created_device._id} created`)

    return created_device
}

exports.update = async (device_id, new_properties) => {

    const query = { _id: ObjectID(device_id) }
    const options = { returnOriginal: false }

    const result =  await get_collection()
        .findOneAndReplace(query, new_properties, options)

    const updated_device = result.value

    get_io().sockets.emit('some_devices_added_or_updated', [updated_device])

    // Technically, should unsubscribe from previous topic

    subscribe_if_possible(updated_device)

    console.log(`[MongoDB] Device ${updated_device._id} updated`)

    return result
}

exports.update_many = async ({query, action}) => {

    await get_collection()
        .updateMany(query, action)

    const updated_devices = await get_collection()
        .find(query)
        .toArray()

    get_io().sockets.emit('some_devices_added_or_updated', updated_devices)

    return updated_devices
}

exports.delete = async (device) => {

    const query = { _id: ObjectID(device._id) }


    const result = await get_collection()
        .deleteOne(query)

    get_io().sockets.emit('device_deleted', device)

    // unsub
    await unsubscribe_if_possible(device)

    console.log(`[MongoDB] Device ${device._id} deleted`)


    return result
}
