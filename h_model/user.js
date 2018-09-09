/**
 * Created by chaowei on 2017/5/30.
 */

var mongoose = require('../db').mongoose;
var schema = new mongoose.Schema({
    username: {type: String, default: ""},
    password: {type: String, default: ""},
    pwd: {type: String, default: ""}, //明文
    gender: {type: String, default: ""}, // 男;女
    date: Date,
    forbid: {type: Boolean, default: false}, // 是否禁用该账户
    extra: {type: String, default: ""} // 额外信息
});
var User = mongoose.model('h_user', schema);
module.exports = User;
