/*
* 工具函数
*
* */

'use strict';
var dateFormat = require('dateformat');
const crypto = require('crypto');
// const jwt = require('jsonwebtoken');
const fs = require('fs');
var User = require('./model/user');
var PayInfo = require('./model/payinfo');

var mkdirp = require('mkdirp');

// const cert = fs.readFileSync('./private.key');	// 加密私钥
const TOKEN_EXPIRATION = 60;	// token 过期时间，默认单位为s，Eg: 60, "2 days", "10h", "7d"

var util = {};

util.genToken = function (tokendata) {
	// return jwt.sign(tokendata, cert, {expiresIn: TOKEN_EXPIRATION});
	return tokendata;
};

function randomWord(randomFlag, min, max) {
	var str = "",
		range = min,
		arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

	// 随机产生
	if (randomFlag) {
		range = Math.round(Math.random() * (max - min)) + min;
	}
	for (var i = 0; i < range; i++) {
		var pos = Math.round(Math.random() * (arr.length - 1));
		str += arr[pos];
	}
	return str;
}

function Md5(data) {
	return crypto.createHash('md5').update(data).digest("hex");
}

util.randPwd = function rand() {

	var str = randomWord(true, 6, 7);
	return str;
}

util.sign = function (name, time, randkey) {
	var salt = '$';

	var si = Md5(name + salt + time + salt + randkey);
	return si;
}


util.MD5 = function md5(data) {
	return crypto.createHash('md5').update(data).digest("hex");
};

util.getDateNow = function () {

	let i = 8;

	//参数i为时区值数字，比如北京为东八区则输进8,西5输入-5

	if (typeof i !== 'number') return;

	var d = new Date();

	//得到1970年一月一日到现在的秒数

	var len = d.getTime();

	//本地时间与GMT时间的时间偏移差

	var offset = d.getTimezoneOffset() * 60000;

	//得到现在的格林尼治时间

	var utcTime = len + offset;

	return new Date(utcTime + 3600000 * i);

}

util.getCityEngName = function (city_en) {
	let city_ch = '';
	if (city_en === '北京') {
		city_ch = 'beijing';
	}
	if (city_en === '上海') {
		city_ch = 'shanghai';
	}
	if (city_en === '武汉') {
		city_ch = 'wuhan';
	}
	if (city_en === '成都') {
		city_ch = 'chengdu';
	}
	if (city_en === '深圳') {
		city_ch = 'shenzhen';
	}
	if (city_en === '南京') {
		city_ch = 'nanjing';
	}
	if (city_en === '杭州') {
		city_ch = 'hangzhou';
	}
	if (city_en === '大连') {
		city_ch = 'dalian';
	}
	return city_ch;
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
util.compare = function (local, remote) {

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

	function toRadians(d) { return d * Math.PI / 180; }
}

function rad(d) {
	return d * Math.PI / 180.0;
}


function calDistance(lon1, lat1, lon2, lat2) {
	var a = rad(lon1) - rad(lon2);
	var radLat1 = rad(lat1);
	var radLat2 = rad(lat2);
	var b = radLat1 - radLat2;

	var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(b / 2), 2) +
		Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(a / 2), 2)));
	s = s * 6378.137; // 地球半径，单位千米
	s = Math.round(s * 10000) / 10000;

	return s;
}
util.getDistance = calDistance;

util.formatDateISO = function (date) {
	return dateFormat(date, 'isoDate');
};

// 年月日 时分秒 2018-08-24 10:56:25
util.formatDate = function (date) {
	return dateFormat(date, 'isoDate') + ' ' + dateFormat(date, 'isoTime');;
};
// 2022 - 03 - 25 00: 00: 00
//sDate1和sDate2是2002-12-18格式
util.getDays = function (sDate1, sDate2) {

	var aDate, oDate1, oDate2, iDays;
	aDate = sDate1.toString().split("-");
	//转换为12-18-2002格式,即时间字符串的格式：月-日-年
	oDate1 = new Date(aDate[1] + '-' + aDate[2] + '-' + aDate[0]);
	aDate = sDate2.toString().split("-");
	oDate2 = new Date(aDate[1] + '-' + aDate[2] + '-' + aDate[0]);
	//把相差的毫秒数转换为天数
	iDays = parseInt((oDate1 - oDate2) / 1000 / 60 / 60 / 24);

	return iDays;
}

