
var mongoose = require('../db').mongoose;
var schema = new mongoose.Schema({
    post_uname: { type: String, default: "" }, // 发帖name
    user_url: {type: String, default: ""}, // 发帖者个人主页，链接
    post_url: { type: String, default: "" }, // 帖子链接
    post_datetime: Date, // 发帖时间 年月日-时分秒
    post_title: { type: String, default: "" }, // 帖子标题
    province_id: { type: Number, default: 0 }, // 省份ID，在爬虫阶段 根据高校名称确定
    colleage_name: { type: String, default: "" }, // 高校名称
    major_id: { type: Number, default: 0 }, // majorID 一级分类而来，在爬虫阶段 根据专业名称确定
    major_top_class: { type: String, default: "" }, // 一级分类 eg:工学 (工学->环境科学与工程->环境科学)
    major_second_class: { type: String, default: "" }, // 二级分类，专业名称， eg: 化学（专业: 理学->化学->无机化学）
    major_third_class: { type: String, default: "" }, // 三级分类，专业名称， eg: 无机化学（专业: 理学->化学->无机化学）
    grade_level: { type: String, default: "" }, // 年级，eg: 2022
    recruit_num: { type: String, default: "" }, // 招收人数
    email: { type: String, default: "" },   // 邮箱
    phone_number: { type: String, default: "" }, // 手机号
    description: { type: String, default: "" }, // 调剂详情
    // is985: { type: Boolean, default: false },
    // is211: { type: Boolean, default: false },
    // yi_liu:{ type: Boolean, default: false },
});
var User = mongoose.model('tiaoji_post', schema);
module.exports = User;
