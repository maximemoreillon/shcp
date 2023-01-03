const dotenv = require("dotenv")
const path = require("path")
dotenv.config
const {
  FLOORPLAN_DIRECTORY_PATH = "./floorplan",
  FLOORPLAN_FILENAME = "floorplan",
} = process.env

const floorplan_directory_path = path.resolve(FLOORPLAN_DIRECTORY_PATH)

exports.floorplan_directory_path = floorplan_directory_path
exports.floorplan_filename = FLOORPLAN_FILENAME
exports.floorplan_path = path.join(floorplan_directory_path, FLOORPLAN_FILENAME)
