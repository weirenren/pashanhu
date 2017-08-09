/**
 * Created by chaowei on 2017/5/30.
 */
var mongoose=require('../db').mongoose;
var schema=new mongoose.Schema({
    username:String,//邮箱或者手机号 唯一标识
    personNum:Number,
    workplace:String,
    workplace_geo:String,//工作地点经纬度字符串 精度|维度
    homeplace:String,
    homeplace_geo:String,//期望居住地点经纬度字符串 精度|维度
    gender:String,//1:男;2:女 登录情况下自动根据注册用户性别数据填充
    checkin_date:String, //入住日期
    money_rang:String,//租金范围
    want_gender:String,//1:男;2:女;0:无要求
    call_number:String,//联系方式 手机或者邮箱
    others:String,//微信/QQ/个人介绍等等
    is_done:{type : Boolean, default: true} //任务进行中
});
var FriendFinder=mongoose.model('Friend_Finder',schema);
module.exports=FriendFinder;


