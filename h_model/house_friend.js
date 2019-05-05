/**
 * Created by chaowei on 2017/5/30.
 */
// 房屋出租者与求租客之间关联
var mongoose = require('../db').mongoose;
var schema = new mongoose.Schema({
    house_uname: {type: String, default: ""}, // 用户名
    friend_uname: {type: String, default: ""}, // 用户名
    house_id: {type: String, default: ""}, // friend表id
    friend_id: {type: String, default: ""}, // friend表id
    type: {type: Number, default: 0},// 1：房主对房客感兴趣；2：房客对房主感兴趣；3：双方感兴趣
    extra: {type: String, default: ""} // 额外信息
});
var User = mongoose.model('h_house_friend', schema);
module.exports = User;
