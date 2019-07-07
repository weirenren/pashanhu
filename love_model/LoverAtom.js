/**
 * Created by chaowei on 2017/5/30.
 */

var mongoose = require('../db').mongoose;
var schema = new mongoose.Schema({
    datetime: Date, // 创建时间
    local_address: {type: String, default: ""},
    local_gender: {type: Number, default: 0},// 0: boy; 1: girl
    local_hometown: {type: String, default: ""}, // 入职地点
    local_age: {type: String, default: 0},
    local_height: {type: String, default: 0.0},
    local_edu: {type: String, default: ""},
    local_workyears: {type: String, default: ""},
    local_job: {type: String, default: ""},
    local_wechat: {type: String, default: ""},
    local_otherinfor: {type: String, default: ""},
    local_imgurl_list: {type: String, default: ''}, // 个人照片

    condi_gender: {type: Number, default: 1},
    condi_age: {type: String, default: 0},
    condi_height: {type: String, default: 0},
    condi_edu: {type: String, default: ""},
    condi_hometown: {type: String, default: ""},
    condi_otherinfor: {type: String, default: ""},
    forbid: {type: Boolean, default: false}, // 是否禁用该账户
    visit_time: {type: Number, default: 1},
    extra: {type: String, default: ""} // 额外信息
});
var User = mongoose.model('lover_atom', schema);
module.exports = User;
