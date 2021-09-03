const { ObjectID } = require('mongodb')
const { get_collection } = require('../db.js')
const { get_io } = require('../websockets.js')


const subscribe_if_possible = (device) => {
    if ('status_topic' in device && device.status_topic !== "") {
        console.log(`[MQTT] subscribing to ${device.status_topic}`)
        // Not very nice
        require('../mqtt.js').client.subscribe(device.status_topic)
    }
}


const unsubscribe_if_possible = async (device) => {

    const all_devices = await get_collection()
        .find({})
        .toArray()

    const device_with_same_status_topic = all_devices.find(e => e.status_topic === device.status_topic)
    if (!device_with_same_status_topic) {
        console.log(`[MQTT] Unsubscribing from topic ${device.status_topic}`)
        // Not very nice
        require('../mqtt.js').client.unsubscribe(device.status_topic)
    }
    else {
        console.log(`[MQTT] topic ${device.status_topic} is used by another device, keeping subscribtion`)
    }
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

    return created_device
}

exports.update = async (device_id, new_properties) => {

    const query = { _id: ObjectID(device_id) }
    const options = { returnOriginal: false }
    const result =  await get_collection()
        .findOneAndReplace(query, new_properties, options)
    
    const updated_device = result.value
    
    get_io().sockets.emit('some_devices_added_or_updated', [updated_device])

    subscribe_if_possible(updated_device)

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

    get_io.sockets.emit('device_deleted', device)

    // unsub
    await unsubscribe_if_possible(device)
    
    
    return result
}