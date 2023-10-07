import { Server, Socket } from "socket.io"
import http from "http"
// @ts-ignore
import socketio_authentication_middleware from "@moreillon/socketio_authentication_middleware"
import axios from "axios"
import dotenv from "dotenv"

dotenv.config()

export const {
  IDENTIFICATION_URL = "http://user-manager/users/self",
  GROUP_AUTHORIZATION_URL = "http://group-manager/users/self/groups",
  AUTHORIZED_GROUPS = "",
} = process.env

export let io: Server

export const init = (http_server: http.Server) => {
  console.log("[WS] Initializing")
  io = new Server(http_server, {
    cors: {
      origin: "*",
    },
  })

  io.sockets.on("connection", connection_callback)
}

const connection_callback = (socket: Socket) => {
  // Deals with Websocket connections
  console.log("[WS] User connected")

  // Auth using middleware
  socket.use(
    socketio_authentication_middleware(socket, authentication_function)
  )

  socket.on("disconnect", () => {
    console.log("[WS] user disconnected")
  })

  socket.on("disconnect", () => {
    console.log("[WS] user disconnected")
  })
}

export const get_io = () => io

const check_user = async (jwt: string) => {
  const headers = { Authorization: `Bearer ${jwt}` }
  return axios.get(IDENTIFICATION_URL, { headers })
}

const check_groups = async (jwt: string) => {
  const headers = { Authorization: `Bearer ${jwt}` }
  const { data } = await axios.get(GROUP_AUTHORIZATION_URL, { headers })
  const groups = data.items
  const authorized_groups = AUTHORIZED_GROUPS.split(",")
  return groups.some(({ _id }: any) => authorized_groups.includes(_id))
}

async function authentication_function(payload: any, callback: Function) {
  try {
    if (!payload) throw `Empty WS payload`

    const { jwt } = payload

    if (!jwt) throw `Missing JWT`

    const { data } = await check_user(jwt)
    const { username } = data.properties || data

    if (AUTHORIZED_GROUPS && GROUP_AUTHORIZATION_URL) {
      const group_auth_status = await check_groups(jwt)
      if (!group_auth_status) throw `User is not part of authorized groups`
    }

    console.log(`[Auth] Auth successful for ${username}`)
    callback(false, { username })
  } catch (error) {
    console.log(`[Auth] Access denied: ${error}`)
    callback(error, false)
  }

  // Credentials authentication is no longer used
}
