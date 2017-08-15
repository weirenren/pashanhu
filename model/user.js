/**
 * Created by chaowei on 2017/5/30.
 */

var mongoose=require('../db').mongoose;
var schema=new mongoose.Schema({
    username:String,
    password:String,
    pwd:String, //明文
    gender:String, // 男;女
    date:Date
});
var User=mongoose.model('User',schema);
module.exports=User;
