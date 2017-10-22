/**
 * Created by chaowei on 2017/10/18.
 */
var mongoose = require('../db').mongoose;
var schema = new mongoose.Schema({
    qrcode: String, // 二维码
    name:String,
    forbid:{type : Boolean, default: false} //是否禁止该二维码使用
});
var Qrcode = mongoose.model('qrcode', schema);
module.exports = Qrcode;
