var mongoose = require('../db').mongoose;
var schema = new mongoose.Schema({
    username: {type: String, default: ""}, // 用户名 有就存起来
    ip: {type: String, default: ""}, // 访问IP
    date: {type: String, default: ""}, // 年-月-日
    action : {type: String, default: ""}, // {ind: time, cre: time, log: time, mat: time, cur: time}
    extra: {type: String, default: ""} // 额外信息
});
var User = mongoose.model('h_action', schema);
module.exports = User;
