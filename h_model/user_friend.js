/**
 * Created by chaowei on 2017/5/30.
 */

var mongoose = require('../db').mongoose;
var schema = new mongoose.Schema({
    username: {type: String, default: ""}, // 用户名
    friend_id: {type: String, default: ""}, // friend表id
    type: {type: Number, default: 1},// 1：添加 2：关注
    extra: {type: String, default: ""} // 额外信息
});
var User = mongoose.model('h_user_friend', schema);
module.exports = User;
