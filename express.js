const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
const { version } = require("./package.json")
const auth = require("@moreillon/express_identification_middleware")
const group_auth = require("@moreillon/express_group_based_authorization_middleware")
const { db_name, url: db_url, collection } = require("./db.js")
const { broker_url } = require("./mqtt.js")
const {
  floorplan_filename,
  floorplan_directory_path,
  floorplan_path,
} = require("./config")

// Routes
const floorplan_router = require("./routes/floorplan.js")
const devices_router = require("./routes/devices.js")

const { IDENTIFICATION_URL, AUTHORIZED_GROUPS, GROUP_AUTHORIZATION_URL } =
  process.env

const auth_options = { url: IDENTIFICATION_URL }

let app

const root_controller = (req, res) => {
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
      url: db_url,
      db_name: db_name,
      collection: collection,
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
}

const init = () => {
  console.log("[Express] Initilization")

  app = express()

  app.use(bodyParser.json())
  app.use(cors())

  app.get("/", root_controller)

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

  app.use("/floorplan", floorplan_router)
  app.use("/devices", devices_router)

  return app
}

exports.get_app = () => app
exports.app = app
exports.init = init
