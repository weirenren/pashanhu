/**
 * Created by chaowei on 2017/8/19.
 */

var mongoose=require('../db').mongoose;
var schema=new mongoose.Schema({
    json:String,
    group:String,
    title:String,
    url:String,
    type:{type:String, default: "0"} //0:普通;1:会员权限
});
var User=mongoose.model('service',schema);
module.exports=User;
