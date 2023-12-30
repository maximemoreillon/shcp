import dotenv from "dotenv"
dotenv.config()

import { connect as dbConnect } from "./db"
import { init as mqttInit } from "./mqtt"
import { init as wsInit } from "./websockets"
import { init as httpServerInit } from "./http_server"
import { init as expressInit } from "./express"

import pjson from "./package.json"

console.log(`-- SHCP v${pjson.version} --`)

mqttInit()
const app = expressInit()
const server = httpServerInit(app)
wsInit(server)
dbConnect()
