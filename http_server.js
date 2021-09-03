const http = require('http')
const dotenv = require('dotenv')

dotenv.config()

// const { get_app() } = require('./express.js')


const port = process.env.APP_PORT || 80

let http_server

const init = (app) => {
    http_server = http.Server(app)
    http_server.listen(port, () => {
        console.log(`[HTTP Server] listening on port ${port}`)
    })

    return http_server
}

exports.init = init
exports.port = port
exports.get_http_server = () => http_server
exports.http_server = http_server
