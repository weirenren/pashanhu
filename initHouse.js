/**
 * Created by chaowei on 2017/8/19.
 */
var House = require('./h_model/house');
var User_House = require('./h_model/user_house');
var User = require('./h_model/user');

var mongoose = require('mongoose')
var Promise = require('bluebird');

var MongoClient = require('mongodb').MongoClient;
var settings=require("./settings");

const options = {
    autoIndex: false, // Don't build indexes
    reconnectTries: 30, // Retry up to 30 times
    reconnectInterval: 500, // Reconnect every 500ms
    poolSize: 10, // Maintain up to 10 socket connections
    // If not connected, return errors immediately rather than waiting for reconnect
    bufferMaxEntries: 0
}

const connectWithRetry = () => {
    console.log('MongoDB connection with retry')
    mongoose.connect("mongodb://mongo:27017/test", options).then(()=>{
        console.log('MongoDB is connected')
    }).catch(err=>{
        console.log('MongoDB connection unsuccessful, retry after 5 seconds.')
        setTimeout(connectWithRetry, 5000)
    })
}
// Exit application on error
mongoose.connection.on('error', err => {
    // console.log(`MongoDB connection error: ${err}`)
    // setTimeout(connectWithRetry, 3000)
    // process.exit(-1)
})


MongoClient.connect("mongodb://"+settings.ip+"/"+settings.db, function(err, db) {

    initServices();
    // if (err) {
    //     // connectWithRetry()
    // } else {
    //     initServices();
    // }

});
//list.add(new GridAdapter.ItemData("头条", "https://m.toutiao.com/?W2atIF=1", this));
//list.add(new GridAdapter.ItemData("喜马拉雅FM", "https://m.ximalaya.com", this));
//list.add(new GridAdapter.ItemData("读书", "http://dushu.xiaomi.com/#page=main&tab=0", this));
//list.add(new GridAdapter.ItemData("音乐", "https://music.baidu.com/home", this));
//list.add(new GridAdapter.ItemData("环球网", "http://m.huanqiu.com", this));
//list.add(new GridAdapter.ItemData("铁血", "http://m.tiexue.net", this));
//list.add(new GridAdapter.ItemData("糗事百科", "https://www.qiushibaike.com", this));
//list.add(new GridAdapter.ItemData("爱奇艺", "http://m.iqiyi.com", this));
//list.add(new GridAdapter.ItemData("1", "折800", "https://m.zhe800.com", this));

function initServices() {
    console.log('initServices');
    // User.remove({},()=>{});
    // User_House.remove({},()=>{});
    // House.remove({},()=>{});

}

Promise.resolve()
    .then(initServices);
