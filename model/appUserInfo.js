/**
 * Created by chaowei on 2017/8/13.
 */
var mongoose = require('../db').mongoose;
var schema = new mongoose.Schema({
    username: String,
    deadline: Number, // 剩余天数
    deviceid: String,
    viplevel: Number
});
var User = mongoose.model('App_User_Info', schema);
module.exports = User;
