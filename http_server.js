const http = require('http')
const dotenv = require('dotenv')

dotenv.config()

const {
    APP_PORT = 80
} = process.env

let http_server

exports.init = (app) => {
    http_server = http.Server(app)
    http_server.listen(APP_PORT, () => {
        console.log(`[HTTP Server] listening on port ${APP_PORT}`)
    })

    return http_server
}

exports.port = APP_PORT
exports.get_http_server = () => http_server
exports.http_server = http_server
