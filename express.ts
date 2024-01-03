import express from "express"
import "express-async-errors"
import cors from "cors"
import { version } from "./package.json"
import auth from "@moreillon/express_identification_middleware"
// @ts-ignore
import group_auth from "@moreillon/express_group_based_authorization_middleware"
import { redactedConnectionString } from "./db"
import { broker_url } from "./mqtt"
import {
  floorplan_filename,
  floorplan_directory_path,
  floorplan_path,
} from "./config"
import type { Express } from "express"
import floorplanRouter from "./routes/floorplan"
import devicesRouter from "./routes/devices"
import mqttRouter from "./routes/mqtt"
import promBundle from "express-prom-bundle"

const { IDENTIFICATION_URL, AUTHORIZED_GROUPS, GROUP_AUTHORIZATION_URL } =
  process.env

const auth_options = { url: IDENTIFICATION_URL }
const promOptions = { includeMethod: true, includePath: true }

export let app: Express

export const init = () => {
  console.log("[Express] Initilization")

  app = express()

  app.use(express.json())
  app.use(cors())
  app.use(promBundle(promOptions))

  app.get("/", (req, res) => {
    res.send({
      application_name: "SHCP",
      author: "Maxime MOREILLON",
      version,
      authentication: {
        url: IDENTIFICATION_URL,
        group_authorization_url: GROUP_AUTHORIZATION_URL,
        authorized_groups: AUTHORIZED_GROUPS,
      },
      mongodb: {
        connection_string: redactedConnectionString,
      },
      mqtt: {
        url: broker_url,
      },
      floorplan: {
        floorplan_filename,
        floorplan_directory_path,
        floorplan_path,
      },
    })
  })

  app.use(auth(auth_options))
  console.log(`[Auth] Identification URL: ${IDENTIFICATION_URL}`)

  if (AUTHORIZED_GROUPS && GROUP_AUTHORIZATION_URL) {
    console.log(`[Auth] Enabling group-based authorization`)
    const group_auth_options = {
      url: GROUP_AUTHORIZATION_URL,
      groups: AUTHORIZED_GROUPS.split(","),
    }
    app.use(group_auth(group_auth_options))
  }

  app.use("/floorplan", floorplanRouter)
  app.use("/devices", devicesRouter)
  app.use("/mqtt", mqttRouter)

  return app
}

export const get_app = () => app
