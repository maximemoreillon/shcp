module.exports = {
  db_url : process.env.MONGODB_URL,
  db_name : "shcp",
  collection_name : "devices",
  options: { useNewUrlParser: true, useUnifiedTopology: true }
}
