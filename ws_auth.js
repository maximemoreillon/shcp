const axios = require('axios')
const dotenv = require('dotenv')
dotenv.config()

module.exports = (payload, callback) => {

  console.log("[Auth] authentication_function")

  if('jwt' in payload){
    console.log('[Auth] user is trying to authenticate using JWT')
    axios.post(`${process.env.AUTHENTICATION_API_URL}/decode_jwt`,{
      jwt: payload.jwt,
    })
    .then(response => {
      console.log(`[Auth] JWT is valid for ${response.data.properties.username}`)
      callback(false, {
        username: response.data.properties.username,
      })

    })
    .catch(error => {
      console.log(`[Auth] Invalid JWT: ${error}`)
      callback(error, false)
    })
  }

  else if('credentials' in payload){
    console.log('[Auth] user is trying to authenticate using credentials')
    axios.post(`${process.env.AUTHENTICATION_API_URL}/login`,{
      username: payload.credentials.username,
      password: payload.credentials.password,
    })
    .then(response => {
      console.log(`[Auth] Credentials are valid for ${payload.credentials.username}`)
      callback(false, {
        jwt: response.data.jwt
      })
    })
    .catch(error => {
      console.log(`[Auth] Wrong credentials for ${payload.credentials.username}`)
      callback(false, false)
    })
  }
}
