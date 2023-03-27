/**
 * Created by chaowei on 2017/5/30.
 */

var mongoose = require('../db').mongoose;
var schema = new mongoose.Schema({
    from: {type: String, default: ""}, // 来源:豆瓣租房/个人
    city: {type: String, default: ""},
    title: {type: String, default: ""}, // 标题
    content: {type: String, default: ""}, // 内容
    imgurl_list: {type: String, default: ""}, // 图片href 数组 逗号 隔开
    href: {type: String, default: ""}, // 豆瓣详情页
    tags: {type: String, default: ""}, // tag 13号线_一号线
    rentGeoIds: { type: String, default: ""},
    geoHash: { type: String, default: "" },
    date: Date, // 创建日期
});
var User = mongoose.model('h_house_upload', schema);
module.exports = User;
