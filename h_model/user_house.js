/**
 * Created by chaowei on 2017/5/30.
 */

var mongoose = require('../db').mongoose;
var schema = new mongoose.Schema({
    username: String, // 用户名
    house_id: String, // house表id
    es_id: String, // 在es中id
    type: {type: Number, default: 1},// 1：添加 2：关注
    extra: String // 额外信息
});
var User = mongoose.model('h_user_house', schema);
module.exports = User;
