/**
 * Created by chaowei on 2017/8/17.
 */
var mongoose = require('../db').mongoose;
var schema = new mongoose.Schema({
    vipcode: String, // 激活码
    qrcode: String, // 二维码
    time: Number, // 剩余天数
    payed:{type : Boolean, default: false} //任务进行中 // 0代码没有购买会员
});
var User = mongoose.model('vip', schema);
module.exports = User;
