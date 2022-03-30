const express = require('express')
const bodyParser = require("body-parser")
const cors = require('cors')
const pjson = require('./package.json')
const auth = require('@moreillon/express_identification_middleware')
const group_auth = require('@moreillon/express_group_based_authorization_middleware')
const {db_name, url: db_url, collection} = require('./db.js')
const { broker_url } = require('./mqtt.js')
// Routes
const floorplan_router = require('./express_routes/floorplan.js')
const devices_router = require('./express_routes/devices.js')


const {
  AUTHENTICATION_API_URL,
  AUTHORIZED_GROUPS,
  GROUP_AUTHORIZATION_URL,
} = process.env


const auth_options = { url: `${process.env.AUTHENTICATION_API_URL}/v2/whoami`}

let app

const root_controller = (req, res) => {
  res.send({
    application_name: 'SHCP API',
    author: 'Maxime MOREILLON',
    version: pjson.version,
    authentication: {
      url: AUTHENTICATION_API_URL,
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
    }

  })
}

const init = () => {
  console.log('[Express] Initilization' )

  app = express()

  app.use(bodyParser.json())
  app.use(cors())

  app.get('/', root_controller)

  app.use(auth(auth_options))

  if(AUTHORIZED_GROUPS && GROUP_AUTHORIZATION_URL) {
    console.log(`[Auth] Enabling group-based authorization`)
    const group_auth_options = {
      url: GROUP_AUTHORIZATION_URL,
      groups: AUTHORIZED_GROUPS.split(',')
    }
    app.use(group_auth(group_auth_options))
  }

  app.use('/floorplan', floorplan_router)
  app.use('/devices', devices_router)

  return app

}


exports.get_app = () => app
exports.app = app
exports.init = init
