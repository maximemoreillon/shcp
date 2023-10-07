import { Router } from "express"
import {
  create_device,
  read_all_devices,
  update_device,
  delete_device,
  read_device,
} from "../controllers/devices"

const router = Router()

router.route("/").post(create_device).get(read_all_devices)

router
  .route("/:_id")
  .get(read_device)
  .patch(update_device)
  .put(update_device)
  .delete(delete_device)

export default router
