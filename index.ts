import { connect as dbConnect } from "./db"
import { init as mqttInit } from "./mqtt"
import { init as wsInit } from "./websockets"
import { init as httpServerInit } from "./http_server"
import { init as expressInit } from "./express"
import dotenv from "dotenv"
import pjson from "./package.json"

dotenv.config()

const init = async () => {
  console.log(`-- SHCP v${pjson.version} --`)

  const app = expressInit()
  const server = httpServerInit(app)
  wsInit(server)
  await dbConnect()
  mqttInit()
}

init()
