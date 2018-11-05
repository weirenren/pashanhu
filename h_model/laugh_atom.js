/**
 * Created by chaowei on 2017/5/30.
 */

var mongoose = require('../db').mongoose;
var schema = new mongoose.Schema({
    datetime: Date, // 创建时间
    req_type: {type: Number, default: 0}, // 0:非token; 1:带token from http://wx.deepba.com
    group: {type: String, default: ""},// 类别； 类别名称。eg：豪车
    group_id: {type: Number, default: 0},// 类别id
    weight: {type: String, default: ""}, // 权重
    name: {type: String, default: ""}, // 名称描述
    img_url: {type: String, default: ""},// 头像url
    img_api: {type: String, default: ""},// api;默认是 get请求
    api_parms: {type: String, default:""},// 格式 eg:姓名&name?年龄&age
    forbid: {type: Boolean, default: false}, // 是否禁用
    visit_time: {type: Number, default: 1},
    extra: {type: String, default: ""} // 额外信息
});
var Laugh = mongoose.model('h_laugh', schema);
module.exports = Laugh;
