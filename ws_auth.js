const axios = require('axios')
const dotenv = require('dotenv')

dotenv.config()

const {
  AUTHENTICATION_API_URL,
  AUTHORIZED_GROUPS,
  GROUP_AUTHORIZATION_URL,
} = process.env



const check_user = async (jwt) => {
  const url = `${AUTHENTICATION_API_URL}/v2/whoami`
  const headers = { Authorization: `Bearer ${jwt}` }
  return axios.get(url,{ headers })
}

const check_groups = async (jwt) => {
  const headers = { Authorization: `Bearer ${jwt}` }
  const {data} = await axios.get(GROUP_AUTHORIZATION_URL, { headers })
  const groups = data.items
  const authorized_groups = AUTHORIZED_GROUPS.split(',')
  return groups.some( ({_id}) => authorized_groups.includes(_id) )
}

module.exports = async (payload, callback) => {

  try {

    if(!payload) throw `Empty WS payload`

    const {jwt} = payload

    if(!jwt) throw `Missing JWT`

    const {data} = await check_user(jwt)
    const {username} = data.properties || data

    const group_auth_status = await check_groups(jwt)

    if(!group_auth_status) throw `User is not part of authorized groups`

    console.log(`[Auth] Auth successful for ${username}`)
    callback(false, { username })

  }
  catch (error) {
    console.log(`[Auth] Access denied: ${error}`)
    callback(error, false)
  }

  // Credentials authentication is no longer used

}

exports.url = AUTHENTICATION_API_URL
exports.authorized_groups = AUTHORIZED_GROUPS
exports.group_authorization_url = GROUP_AUTHORIZATION_URL