util.minusDays = function (sDate1, sDate2) {
	console.log(sDate1 - sDate2);
	var days = parseInt((sDate1 - sDate2) / 1000 / 60 / 60 / 24);

	return days > 0 ? days : -days;
}

// let time = "2018-07-24 15:14:33";
// let time2 = "2018-07-24 15:14:34";
util.minusDateTime = function (sDate1, sDate2) {

	return sDate1 - sDate2;
}

//使用
function btnCount_Click() {
	//s1  =  "2002-1-10";
	//s2  =  "2002-10-1" ;
	alert(getDays(s1, s2));
}

util.geoToString = function (lat, lng) {
	return lat + '_' + lng;
};

util.parseGeoString = function (geoString) {
	return geoString.split(',');
};

function testDateFormat() {
	let da = new Date();

	console.log(da.toDateString());
}

function testDateCompare() {
	let date = new Date();

	let time = "2018-07-24 15:14:33";
	let time2 = "2018-07-24 15:14:34";

	// time = time.replace("-", "/");
	// let d1 = new Date(Date.parse(time));
	// let today = new Date();
	//
	// if (d1 > today) {
	// 	console.log('大于');
	// } else {
	// 	console.log('小于');
	// }
	//
	// console.log((today - d1) / (1000*60*60));

	let d = Date.parse(time);
	let d2 = Date.parse(time2);

	// let days = util.getDays(util.formatDate(d), util.formatDate(new Date()));

	let st = dateFormat(d, 'isoDate') + ' ' + dateFormat(d, 'isoTime');
	console.log('days:' + st);


	console.log('days:' + util.minusDays(d, d2));
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
	user1.save(function (err, obj) {


		console.log(user1)

	});

	var user2 = new User;
	user2.date = date2;
	user2.gender = '2';
	user2.save(function (err, obj) {


		console.log(user2)

	});

	var user3 = new User;
	user3.date = date3;
	user3.gender = '3';
	user3.save(function (err, obj) {


		console.log(user3)

	});


	//User.find().sort({date :-1}).exec(function(err, users) {
	//
	//	users.forEach(function(user) {
	//		console.log(user);
	//	});
	//});

}

util.getNowFormatDate = function () {
	var date = new Date();

	var seperator1 = "-";
	var seperator2 = ":";
	var month = date.getMonth() + 1;
	var strDate = date.getDate();
	if (month >= 1 && month <= 9) {
		month = "0" + month;
	}
	if (strDate >= 0 && strDate <= 9) {
		strDate = "0" + strDate;
	}
	var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate;

	//var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
	//	+ " " + date.getHours() + seperator2 + date.getMinutes()
	//	+ seperator2 + date.getSeconds();
	return currentdate;
};

util.getFilePath = function (filepath, next) {

	//创建文件夹存储图片
	fs.exists(filepath, function (exists) {

		if (!exists) {

			mkdirp(filepath, function (err) {

				if (!err) {

					console.log(filepath + ' not exists');
					next();
				}
			});

		} else {
			console.log(filepath + ' exists');
			next();
		}
	});
};

// 	原文链接：https://blog.csdn.net/seavers/article/details/84292222
util.stringSimilarity = function (x, y) {

	return Levenshtein(x, y) > 0.7;
}

util.stringSimilaritySecond = function (x, y) {

	return Levenshtein(x, y);
}

/** 
	* 　
	* 检查两个字符串的相似度
	* 可以用在 DNA分析 　　拼字检查 　　语音辨识 　　抄袭侦测 
	* @createTime 2012-1-12 
	*/
function Levenshtein(s, t, f) {
	if (!s || !t) {
		return 0
	}
	var l = s.length > t.length ? s.length : t.length
	var n = s.length
	var m = t.length
	var d = []
	f = f || 3
	var min = function (a, b, c) {
		return a < b ? (a < c ? a : c) : (b < c ? b : c)
	}
	var i, j, si, tj, cost
	if (n === 0) return m
	if (m === 0) return n
	for (i = 0; i <= n; i++) {
		d[i] = []
		d[i][0] = i
	}
	for (j = 0; j <= m; j++) {
		d[0][j] = j
	}
	for (i = 1; i <= n; i++) {
		si = s.charAt(i - 1)
		for (j = 1; j <= m; j++) {
			tj = t.charAt(j - 1)
			if (si === tj) {
				cost = 0
			} else {
				cost = 1
			}
			d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
		}
	}
	let res = (1 - d[n][m] / l)
	let sim = res.toFixed(f)
	return sim
}


module.exports = util;
