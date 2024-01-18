import { ObjectId } from "mongodb"
import { get_io } from "../websockets"
import { Request, Response } from "express"
import createHttpError from "http-errors"
import Device from "../models/device"
import { getMqttClient } from "../mqtt"
const subscribe_to_device_topic = ({ status_topic }: any) => {
  if (!status_topic) return

  console.log(`[MQTT] subscribing to ${status_topic}`)
  // Not very nice
  getMqttClient().subscribe(status_topic)
}

const unsubscribe_from_device_topic = async ({ status_topic }: any) => {
  if (!status_topic) return

  const devices_with_same_topic = await Device.find({ status_topic })

  if (devices_with_same_topic.length) return

  console.log(`[MQTT] Unsubscribing from ${status_topic}`)
  getMqttClient().unsubscribe(status_topic)
}

export const create_device = async (req: Request, res: Response) => {
  const device = req.body
  const newDevice = await Device.create(device)

  get_io().sockets.emit("some_devices_added_or_updated", [newDevice])

  subscribe_to_device_topic(newDevice)

  console.log(`[MongoDB] Device ${newDevice._id} created`)

  res.send(newDevice)
}

export const read_all_devices = async (req: Request, res: Response) => {
  const devices = await Device.find({})
  res.send(devices)
}

export const read_device = async (req: Request, res: Response) => {
  const { _id } = req.params

  const query = { _id: new ObjectId(_id) }

  const device = await Device.findOne(query)

  console.log(`[MongoDB] Queried device ${_id}`)

  res.send(device)
}

export const update_device = async (req: Request, res: Response) => {
  const { _id } = req.params
  const new_properties: any = req.body

  const query = { _id }
  const options = { returnOriginal: false }

  const updatedDevice = await Device.findOneAndReplace(
    query,
    new_properties,
    options
  )

  if (!updatedDevice) throw createHttpError(404, `Device ${_id} not found`)

  get_io().sockets.emit("some_devices_added_or_updated", [updatedDevice])

  // TODO: unsubscribe from previous topic and subscribe to new one, if any
  subscribe_to_device_topic(updatedDevice)

  console.log(`[MongoDB] Device ${updatedDevice._id} updated`)

  res.send(updatedDevice)
}

export const update_many_devices = async ({ query, action }: any) => {
  await Device.updateMany(query, action)

  const updated_devices = await Device.find(query)

  // Technically, should subscribe to new topics

  get_io().sockets.emit("some_devices_added_or_updated", updated_devices)

  return updated_devices
}

export const delete_device = async (req: Request, res: Response) => {
  const { _id } = req.params

  const query = { _id }

  const device = await Device.findOneAndDelete(query)

  if (!device) throw createHttpError(404, `Device ${_id} not found`)

  await unsubscribe_from_device_topic(device)
  get_io().sockets.emit("device_deleted", device)
  console.log(`[MongoDB] Device ${_id} deleted`)

  res.send(device)
}
