import mongoose from "mongoose"

import dotenv from "dotenv"

dotenv.config()

export const { MONGODB_DB = "shcp", MONGODB_URL = "mongodb://mongo:27017" } =
  process.env

export const connect = () =>
  new Promise((resolve) => {
    const connection_url = `${MONGODB_URL}/${MONGODB_DB}`

    mongoose
      .connect(connection_url)
      .then(() => {
        console.log("[Mongoose] Initial connection successful")
        resolve("Connected")
      })
      .catch((error) => {
        console.log("[Mongoose] Initial connection failed")
        setTimeout(connect, 5000)
      })
  })
