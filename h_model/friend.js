/**
 * Created by chaowei on 2017/5/30.
 */

var mongoose = require('../db').mongoose;
var schema = new mongoose.Schema({
    datetime: Date, // 创建时间
    city: {type: String, default: ""},
    checkInDate: {type: String, default: ""},// 入职日期
    checkInPlace: {type: String, default: ""}, // 入职地点
    callNumber: {type: String, default: ""}, //联系方式
    other: {type: String, default: ""},//其它备注信息
    forbid: {type: Boolean, default: false}, // 是否禁用该账户
    visit_time: {type: Number, default: 1},
    extra: {type: String, default: ""} // 额外信息
});
var User = mongoose.model('h_friend', schema);
module.exports = User;
