/**
 * Created by chaowei on 2017/8/13.
 */
var mongoose = require('../db').mongoose;
var schema = new mongoose.Schema({
    username: String,
    time: {type: Number, default: 0}, // 会员天数
    deviceid: String,
    date: Date, // 激活日期 年月日
    qrcode: {type:String, default: ''},
    vipcode: {type:String, default: ''},
    forbidden: {type:Boolean, default: false} // 是否禁用该账户
});
var UserInfo = mongoose.model('appuserinfo', schema);
module.exports = UserInfo;

