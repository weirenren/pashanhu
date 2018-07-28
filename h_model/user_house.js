/**
 * Created by chaowei on 2017/5/30.
 */

var mongoose=require('../db').mongoose;
var schema=new mongoose.Schema({
    username:String, // 用户名
    user_id:String,  // 用户表id
    house_id:String, // house表id
    extra:String // 额外信息
});
var User=mongoose.model('h_user_house',schema);
module.exports=User;
