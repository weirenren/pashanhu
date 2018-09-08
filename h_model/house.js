/**
 * Created by chaowei on 2017/5/30.
 */

var mongoose = require('../db').mongoose;
var schema = new mongoose.Schema({
    from: String, // 来源:豆瓣租房/个人
    city: String,
    title: String, // 标题
    content: String, // 内容
    imgurl_list: String, // 图片路径数组{"a,b"}
    date: Date, // 创建日期
    visit_time: {type: Number, default: 1}, // 查看次数
    forbid: {type: Boolean, default: false}, // 是否禁止显示该条信息

    es_id: String,
    extra: String // 额外信息
});
var User = mongoose.model('h_house', schema);
module.exports = User;
