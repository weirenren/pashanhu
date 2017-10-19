/**
 * Created by chaowei on 2017/10/9.
 */
var mongoose = require('../db').mongoose;
var schema = new mongoose.Schema({
    username: String, // 用户名
    orderid: String, // 微信支付生产的订单id
    totalmoney: String, // 钱数
    filename: String, // 支付详情图片文件路径
    datetime: String, // 支付日期
    content: String, // 支付图片扫描内容
    checked: {type : Boolean, default: false} // 是否人工审核过
});
var Payinfo = mongoose.model('payinfo', schema);
module.exports = Payinfo;
