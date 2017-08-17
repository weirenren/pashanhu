/**
 * Created by chaowei on 2017/8/18.
 */
var MongoClient = require('mongodb').MongoClient;
var settings=require("./settings");
MongoClient.connect("mongodb://"+settings.ip+"/"+settings.db, function(err, db) {
    if (err) throw err;
    db.collection("vips").drop(function(err, delOK) {
        //if (err) throw err;
        console.log("Vip deleted");
        db.close();
    });

    db.collection("app_user_infos").drop(function(err, delOK) {
        //if (err) throw err;
        console.log("App_User_Info deleted");
        db.close();
    });

    db.collection("users").drop(function(err, delOK) {
        //if (err) throw err;
        console.log("User deleted");
        db.close();
    });

    db.collection("friend_finders").drop(function(err, delOK) {
        //if (err) throw err;
         console.log("Friend_Finder deleted");
        db.close();
    });


});

