/**
 * Created by chaowei on 2017/5/30.
 */

var mongoose = require('../db').mongoose;
var schema = new mongoose.Schema({
    datetime: Date, // 创建时间
    city: String,
    checkInDate: String,// 入职日期
    checkInPlace: String, // 入职地点
    callNumber: String, //联系方式
    other: String,//其它备注信息
    forbid: {type: Boolean, default: false}, // 是否禁用该账户
    visit_time: {type: Number, default: 1},
    extra: String // 额外信息
});
var User = mongoose.model('h_friend', schema);
module.exports = User;
