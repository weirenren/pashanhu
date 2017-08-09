var settings=require("./settings");
var mongoose=require('mongoose');
var mongooseRecursiveUpsert = require('mongoose-recursive-upsert');
mongoose.plugin(mongooseRecursiveUpsert);
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://"+settings.ip+"/"+settings.db);
var db=mongoose.connection;
module.exports={
    "dbCon":db,
    "mongoose":mongoose
};