const express = require('express')
//const authorization_middleware = require('@moreillon/authorization_middleware')
const controller = require('../controllers/floorplan.js')

const router = express.Router()

//authorization_middleware.authentication_api_url = `${process.env.AUTHENTICATION_API_URL}/decode_jwt`

// Authentication middleware is not being used

router.route('/')
  .get(controller.get_floorplan)
  .post(controller.floorplan_upload)

module.exports = router
