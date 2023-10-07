import { Router } from "express"
import { floorplan_filename, floorplan_directory_path } from "../config"
import { get_floorplan, floorplan_upload } from "../controllers/floorplan"
import multer from "multer"

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, floorplan_directory_path)
  },
  filename: (req, file, cb) => {
    cb(null, floorplan_filename)
  },
})

const upload = multer({ storage })

const router = Router()

router
  .route("/")
  .get(get_floorplan)
  .post(upload.single("image"), floorplan_upload)

export default router
