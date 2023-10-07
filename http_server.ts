import http from "http"
import dotenv from "dotenv"
import type { Express } from "express"
dotenv.config()

const { APP_PORT = 80 } = process.env

export let http_server: http.Server

export const init = (app: Express) => {
  http_server = new http.Server(app)
  http_server.listen(APP_PORT, () => {
    console.log(`[HTTP Server] listening on port ${APP_PORT}`)
  })

  return http_server
}

export const port = APP_PORT
export const get_http_server = () => http_server
