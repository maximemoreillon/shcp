const mongodb = require('mongodb')
const dotenv = require('dotenv')
const io = require('../socketio.js')
const mqtt_client  = require('../mqtt.js')

dotenv.config()

const MongoClient = mongodb.MongoClient
const ObjectID = mongodb.ObjectID

const db_config = require('../db_config.js')


exports.get_all_devices = (socket) => {

  return () => {
    // This is weird, it should not emit to everyone

    console.log("[WS] get_all_devices_from_back_end")
    MongoClient.connect(db_config.db_url, db_config.options, (err, db) => {

      if (err) return console.log('[DB] Error connecting to the database')

      db.db(db_config.db_name)
      .collection(db_config.collection_name)
      .find({})
      .toArray((err, find_result) =>{
        db.close()
        if (err) return console.log("[DB] Error finding devices")

        // Emit only to the socket that requests the
        socket.emit('delete_and_create_all_in_front_end', find_result)
      })
    })
  }




}

exports.create_device = (device) => {

  console.log("[WS] Creating one device");

  MongoClient.connect(db_config.db_url, db_config.options, (err, db) => {
    if (err) return console.log('[DB] Error connecting to the database')

    // let the DB provide the ID
    delete device._id

    db.db(db_config.db_name)
    .collection(db_config.collection_name)
    .insertOne(device, (err, result) => {

      if (err) return console.error(err)

      db.close()

      console.log(`[DB] created device ${result.ops[0]._id}`)

      // NOTE: new device in resut.ops
      // result.ops is an array

      // Update front end
      io.emit('add_or_update_some_in_front_end', result.ops)

      // Even if only one device is added, result.ops is still an array
      result.ops.forEach((op) => {
        //Subscribe to all new topics if provided
        if('status_topic' in op && op.status_topic !== "") {
          console.log(`[MQTT] subscribing to ${op.status_topic}`)
          mqtt_client.subscribe(op.status_topic)
        }
      })

    })
  })
}

exports.delete_device = (device) => {
  console.log("[WS] Delete device")

  MongoClient.connect(db_config.db_url, db_config.options, (err, db) => {
    if (err) return console.log('[DB] Error connecting to the database')

    var query = { _id: ObjectID(device._id)}

    db.db(db_config.db_name)
    .collection(db_config.collection_name)
    .deleteOne( query , (err, result) => {

      if (err) return console.log("[DB] Error deleting device")

      console.log(`[DB] Device ${device._id} deleted`)

      // Update front end
      io.emit('delete_some_in_front_end', [device])

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

exports.update_device = (device) => {

  console.log("[WS] updating device");
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

      console.log(`[DB] device ${result.value._id} updated`)
      io.sockets.emit('add_or_update_some_in_front_end', [result.value])

      // Deal with MQTT subscriptions
      if(typeof result.value.status_topic !== 'undefined' && result.value.status_topic != "") {
        console.log(`[MQTT] subscribing to ${result.value.status_topic}`)
        mqtt_client.subscribe(result.value.status_topic)
      }
    })
  })
}

exports.front_to_mqtt = (message) => {
  // Convert WS messages into MQTT messages
  console.log("[WS] front_to_mqtt")

  if(!message.command_topic || !message.payload) return

  const publish_options = {
    qos: 1,
    retain: true,
  }

  mqtt_client.publish(message.command_topic, message.payload, publish_options)
}
