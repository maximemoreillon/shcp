const path = require("path")

exports.get_floorplan = (req, res) => {
  const floorplanPath = path.resolve("./floorplan/floorplan")
  res.sendFile(floorplanPath)
}

exports.floorplan_upload = (req, res) => {
  res.send("OK?")
}
