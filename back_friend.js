var Promise = require('bluebird');

var MongoClient = require('mongodb').MongoClient;
var settings=require("./settings");

let House = require("./h_model/house");
let Friend = require('./h_model/friend');

MongoClient.connect("mongodb://"+settings.ip+"/"+settings.db, function(err, db) {


});