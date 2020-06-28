const formidable = require('formidable') // Needed for foorplan upload
const fs = require('fs') // Needed for upload and serving of floorplan
const path = require('path')


exports.get_floorplan = (req, res) => {
  console.log('here')
  res.sendFile(path.join(__dirname, '../floorplan/floorplan'));
}

exports.floorplan_upload = (req, res) => {
  var form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    if (err) return res.status(503).send('Error parsing form file')

    if(!files.image) return res.status(503).send('Image not found in files')

    var oldpath = files.image.path;
    var newpath = './floorplan/floorplan';
    fs.rename(oldpath, newpath, (err) => {
      if (err) return res.status(503).send('Error saving file')
      res.send('OK')
    });
  });
}
