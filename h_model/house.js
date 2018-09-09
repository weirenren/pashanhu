/**
 * Created by chaowei on 2017/5/30.
 */

var mongoose = require('../db').mongoose;
var schema = new mongoose.Schema({
    from: {type: String, default: ""}, // 来源:豆瓣租房/个人
    city: {type: String, default: ""},
    title: {type: String, default: ""}, // 标题
    content: {type: String, default: ""}, // 内容
    imgurl_list: {type: String, default: ""}, // 图片路径数组{"a,b"}
    date: Date, // 创建日期
    visit_time: {type: Number, default: 1}, // 查看次数
    forbid: {type: Boolean, default: false}, // 是否禁止显示该条信息

    es_id: {type: String, default: ""},
    extra: {type: String, default: ""} // 额外信息
});
var User = mongoose.model('h_house', schema);
module.exports = User;
