const express = require('express')
const authorization_middleware = require('@moreillon/authorization_middleware')

const router = express.Router()

authorization_middleware.authentication_api_url = `${process.env.AUTHENTICATION_API_URL}/decode_jwt`


router.route('/')
  .get()
  .post()

module.exports = router
