const express = require("express")
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

const { IDENTIFICATION_URL, AUTHORIZED_GROUPS, GROUP_AUTHORIZATION_URL } =
  process.env

const auth_options = { url: IDENTIFICATION_URL }

let app

const init = () => {
  console.log("[Express] Initilization")

  app = express()

  app.use(express.json())
  app.use(cors())

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

  app.use("/floorplan", require("./routes/floorplan.js"))
  app.use("/devices", require("./routes/devices.js"))
  app.use("/mqtt", require("./routes/mqtt.js"))

  return app
}

exports.get_app = () => app
exports.app = app
exports.init = init
