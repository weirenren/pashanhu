/**
 * Created by chaowei on 2017/8/13.
 */
var mongoose = require('../db').mongoose;
var schema = new mongoose.Schema({
    username: String,
    time: Number, // 会员天数
    deviceid: String,
    date: Date, // 激活日期
    qrcode: String,
    vipcode: {type:String, default: 'null'} // 0代码没有购买会员
});
var User = mongoose.model('app_user_info', schema);
module.exports = User;
