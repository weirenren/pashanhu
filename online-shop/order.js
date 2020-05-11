/**
 * Created by chaowei on 2017/5/30.
 */

var mongoose = require('../db').mongoose;
var schema = new mongoose.Schema({
    datetime: Date, // 创建时间
    username: {type: String, default: ""},
    tel: {type: String, default: 0},// 0: boy; 1: girl
    address: {type: String, default: ""}, // 入职地点
    otherInfor: {type: String, default: 0},
    menu: { type: String, default: '' }, // [{'name':'黄瓜','price': 3.5, ''quantity': 3},{'name':'黄瓜','price': 3.5, ''quantity': 3}]
    extra: {type: String, default: ""} // 额外信息
});
var User = mongoose.model('online_order', schema);
module.exports = User;
