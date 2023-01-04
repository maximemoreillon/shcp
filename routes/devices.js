const { Router } = require("express")
const {
  create_device,
  read_all_devices,
  update_device,
  delete_device,
  read_device,
} = require("../controllers/devices.js")

const router = Router()

router.route("/").post(create_device).get(read_all_devices)

router
  .route("/:_id")
  .get(read_device)
  .patch(update_device)
  .put(update_device)
  .delete(delete_device)

module.exports = router
