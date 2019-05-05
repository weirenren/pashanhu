/**
 * Created by chaowei on 2017/5/30.
 */

var mongoose = require('../db').mongoose;
var schema = new mongoose.Schema({
    username: {type: String, default: ""},
    from: {type: String, default: ""}, // 来源:豆瓣租房/个人
    city: {type: String, default: ""},
    title: {type: String, default: ""}, // 标题
    content: {type: String, default: ""}, // 内容
    imgurl_list: {type: String, default: ""}, // 图片href 数组 逗号 隔开
    href: {type: String, default: ""}, // 豆瓣详情页
    checkin_date: Date, // 入住日期
    date: Date, // 创建日期
    visit_time: {type: Number, default: 1}, // 查看次数
    forbid: {type: Boolean, default: false}, // 是否禁止显示该条信息
    from_type: {type:Number, default: 0}, // 0：豆瓣 1:个人房源；2：个人求租
    address: {type: String, default: ""}, // 个人房源发布，需要填写地址，用于匹配
    address_geo: {type : String, default: ""}, // 经纬度
    es_id: {type: String, default: ""},
    extra: {type: String, default: ""} // 额外信息
});
var User = mongoose.model('h_house', schema);
module.exports = User;
