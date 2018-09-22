var misc = require('./misc');
var MongoClient = require('mongodb').MongoClient;

MongoClient.connect(misc.MongoDB_URL, function(err, db) {
  if (err) throw err;
  var dbo = db.db(misc.MongoDB_DB_name);
  dbo.collection(misc.MongoDB_collection_name).drop(function(err, delOK) {
    if (err) throw err;
    if (delOK) {
      console.log("Collection deleted");
      dbo.createCollection(misc.MongoDB_collection_name, function(err, res) {
        if (err) throw err;
        console.log("Collection created!");
        db.close();
      });
    }
  });
});
