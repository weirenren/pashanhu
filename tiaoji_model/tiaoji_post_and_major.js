
// 调剂帖子和专业(eg:二级或三级，例如计算机)的关系实体类：判断每个抓取的帖子属于哪个专业的
var mongoose = require('../db').mongoose;
var schema = new mongoose.Schema({
    post_url: { type: String, default: "" }, // 帖子链接
    major_top_class: { type: String, default: "" }, // 一级分类 eg:工学 (工学->环境科学与工程->环境科学)
    major_sub_id: { type: Number, default: 0 }, // 专业ID
});
var User = mongoose.model('tiaoji_post_and_major', schema);
module.exports = User;

// usrName,
//     usrUrl,
//     totalScore,
//     majorList,
//     englishScore,
//     politicsScore,
//     kemuoneScore,
//     kemutwoScore