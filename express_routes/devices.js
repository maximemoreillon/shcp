const express = require('express')
const device_controller = require('../controllers/devices.js')

const router = express.Router()

const get_all_devices = async (req, res) => {

    try {
        const devices = await device_controller.read_all()
        res.send(devices)
    } catch (error) {
        console.log(error)
        res.stastus(500).send(error)
    }
    
}


router.route('/')
    .get(get_all_devices)

module.exports = router
