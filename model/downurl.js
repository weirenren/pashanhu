/**
 * Created by weichao13 on 2018/3/16.
 */
var mongoose = require('../db').mongoose;
var schema = new mongoose.Schema({
    url: String, // 下载链接
    used:{type : Boolean, default: false} //任务进行中
});
var url = mongoose.model('downurl', schema);
module.exports = url;