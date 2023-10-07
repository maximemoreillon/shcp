const dotenv = require("dotenv")
const path = require("path")
dotenv.config

const {
  FLOORPLAN_DIRECTORY_PATH = "./floorplan",
  FLOORPLAN_FILENAME = "floorplan",
} = process.env

export const floorplan_directory_path = path.resolve(FLOORPLAN_DIRECTORY_PATH)
export const floorplan_filename = FLOORPLAN_FILENAME
export const floorplan_path = path.join(
  floorplan_directory_path,
  FLOORPLAN_FILENAME
)
