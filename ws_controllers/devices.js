const mongodb = require('mongodb')
const dotenv = require('dotenv')

dotenv.config()

const MongoClient = mongodb.MongoClient

const db_config = {
  db_url : process.env.MONGODB_URL,
  db_name : "shcp",
  collection_name : "devices",
  options: { useNewUrlParser: true, useUnifiedTopology: true }
}

exports.get_all_devices_from_back_end = () => {
  console.log("[WS] get_all_devices_from_back_end")
  MongoClient.connect(db_config.db_url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
    if (err) throw err;
    db.db(db_config.db_name)
    .collection(db_config.collection_name)
    .find({}).toArray((err, find_result) =>{
      db.close();
      if (err) return console.log("[DB] Error finding devices");

      io.sockets.emit('delete_and_create_all_in_front_end', find_result);
    })
  })
}

exports.add_one_device_in_back_end = (device) => {

  console.log("[WS] add_one_device_in_back_end");

  MongoClient.connect(db_config.db_url, db_config.options, (err, db) => {
    if (err) return console.error(err)

    // let the DB provide the ID
    delete device._id;

    db.db(db_config.db_name)
    .collection(db_config.collection_name)
    .insertOne(device, (err, result) => {
      if (err) return console.error(err)
      db.close()

      // Update front end
      io.emit('add_or_update_some_in_front_end', result.ops)

      // Even if only one device is added, result.ops is still an array
      for(let op of result.ops){
        //Subscribe to all new topics if provided
        if('status_topic' in op) {
          if( op.status_topic != "") {
            console.log(`[MQTT] subscribing to ${op.status_topic}`)
            mqtt_client.subscribe(op.status_topic)
          }
        }
      }
    })
  })
}

exports.delete_one_device_in_back_end = (device) => {
  console.log("[WS] delete_one_device_in_back_end");

  MongoClient.connect(db_config.db_url, db_config.options, (err, db) => {
    if (err) return console.error(err)

    var query = { _id: ObjectID(device._id)}

    db.db(db_config.db_name)
    .collection(db_config.collection_name)
    .deleteOne( query , (err, result) => {

      if (err) return console.log("[DB] Error deleting device")

      // Update front end
      io.emit('delete_some_in_front_end', [device])

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
          // Need to do the actual unsubscribing here
        }
        else {
          console.log(`[MQTT] topic ${device.status_topic} is used by another device, keep subscribtion`)
        }
      })


    })
  })
}

exports.update_one_device_in_back_end = (device) => {

  console.log("[WS] edit_one_device_in_back_end");
  MongoClient.connect(db_config.db_url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
    if (err) throw err;


    // Look fore device by ID
    var query = { _id: ObjectID(device._id) };

    // Set the new device properties according to the WS payload
    var action = device;

    // No need to update the ID
    delete action._id;

    var options = { returnOriginal: false };

    // Using replace to get rid of previous device propertiess
    db.db(db_config.db_name)
    .collection(db_config.collection_name)
    .findOneAndReplace(query, action, options, (err, result) => {
      db.close();
      if (err) return console.log("[DB] Error editing device");

      db.close();
      io.sockets.emit('add_or_update_some_in_front_end', [result.value]);

      // Deal with MQTT subscriptions
      // SOMETHING FISHY HERE
      if(typeof result.value.status_topic !== 'undefined' && result.value.status_topic != "") {
        console.log(`[MQTT] subscribing to ${result.value.status_topic}`);
        mqtt_client.subscribe(result.value.status_topic);
      }
    })
  })
}

exports.front_to_mqtt = (message) => {
  // Convert WS messages into MQTT messages
  console.log("[WS] front_to_mqtt");
  if(message.command_topic && message.payload){
    mqtt_client.publish(message.command_topic, message.payload);
  }
}
