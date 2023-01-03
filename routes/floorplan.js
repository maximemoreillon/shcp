const { Router } = require("express")
const { floorplan_filename, floorplan_directory_path } = require("../config")
const multer = require("multer")
const {
  get_floorplan,
  floorplan_upload,
} = require("../controllers/floorplan.js")

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

module.exports = router
