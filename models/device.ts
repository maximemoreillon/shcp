import { Schema, model } from "mongoose"

const schema = new Schema({
  type: String,
  position: {
    x: Number,
    y: Number,
  },
  command_topic: String,
  status_topic: String,
  payload_on: String,
  payload_off: String,
  state: String,

  // For sensors
  json_key: String,
  unit: String,
  measurement_name: String,
})

export default model("device", schema)
