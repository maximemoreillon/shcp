const express = require('express')
const bodyParser = require("body-parser")
const pjson = require('./package.json')
const auth = require('@moreillon/express_identification_middleware')

const cors = require('cors')

const auth_options = { url: `${process.env.AUTHENTICATION_API_URL}/v2/whoami`, lax: true}

// Routes
const floorplan_router = require('./express_routes/floorplan.js')
const devices_router = require('./express_routes/devices.js')

let app 

const init = () => {
    console.log('[Express] Initilization' )

    app = express()

    app.use(bodyParser.json())
    app.use(cors())

    app.get('/', (req, res) => {
        res.send({
            application_name: 'SHCP API',
            author: 'Maxime MOREILLON',
            version: pjson.version,
            authentication: {
                url: auth_options.url
            },
            mongodb: {
                url: require('./db.js').url,
                db_name: require('./db.js').db_name,
                collection: require('./db.js').collection,
            },
            mqtt: {
                url: require('./mqtt.js').broker_url,
            }

        })
    })

    app.use('/floorplan', auth(auth_options), floorplan_router)
    app.use('/devices', auth(auth_options), devices_router)

    return app

}


exports.get_app = () => app
exports.app = app
exports.init = init
