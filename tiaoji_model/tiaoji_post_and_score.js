
// 调剂信息下 用户填写的个人分数
var mongoose = require('../db').mongoose;
var schema = new mongoose.Schema({
    user_name: {type: String, default: ""}, // 跟帖用户名
    user_url: {type: String, default: ""}, // 跟帖个人主页，链接
    post_url: { type: String, default: "" }, // 帖子链接
    post_datetime: Date, // 跟帖时间 年月日-时分秒
    
    total_score: { type: Number, default: 0 }, // 总分
    english_score: { type: Number, default: 0 }, // 英语分数
    politic_score: { type: Number, default: 0 }, // 政治分数
    kemu_one_score: { type: Number, default: 0 }, // 科目一分数
    kemu_two_score: { type: Number, default: 0 }, // 科目二分数
    major_top_class: { type: String, default: "" }, // 一级分类 eg:工学 (工学->环境科学与工程->环境科学)
    major_second_class: { type: String, default: "" }, // 二级分类，专业名称， eg: 化学（专业: 理学->化学->无机化学）
    major_third_class: { type: String, default: "" }, // 三级分类，专业名称， eg: 无机化学（专业: 理学->化学->无机化学）
});
var User = mongoose.model('tiaoji_post_and_score', schema);
module.exports = User;

// usrName,
//     usrUrl,
//     totalScore,
//     majorList,
//     englishScore,
//     politicsScore,
//     kemuoneScore,
//     kemutwoScore