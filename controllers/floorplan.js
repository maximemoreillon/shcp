const { floorplan_path } = require("../config")

exports.get_floorplan = (req, res) => {
  res.sendFile(floorplan_path)
}

exports.floorplan_upload = (req, res) => {
  res.send("OK?")
}
