/*
* 工具函数
* 
* */

'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const fs = require('fs');
var User = require('./model/user');

const cert = fs.readFileSync('./private.key');	// 加密私钥
const TOKEN_EXPIRATION = 60;	// token 过期时间，默认单位为s，Eg: 60, "2 days", "10h", "7d"

var util = {};

util.genToken = function(tokendata) {
	return jwt.sign(tokendata, cert, {expiresIn: TOKEN_EXPIRATION});	
};

function randomWord(randomFlag, min, max){
	var str = "",
		range = min,
		arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

	// 随机产生
	if(randomFlag){
		range = Math.round(Math.random() * (max-min)) + min;
	}
	for(var i=0; i<range; i++){
		var pos = Math.round(Math.random() * (arr.length-1));
		str += arr[pos];
	}
	return str;
}

function Md5(data){
	return crypto.createHash('md5').update(data).digest("hex");
}

util.randPwd = function rand(){

	var str = randomWord(true, 6,7);
	return str;
}

util.sign = function(name,time,randkey){
	var salt = '$';

	var si = Md5(name + salt + time + salt +randkey);
	return si;
}


util.MD5 = function md5(data){
	return crypto.createHash('md5').update(data).digest("hex");
}


/**
 *
 *  username:String,//邮箱或者手机号 唯一标识
 personNum:Number,
 workplace:String,
 workplace_geo:String,//工作地点经纬度字符串 精度|维度
 homeplace:String,
 homeplace_geo:String,//期望居住地点经纬度字符串 精度|维度
 gender:Number,//1:男;2:女 登录情况下自动根据注册用户性别数据填充
 checkin_date:String, //入住日期
 money_rang:String,//租金范围
 want_gender:Number,//1:男;2:女;0:无要求
 call_number:String,//联系方式 手机或者邮箱
 others:String,//微信/QQ/个人介绍等等
 is_done:{type : Boolean, default: true} //任务进行中

 搜索日期:当前日期离入住半个月以内 0.3 一个月以内0.1
 期望入住地点:4公里 0.2 8公里:0.1
 工作地点:5公里:0.4 8公里:0.2
 性别   0.1

 * @param local 用户输入源租房信息实体
 * @param remote 数据库租房信息实体
 */
util.compare = function(local, remote){

	var checkin_date_score = 0;
	//
	var days = util.getDays(local.checkin_date, remote.checkin_date);

	if (days > 30) {
		return 0;
	}
	checkin_date_score = days < 15 ? 0.3 : 0.1;

	var checkin_home_score = 0;
	var local_homegeo = util.parseGeoString(local.homeplace_geo);
	var remote_homegeo = util.parseGeoString(local.homeplace_geo);
	var home_distance = getDistance(local_homegeo[0], local_homegeo[1], remote_homegeo[0], remote_homegeo[1]);
	if (home_distance < 3000) {
		checkin_home_score = 0.2;
	}
	if (home_distance >= 3000 && home_distance < 6000) {
		checkin_home_score = 0.1;
	}

	var checkin_work_score = 0;
	var local_workgeo = util.parseGeoString(local.workplace_geo);
	var remote_workgeo = util.parseGeoString(local.workplace_geo);
	var work_distance = getDistance(local_workgeo[0], local_workgeo[1], remote_workgeo[0], remote_workgeo[1]);
	if (work_distance < 5000) {
		checkin_work_score = 0.4;
	}
	if (work_distance >= 5000 && work_distance < 8000) {
		checkin_work_score = 0.2;
	}

	return checkin_date_score + checkin_home_score + checkin_work_score;
}

function getDistance(lat1, lng1, lat2, lng2) {
	var dis = 0;
	var radLat1 = toRadians(lat1);
	var radLat2 = toRadians(lat2);
	var deltaLat = radLat1 - radLat2;
	var deltaLng = toRadians(lng1) - toRadians(lng2);
	var dis = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(deltaLat / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(deltaLng / 2), 2)));
	return dis * 6378137;

	function toRadians(d) {  return d * Math.PI / 180;}
}

//sDate1和sDate2是2002-12-18格式
util.getDays = function(sDate1,  sDate2){

	var  aDate,oDate1,oDate2,iDays;
	aDate  =  sDate1.toString().split("-");
	//转换为12-18-2002格式,即时间字符串的格式：月-日-年
	oDate1  =  new  Date(aDate[1]  +  '-'  +  aDate[2]  +  '-'  +  aDate[0]);
	aDate  =  sDate2.toString().split("-");
	oDate2  =  new  Date(aDate[1]  +  '-'  +  aDate[2]  +  '-'  +  aDate[0]);
	//把相差的毫秒数转换为天数
	iDays  =  parseInt((oDate1  -  oDate2)  /  1000  /  60  /  60  /24);

	console.log('getDays:' + iDays + ' -> ' + oDate1 + ' ' +oDate2);
	return  iDays;
}

util.minusDays = function(sDate1, sDate2) {
	var days = parseInt((oDate1  -  oDate2)  /  1000  /  60  /  60  /24);

	return days > 0 ? days : -days;
}
//使用
function  btnCount_Click(){
	//s1  =  "2002-1-10";
	//s2  =  "2002-10-1" ;
	alert(getDays(s1,s2));
}

util.geoToString = function(lat,lng) {
	return lat + '_' + lng;
};

util.parseGeoString = function(geoString) {
	return geoString.split('_');
};

function testDateFormat() {
	let da = new Date("<YYYY-mm-ddTHH:MM:ss>");

	console.log(da.toDateString());
}

function testDateSort() {

	var arr = util.parseGeoString('12345_123');



	//User.remove({});

	var date1 = new Date("2017-06-30 12:50:20");
	var date2 = new Date("2017-06-20 12:50:20");
	var date3 = new Date("2017-06-24 12:50:20");

	//User.remove({}, ()=>{}) ;


	var user1 = new User;
	user1.date = date1;
	user1.gender = '1';
	user1.save(function(err, obj){


		//console.log(user1)

	});

	var user2 = new User;
	user2.date = date2;
	user2.gender = '2';
	user2.save(function(err, obj){


		//console.log(user2)

	});

	var user3 = new User;
	user3.date = date3;
	user3.gender = '3';
	user3.save(function(err, obj){


		//console.log(user3)

	});


	User.find().sort({date :-1}).exec(function(err, users) {

		users.forEach(function(user) {
			console.log(user);
		});
	});
	
}

Promise.resolve()
	.then(testDateFormat());


module.exports = util;