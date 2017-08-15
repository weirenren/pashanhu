/**
 * Created by chaowei on 2017/8/13.
 */
var mongoose=require('../db').mongoose;
var schema=new mongoose.Schema({
    username:String,
    deadline:Date,
    deviceid:String
});
var User=mongoose.model('app_user_info',schema);
module.exports=User;
