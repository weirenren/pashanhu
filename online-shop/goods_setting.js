/**
 * Created by chaowei on 2017/5/30.
 */

var mongoose = require('../db').mongoose;
var schema = new mongoose.Schema({
    datetime: Date, // 创建时间
    setting: {type: String, default: ""}
});
var goods = mongoose.model('goods_setting', schema);
module.exports = goods;
