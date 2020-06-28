const http = require('http')
const app = require('./express.js')

module.exports = http.Server(app)
