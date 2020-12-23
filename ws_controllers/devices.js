const mongodb = require('mongodb')
const dotenv = require('dotenv')
const io = require('../socketio.js')
const mqtt_client  = require('../mqtt.js')

dotenv.config()

const MongoClient = mongodb.MongoClient
const ObjectID = mongodb.ObjectID

const db_config = require('../db_config.js')


exports.get_all_devices = (socket) => {

  // Wrapping so as to get access to socket
  return () => {
    // This is weird, it should not emit to everyone

    MongoClient.connect(db_config.db_url, db_config.options, (err, db) => {

      if (err) return console.log('[DB] Error connecting to the database')

      db.db(db_config.db_name)
      .collection(db_config.collection_name)
      .find({})
      .toArray((err, find_result) =>{
        db.close()
        if (err) return console.log("[DB] Error finding devices")

        console.log(`[DB] device list queried`)

        // Emit only to the socket that requests the
        socket.emit('all_devices', find_result)
      })
    })
  }




}

exports.create_device = (device) => {

  MongoClient.connect(db_config.db_url, db_config.options, (err, db) => {
    if (err) return console.log('[DB] Error connecting to the database')

    // let the DB provide the ID
    delete device._id

    db.db(db_config.db_name)
    .collection(db_config.collection_name)
    .insertOne(device, (err, result) => {

      if (err) return console.error(err)

      db.close()

      const created_device = result.ops[0]

      console.log(`[DB] created device ${created_device._id}`)

      // NOTE: new device in resut.ops
      // result.ops is an array

      // Update front end
      // Sending as array of devices because some updates might affect multiple devices
      io.emit('some_devices_added_or_updated', [created_device])

      //Subscribe to all new topics if provided
      if('status_topic' in created_device && created_device.status_topic !== "") {
        console.log(`[MQTT] subscribing to ${created_device.status_topic}`)
        mqtt_client.subscribe(created_device.status_topic)
      }

    })
  })
}

exports.update_device = (device) => {

  MongoClient.connect(db_config.db_url, db_config.options, (err, db) => {
    if (err) return console.log('[DB] Error connecting to the database')

    let {_id, ...new_properties} = device

    // Look fore device by ID
    const query = { _id: ObjectID(_id) }

    const options = { returnOriginal: false }

    // Using replace to get rid of previous device propertiess
    db.db(db_config.db_name)
    .collection(db_config.collection_name)
    .findOneAndReplace(query, new_properties, options, (err, result) => {
      db.close();
      if (err) return console.log("[DB] Error editing device");

      db.close()

      const updated_device = result.value

      console.log(`[DB] device ${updated_device._id} updated`)

      // Sending as array of devices because some updates might affect multiple devices
      io.sockets.emit('some_devices_added_or_updated', [updated_device])

      // Deal with MQTT subscriptions
      if(typeof updated_device.status_topic !== 'undefined' && updated_device.status_topic != "") {
        console.log(`[MQTT] subscribing to ${updated_device.status_topic}`)
        mqtt_client.subscribe(updated_device.status_topic)
      }
    })
  })
}

exports.delete_device = (device) => {

  MongoClient.connect(db_config.db_url, db_config.options, (err, db) => {
    if (err) return console.log('[DB] Error connecting to the database')

    var query = { _id: ObjectID(device._id)}

    db.db(db_config.db_name)
    .collection(db_config.collection_name)
    .deleteOne( query , (err, result) => {

      if (err) return console.log("[DB] Error deleting device")

      console.log(`[DB] Device ${device._id} deleted`)

      // Update front end
      io.emit('device_deleted', device)

      // Unsubscribe from topic if needed
      if(!('status_topic' in device)) return db.close()

      console.log(`[MQTT] Unsubscribing from MQTT topics`)
      db.db(db_config.db_name)
      .collection(db_config.collection_name)
      .find({})
      .toArray((err, result) => {
        if (err) return console.error(err)
        db.close()

        let device_with_same_status_topic = result.find(e => e.status_topic === device.status_topic)
        if(!device_with_same_status_topic){
          console.log(`[MQTT] Unsubscribing from topic ${device.status_topic}`)
          mqtt_client.unsubscribe(device.status_topic)
        }
        else {
          console.log(`[MQTT] topic ${device.status_topic} is used by another device, keeping subscribtion`)
        }
      })


    })
  })
}



exports.front_to_mqtt = (message) => {
  // Convert WS messages into MQTT messages

  if(!message.command_topic || !message.payload) return

  console.log(`[WS to MQTT] Publishing to ${message.command_topic}`)

  const publish_options = {
    qos: 1,
    retain: true,
  }

  mqtt_client.publish(message.command_topic, message.payload, publish_options)
}
