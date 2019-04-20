/**
 * Created by chaowei on 2017/5/15.
 */
var express = require('express');
var app = express();
var session = require("express-session");
var path = require('path');
var cons = require('consolidate');

var bodyParser = require('body-parser');

var fs = require('fs');
var OCR;
// var OCR = require('./ocr');
var url = require('url');

var users = require('./route/users');
var api = require('./route/api');
var finder = require('./h_route/house_finder');
var vfinder = require('./h_route/vfinder');

var crypto = require('crypto');
var moment = require('moment');

// var request = require('request');

var MailUtil = require('./mail');
var Util = require('./util');
var Settings = require('./settings');
// view engine setup
app.engine('html', cons.swig);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
var serveStatic = require('serve-static');

// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');
// app.use(express.static(path.join(__dirname, 'public')));
// // app.use(express.static(path.resolve(__dirname, './dist')));
// app.use(serveStatic("/Users/didi/dev/GitHome/other/pashanhu/dist"));
// // app.use(serveStatic("/home/ubuntu/dev/GitHome/Vue/dist"));
// // app.get('*', function(req, res) {
// //     const html = fs.readFileSync(path.resolve(__dirname, './dist/index.html'), 'utf-8')
// //     res.send(html)
// // });


app.use('/static', serveStatic('/home/ubuntu/dev/GitHome/Vue/dist/static/'));
app.get('/', function(req,res) {
    res.sendFile('index.html', { root: '/home/ubuntu/dev/GitHome/Vue/dist' });
});

var User = require('./model/user');
var PayInfo = require('./model/payinfo');
var FriendFinder = require('./model/hoursefriend_finder');
var Vip = require('./model/vip');
var AppUserInfo = require('./model/appuserInfo');

var DownUrl = require('./model/downurl');

var PAGE_NUM = 25;

// 大于两分匹配
var MATCH_SCORE = 0.2;

app.use(session({
    secret: 'weichaos5210',
    cookie: {
        maxAge: 30 * 1000 * 100	//过期时间，一过期mongodb自动删除。
    }
}));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Expose-Headers", "X-My-Custom-Header, X-Another-Custom-Header");
    next(); // make sure we go to the next routes and don't stop here
});

app.use('/a/api', api);
app.use('/51finder', finder);
app.use('/51vfinder', vfinder);
app.use('users', users);
app.use(express.static('routes'));

// var elasticsearch = require('elasticsearch');

var indexname = 'hourse_datasource';
var typename = 'hourse_type';


var esClient;
// var esClient = new elasticsearch.Client({
//     host: 'localhost:9200',
//     log: 'error'
// });



var tokens = require('./tokens');
var headertest = {
    'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US; rv:1.9.1.6) Gecko/20091201 Firefox/3.5.6'
}

//noinspection BadExpressionStatementJS

app.locals.server_host = "http://127.0.0.1:3000";

var multer = require('multer');

var uploadDir = './public/apppay/upload/';
var upload = multer({dest: uploadDir}).single('logo');

function checkPayInfo(paycontent, callback) {
//
//    微信支付
//    付款金额
//    ￥10.00
//    当前状态
//    已转账
//    收款方
//    曾经的我。
//    收款方备注
//    二维码收款

//    转账时间
//    2017-10-0511:36:45
//    支付方式
//    零钱
//    转账单号10000503011710050007003288560202355
//    5
//    常见问题
//    投诉
    let jiaoyijilu_tag = '交易记录';
    let weixinzhifu_tag = '微信支付';
    let fukuanjine_tag = '付款金额';
    // money
    let shoukuanfang_tag = '收款方';
    // 收款方昵称
    let shoukuanfangbeizhu_tag = '收款方备注';
    let erweimashoukuan_tag = '二维码收款';
    let dangqianzhuangtai_tag = '当前状态';
    let yizhuanzhang_tag = '已转账';
    let zhuangzhangshijian_tag = '转账时间';
    // datetime
    let zhifufangshi_tag = '支付方式';
    //lingqian
    let zhuanzhangdanhao_tag = '转账单号';
    let changjianwenti_tag = '常见问题';

    let money;
    let shoukuan_name;
    let datetime;
    let orderid = '-1';

    let status = 0;

    let content = '';
    paycontent['words_result'].forEach((item) => {
        let word = item['words'];

        content += word + '|';
        if (word == weixinzhifu_tag) {
            status = 2;
            console.log('1');

        } else {

            if (1 <= status <= 14) {

                switch (status) {
                    case 1:
                        if (word == weixinzhifu_tag) {
                            status = 2;
                            console.log('2');
                        } else {
                            console.log('2fail');
                            status = -1;
                        }
                        break;
                    case 2:
                        if (word == fukuanjine_tag) {
                            status = 3;
                            console.log('3');
                        } else {
                            status = -1;
                        }
                        break;
                    case 3:
                        money = word.substring(1); // 判断是否为数字
                        console.log('4 before :' + money);

                        if (money < 1) {
                            status = -1;
                            break;
                        }
                        if (money.indexOf(".") >= 0) {

                        } else {
                            if (money.length >= 3) {
                                money = money / 100;
                            }
                        }
                        console.log('4:' + money);
                        status = 4;
                        break;
                    case 4:
                        if (word == dangqianzhuangtai_tag) {
                            status = 5;
                            console.log('5');
                        } else {
                            status = -1;
                        }
                        break;
                    case 5:
                        if (word == yizhuanzhang_tag) {
                            status = 6;
                        } else {
                            status = -1;
                        }
                        break;
                    case 6: // 跳过4 原因：收款方 三个字未识别
                        // if (word == shoukuanfang_tag) {
                        //     status = 5;
                        // } else {
                        //     status = -1;
                        // }
                        //
                        status = 7;

                        break;
                    case 7:
                        shoukuan_name = word; // 收款人名判断
                        console.log('8： ' + shoukuan_name);
                        status = 8;
                        break;
                    case 8:
                        if (word == shoukuanfangbeizhu_tag) {
                            status = 9;
                            console.log('9');
                        } else {
                            status = -1;
                        }
                        console.log('9： ' + word);
                        break;
                    case 9:
                        if (word == erweimashoukuan_tag) {
                            status = 10;
                            console.log('10');
                        } else {
                            status = -1;
                        }
                        console.log('10： ' + word);
                        break;

                    case 10:
                        if (word == zhuangzhangshijian_tag) {
                            status = 11;
                            console.log('11');
                        } else {
                            status = -1;
                        }
                        break;
                    case 11:

                        datetime = word.substring(0, 10) + ' ' + word.substring(10); // 格式判断

                        console.log('datetime:' + datetime);
                        status = 12;
                        break;
                    case 12:
                        if (word == zhifufangshi_tag) {
                            status = 13;
                            console.log('13');
                        } else {
                            status = -1;
                        }
                        break;
                    case 13:
                        let fangshi = word;
                        console.log('13');
                        status = 14;
                        break;
                    case 14:
                        orderid = word;
                        console.log('14 ' + orderid);
                        status = 15;
                        break;
                    case 15:
                        if (word == changjianwenti_tag) {
                            console.log('15');
                        } else {
                            orderid += word;
                            // let num = word; // 数字验证

                        }
                        status = 16;
                        break;
                    case 16:
                        // do nothing
                        break;
                    default:
                        console.log('d-1');
                        status = 0;
                        break;
                }
            }
        }

    });


    console.log(status);

    if (orderid != '-1') {
        orderid = orderid.split('号')[1];
    }
    if (status == 16) {

        callback(0, money, shoukuan_name, datetime, orderid, content);

        return true;
    }

    callback(1, money, shoukuan_name, datetime, orderid, content);


    return false;

}

function getviptime(money) {
    if (5 <= money < 19) {
        return 7;
    }

    if (19 <= money < 65) {
        return 30;
    }

    if (65 <= money < 100) {
        return 180;
    }

    if (money >= 100) {
        return 360;
    }
}

app.post('/appget', function (req, res) {


    AppUserInfo.find({}, function (err, services) {

        console.log(services);
        return res.json({
            msg: 'success',
            code: 0,
            data: services
        });
    });
})

// 单图上传
app.post('/a/api/upload', function (req, res, next) {

    console.log('上传图片');

    //文件上传
    upload(req, res, function (err) {

        let deviceid = req.body['deviceid'];
        let username = req.body['username'];

        console.log("deviceid:" + deviceid + " " + username);


        if (err) {
            console.error(err.message);
        } else {

            var filepath = uploadDir + Util.getNowFormatDate();
            var filename = new Date().getTime() + '.jpg'; // 时间戳表示文件名

            //获取文件的名称，然后拼接成将来要存储的文件路径
            var des_file = filepath + '/' + filename;

            Util.getFilePath(filepath, function () {

                //读取临时文件
                fs.readFile(req.file.path, function (err, data) {
                    //将data写入文件中，写一个新的文件
                    fs.writeFile(des_file, data, function (err) {

                        if (err) {
                            console.error(err.message);
                        } else {
                            //删除临时文件
                            fs.unlink(req.file.path, function (err) {
                                if (err) {
                                    console.error(err.message);
                                } else {
                                    console.log('delete ' + req.file.path + ' successfully!');
                                }
                            });
                        }

                        OCR.ocr(des_file, function (words) {
                            console.log('ocr:' + words);
                            var json = JSON.parse(words);

                            //  callback(0, money, shoukuan_name, datetime, orderid);
                            let succ = checkPayInfo(json, function (success, money, shoukuanname, datetime, orderid, content) {

                                let reponse;
                                if (success === 0) {


                                    PayInfo.findOne({orderid: orderid}, function (err, payinfo) {

                                        if (payinfo) {
                                            console.log('已经上传过')
                                            let reponse = {
                                                code: -2,
                                                msg: '已经上传过'
                                            };

                                            res.end(JSON.stringify(reponse));

                                        } else {
                                            console.log('没有上传过')
                                            //var schema = new mongoose.Schema({
                                            //    username: String, // 用户名
                                            //    orderid: String, // 微信支付生产的订单id
                                            //    totalmoney: String, // 钱数
                                            //    filename: String, // 支付详情图片文件路径
                                            //    datetime: String, // 支付日期
                                            //    content: String, // 支付图片扫描内容
                                            //    checked: {type : Boolean, default: false} // 是否人工审核过
                                            //});

                                            if (money < 1) {
                                                console.log("付款金额不对")
                                                reponse = {
                                                    code: -1,
                                                    msg: '付款金额不对:' + money,
                                                    data: {
                                                        money: money
                                                    }
                                                };

                                                res.end(JSON.stringify(reponse));
                                            } else {

                                                let today = new Date();

                                                let paytime = new Date(Date.parse(datetime.replace("-", "/")));


                                                console.log('付款金额正确');

                                                let minus = (today - paytime) / (1000 * 60 * 60);
                                                if (minus < 0) {
                                                    let response = {
                                                        msg: '支付日期有误',
                                                        code: -1
                                                    };
                                                    res.end(JSON.stringify(response));

                                                } else {

                                                    if (false) {
                                                        let response = {
                                                            msg: '支付日期已失效，请重新支付会员费用，提交支付截图凭证',
                                                            code: -1
                                                        };
                                                        res.end(JSON.stringify(response));

                                                    } else {

                                                        var newPayinfo = new PayInfo({
                                                            username: username,
                                                            orderid: orderid,
                                                            totalmoney: money,
                                                            filename: filename,
                                                            datetime: datetime,
                                                            content: content
                                                        });

                                                        newPayinfo.save(function (err, obj) {

                                                            console.log('save:' + obj);
                                                        });


                                                        let days = getviptime(money);

                                                        AppUserInfo.findOne({username: username}, function (err, vipuser) {


                                                            if (vipuser) {
                                                                console.log('appuserinfo:' + vipuser);
                                                                if (vipuser.deviceid !== deviceid) {

                                                                    let response = {
                                                                        msg: '请用注册的手机登录账号',
                                                                        code: -1001
                                                                    };
                                                                    console.log('deviceid not match:');
                                                                    res.end(JSON.stringify(reponse));
                                                                    return;
                                                                }

                                                                let vuser = vipuser;
                                                                vuser.vipcode = '0';
                                                                vuser.qrcode = '';
                                                                vuser.username = username;
                                                                vuser.time = days;
                                                                vuser.date = new Date();

                                                                vuser.save(function (err, vu) {

                                                                    if (vu) {

                                                                        let tokendata = {
                                                                            id: vu._id,
                                                                            username: vu.username,
                                                                            deviceid: deviceid
                                                                        };

                                                                        let token = Util.genToken(tokendata);
                                                                        console.log('支付成功：');

                                                                        let re = {
                                                                            code: 0,
                                                                            msg: '支付成功',
                                                                            data: {
                                                                                id: vu._id,
                                                                                token: token,
                                                                                deadline: days,
                                                                                shadow: '',
                                                                                money: money
                                                                            }
                                                                        };

                                                                        AppUserInfo.findOne({username: username}, function (err, a){
                                                                            if (a) {
                                                                                console.log("AppUserInfo:save:" + a + " " + a.username);
                                                                            }
                                                                        });


                                                                        console.log(vu);

                                                                        res.end(JSON.stringify(re));

                                                                    } else {
                                                                        console.log('支付失败：');
                                                                    }

                                                                    if (err) {

                                                                        let response = {
                                                                            msg: '内部错误',
                                                                            code: -1
                                                                        };
                                                                        res.end(JSON.stringify(response));
                                                                    }
                                                                });
                                                            } else {
                                                                let response = {
                                                                    msg: '内部错误',
                                                                    code: -1
                                                                };
                                                                res.end(JSON.stringify(response));
                                                            }


                                                        });


                                                    }
                                                }


                                            }

                                        }


                                    });

                                    console.log('ocr parse words:' + money + ' ' + shoukuanname + ' ' + datetime + ' ' + orderid);
                                } else {
                                    reponse = {
                                        code: -1,
                                        msg: '图片格式错误'
                                    };

                                    //删除临时文件
                                    fs.unlink(des_file, function (err) {
                                        if (err) {
                                            console.error(err.message);
                                        } else {
                                            console.log('delete ' + req.file.path + ' successfully!');
                                        }
                                    });

                                    res.end(JSON.stringify(reponse));
                                }
                            });
                            //console.log('ocr words:' + words);
                        });

                    });

                });

            });
        }
    });

});

//用户点击注册按钮
app.post('/reg', function (req, res) {
    //if(req.body['password']!= req.body['passwordconf']){
    //    req.session.error="两次密码不一致";
    //    return res.redirect('/reg');
    //}
    var md5 = crypto.createHash('md5');

    var password = md5.update(req.body['password']).digest('base64');
    var newUser = new User({
        username: req.body['username'],
        password: password,
        pwd: req.body['password']
    });

    User.findOne({username: newUser.username}, function (err, user) {

        if (user) {
            err = "用户名已经存在";
            return res.json({
                msg: err,
                code: -1
            });
        }
        if (err) {
            return res.json({
                msg: '内部错误',
                code: -1
            });
        }

        newUser.save(function (err) {
            if (err) {
                return res.json({
                    msg: '内部错误',
                    code: -1
                });
            }
            req.session.isLogined = true;
            req.session.username = newUser.username;
            return res.json({
                msg: '注册成功',
                code: 0
            });
        });
    });
});

app.post('/modify_pwd', function (req, res) {

    console.log('modify_pwd');

    if (req.body['password'] != req.body['repassword']) {
        console.log('modify_pwd oo');
        req.session.error = "两次新密码不一致";
        return res.redirect('/modify_pwd');
    }
    //var md5=crypto.createHash('md5');


    var oldpassword = crypto.createHash('md5').update(req.body['oldpassword']).digest('base64');
    var repassword = crypto.createHash('md5').update(req.body['repassword']).digest('base64');
    var username = req.session.username;

    User.findOne({name: username, password: oldpassword}, function (err, user) {
        if (user) {
            console.log(' 存在此用户');
            user.password = repassword;
            user.pwd = req.body['repassword'];
            user.save(function (err) {
                if (!err) {
                    console.log('modify_pwd success');
                    req.session.isLogined = true;
                    req.session.username = username;
                    req.session.success = "更新成功";
                    res.redirect('/');
                } else {
                    console.log('modify_pwd error');
                }

            });
        } else {
            console.log(' 没有此用户');
            req.session.error = '没有此用户';
            res.redirect('/modify_pwd');
        }

    });

});


app.post('/login', function (req, res) {
    var md5 = crypto.createHash('md5');

    console.log('login');
    var password = md5.update(req.body['password']).digest('base64');
    User.findOne({username: req.body['username']}, function (err, user) {
        console.log('login:' + user);
        if (!user.username) {
            err = "用户不存在";
            return res.json({
                msg: err,
                code: -2
            });
        }
        if (err) {
            return res.json({
                msg: '内部错误',
                code: -1
            });
        }

        if (user.password != password) {
            return res.json({
                msg: '账号密码错误',
                code: -2
            });
        }


        var tokendata = {
            id: user._id,
            username: user.username
        };
        var token = Util.genToken(tokendata);

        req.session.username = user.username;
        req.session.isLogined = true;
        return res.json({
            msg: '登录成功',
            code: 0
        });
    });
});
app.get('/logout', function (req, res) {

    User.update({name: req.session.user.name}, {$set: {is_used: false}}, function (err, user) {

        if (!err) {
            console.log('user udpate success ' + user.is_used ? "true" : "false");

        } else {
            console.log('user udpate err ' + err);

        }
    });

    req.session.username = null;
    req.session.isLogined = false;
    res.redirect('/');
});

app.get('/friendfinder/find', function (req, res) {

    FriendFinder.find({is_done: true}, function (err, friends) {

        if (friends) {

            friends.sort(function (s, t) {
                return Util.getDays(s.checkin_date, t.checkin_date);
            });

            if (req.session.isLogined === true) {

                FriendFinder.find({username: req.session.username}, function (err, fds) {

                    if (fds) {

                        res.render('findperson', {
                            postfriends: fds,
                            friendlist: friends,
                            code: 0
                        });
                    } else {
                        res.render('findperson', {
                            postfriends: [],
                            friendlist: friends,
                            code: 0
                        });
                    }
                })
            } else {
                res.render('findperson', {
                    postfriends: [],
                    friendlist: friends,
                    code: 0
                });
            }

        }

    });

});

app.get('/users/getperson', function (req, res) {

    var name = req.session.user.username;

    if (name) {
        User.findOne({username: name}, function (err, user) {

            if (!err) {

                res.render('personal', {code: 0, username: user.username, gender: user.gender});
            } else {
                res.render('personal', {code: -1})
            }
        })
    }
});


//username:String,//邮箱或者手机号 唯一标识
//    personNum:Number,
//    workplace:String,
//    workplace_geo:String,//工作地点经纬度字符串 精度|维度
//    homeplace:String,
//    homeplace_geo:String,//期望居住地点经纬度字符串 精度|维度
//    gender:Number,//1:男;2:女 登录情况下自动根据注册用户性别数据填充
//    checkin_date:String, //入住日期
//    money_rang:String,//租金范围
//    want_gender:Number,//1:男;2:女;0:无要求
//    call_number:String,//联系方式 手机或者邮箱
//    others:String,//微信/QQ/个人介绍等等
//    is_done:{type : Boolean, default: true} //任务进行中

app.get('/matchfriend', function (req, res) {
    console.log('matchfriend ' + req.query.username);

    var id = '';
    FriendFinder.findOne({_id: id}, function (err, finder) {

        if (finder) {
            FriendFinder.find({is_done: true}, function (err, friends) {

                var array = [];
                if (friends) {
                    friends.forEach(function (friend) {
                        let score = Util.compare(finder, friend);

                        if (score > MATCH_SCORE) {
                            array.push({score: score, friend: friend});
                        }
                    });

                    array.sort(function (s, t) {
                        if (s.score < t.score) {
                            return 1;
                        }
                        if (s.score > t.score) {
                            return -1;
                        }
                        return 0;
                    });

                    console.log('matching -> ');
                    array.forEach((item) => {
                        console.log('score:' + item.score + ' friend:' + item.friend);
                    });


                    return res.json({
                        friendlist: array,
                        code: 0
                    });
                }

            });
        }

    });


});

app.get('/hoursefriend/match', function (req, res) {
    if (req.session.isLogined !== true) {
        return res.json({
            msg: "没有登录",
            code: -100
        });
    }


});

app.post('/hoursefriend/delete', function (req, res) {

    if (req.session.isLogined !== true) {
        return res.json({
            msg: "没有登录",
            code: -100
        });
    }


    FriendFinder.remove({}, function (err, obeject) {

        if (!err) {
            console.log('UserAcount remove success');
        } else {
            flag = true;
        }

    });

})

app.post('/hoursefriend/create', function (req, res) {

    console.log('/hoursefriend/create');
    var finder = new FriendFinder;

    if (req.session.isLogined !== true) {
        return res.json({
            msg: "没有登录",
            code: -100
        });
    }

    var persion_num = req.body['person_num'];
    var workplace = req.body['workplace'];
    var workplace_geo = req.body['workplace_geo'];
    var homeplace = req.body['homeplace'];
    var homeplace_geo = req.body['homeplace_geo'];
    var money_range = req.body['money_range'];
    var checkin_date = req.body['checkin_date'];
    var current_gender = req.body['current_gender'];
    var other_gender = req.body['other_gender'];
    var call_number = req.body['call_number'];
    var others = req.body['others'];

    if (persion_num <= 0
        || workplace == ''
        || homeplace == ''
        || checkin_date == ''
        || call_number == '') {
        return res.json({
            msg: "输入数据不完整",
            code: -101
        });
    }

    finder.personNum = persion_num;
    finder.workplace = workplace;
    finder.homeplace = homeplace;
    finder.homeplace_geo = homeplace_geo;
    finder.workplace_geo = workplace_geo;
    finder.money_rang = money_range;
    finder.gender = current_gender;
    finder.want_gender = other_gender;
    finder.call_number = call_number;
    finder.others = others;
    finder.checkin_date = checkin_date;

    finder.save(function (err, find) {

        if (!err) {

            console.log('current -> ' + find);

            var array = [];
            FriendFinder.find({is_done: true}, function (err, friends) {

                if (friends) {
                    friends.forEach(function (friend) {
                        let score = Util.compare(finder, friend);

                        if (score > MATCH_SCORE) {
                            array.push({score: score, friend: friend});
                        }
                    });

                    array.sort(function (s, t) {
                        if (s.score < t.score) {
                            return 1;
                        }
                        if (s.score > t.score) {
                            return -1;
                        }
                        return 0;
                    });


                    FriendFinder.find({username: req.session.username}, function (err, fds) {

                        if (fds) {
                            return res.json({
                                current_friend_id: find._id,
                                postfriends: fds,
                                friendlist: array,
                                code: 0
                            });
                        } else {
                            return res.json({
                                code: -1,
                                msg: 'error'
                            });
                        }
                    })

                }

            });

        }
    });

});


app.get('/ensurepwd', function (req, res) {

    console.log('ensurepwd ' + req.query.username);
    res.render('ensurepwd', {username: req.query.username});
});

app.get('/login', function (req, res) {
    res.render('login', {title: "用户登陆"});
});

app.get('/match', function (req, res) {
    console.log('match');
    res.render('match');
});


app.post('/findAndUpdatePwd', function (req, res) {

    var username = req.body['username'];
    var pwd = req.body['password'];
    var md5 = crypto.createHash('md5');

    var password = md5.update(pwd).digest('base64');
    User.findOne({username: username}, function (err, user) {

        if (user) {
            User.update({username: user.username}, {$set: {password: password}}, function (err, u) {

                if (user) {

                    console.log('update success user ' + u.password);
                    res.redirect('login');
                }
            });

        } else {
            console.log('findAndUpdatePwd not found user ');
        }
    });


});


app.post('/findpwd', function (req, res) {

    // 邮箱就是用户名
    var reset_mail = req.body['email'];
    console.log('findpwd post ' + reset_mail);

    if (reset_mail) {
        User.findOne({username: reset_mail}, function (err, user) {

            if (!err) {

                if (user) {

                    console.log('findAndUpdatePwd');
                    var name = reset_mail;

                    var to = reset_mail;
                    var from = '13717535178@163.com';

                    var subject = '[找回密码]';

                    var time = 24;

                    var randkey = Util.randPwd();

                    var sign = Util.sign(name, time, randkey);
                    var md5 = Util.MD5(sign);
                    var url = 'sid=' + md5 + '&username=' + name;
                    var host = Settings.server_host + '/ensurepwd';
                    var text = host + '?' + url;

                    MailUtil.send(from, subject, to, text);

                    return res.json({
                        code: 0,
                        msg: '申请成功,请前往邮箱:' + reset_mail + ',重置密码'
                    });
                } else {
                    return res.json({
                        code: -1,
                        msg: '该邮箱没有注册'
                    });
                }

            } else {
                return res.json({
                    code: -2,
                    msg: err.toString()
                })
            }
        })
    }

});

app.get('/1micfznU', function (req, res) {

    DownUrl.findOne({used: true}, function (err, down) {

        if (down) {
            res.redirect(down.url);

        } else {
            res.redirect(Settings.appurl);
        }
    });

});


//用户进入注册页面
app.get('/register', function (req, res) {
    res.render('register', {title: "用户注册"});
});
//用户点击注册按钮
app.post('/register', function (req, res) {
    if (req.body['password'] != req.body['passwordconf']) {
        req.session.error = "两次密码不一致";
        return res.redirect('/register');
    }
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.password).digest('base64');
    var newUser = new User({
        username: req.body['username'],
        password: password
    });
    User.findOne({username: newUser.username}, function (err, user) {
        if (user) {
            err = "用户名已经存在";
        }
        if (err) {
            req.session.error = err;
            return res.redirect('/register');
        }
        newUser.save(function (err) {
            if (err) {
                req.session.error = err.message;
                return res.redirect('/register');
            }
            req.session.loginUser = newUser;
            req.session.success = "注册成功";
            res.redirect('/');
        });
    });
});


//router.post('/users/create', isLogin);
app.post('/users/create', function (req, res) {

    var user = new User;


    console.log(req.body['username']);

    //var useracount = new UserAcount;
    //useracount.username = req.session.user.name;
    //useracount.type_id = req.body.type_id;

    user.username = req.body['username'];
    user.password = req.body['password'];
    user.save(function (err, obj) {

        if (err) {
            console.log(err.message);
        } else {
            console.log(obj);
        }


    });

    console.log(user);

    res.json({
        code: 0,
        user: user
    })


});

app.get('/', function (req, res) {

    console.log('/');
    res.render('launch', {
        isLogined: req.session.isLogined,
        username: req.session.username || '',
        server_host: 'http://127.0.0.1:3000'
    });
});

//GET /_search
//{
//    "query" : {
//    "filtered" : {
//        "filter" : { "term" : { "user_id" : 1 }}
//    }
//},
//    "sort": { "date": { "order": "desc" }}
//}

//"sort" : [
//    { "post_date" : {"order" : "asc"}},
//    "user",
//    { "name" : "desc" },
//    { "age" : "desc" },
//    "_score"
//],
//    "query" : {
//    "term" : { "user" : "kimchy" }
//}
app.get('/home', function (req, res) {


    console.log('/home');

    return;

    let body = {
        query: {
            match_all: {}
        },
        sort: [{datatime: {order: 'desc'}}]
    };

    var array = [];


    esClient.search({
        _index: indexname,
        _type: typename,
        scroll: '2000s',
        body: body
    }, function getMoreUntilDone(error, response) {

        if (response.hits && response.hits.hits) {

            response.hits.hits.forEach((hit, index) => {
                    array.push({
                        'title': hit._source.title,
                        'content': hit._source.content,
                        'hrefArray': hit._source.hrefArray,
                        'hourse_id': hit._id,
                        'datatime': hit._source.datatime
                    })
                }
            );

            if (PAGE_NUM > array.length && response.hits.total > PAGE_NUM) {
                //        // now we can call scroll over and over
                console.log('search more ' + response.hits.total)
                esClient.scroll({
                    scrollId: response._scroll_id,
                    scroll: '2000s'
                }, getMoreUntilDone);
            } else {

                var more = -1;
                var scrollId = -1;
                if (response.hits.total > PAGE_NUM) {
                    scrollId = response._scroll_id;
                    more = 0;
                }
                res.render('index', {'index_type': 0, 'hourselist': array, 'scrollid': scrollId, 'more': more});
            }
        }

    });
});

app.get('/search_more', function (req, res) {
    var scrollId = req.query.scrollId;
    console.log('/search_more');
    var array = [];
    console.log('search_more ' + scrollId);
    esClient.scroll({
        scrollId: scrollId,
        scroll: '2000s'
    }, function getMoreUntilDone(error, response) {
        if (error) {
            return res.json({
                code: 0,
                hourselist: array
            });
        } else {

        }

        console.log('search_more response:' + response);

        if (response.hits && response.hits) {

            response.hits.hits.forEach((hit, index) => {

                    console.log('hit datetime:' + hit.datatime);
                    array.push({
                        'title': hit._source.title,
                        'content': hit._source.content,
                        'hrefArray': hit._source.hrefArray,
                        'hourse_id': hit._id,
                        'datatime': hit._source.datatime
                    })
                }
            );


            if (PAGE_NUM >= array.length && response.hits.total > PAGE_NUM) {
                //        // now we can call scroll over and over
                esClient.scroll({
                    scrollId: response._scroll_id,
                    scroll: '10000s'
                }, getMoreUntilDone);
            } else {

                var scrollId = -1;
                var more = -1;
                if (response.hits.total > PAGE_NUM) {
                    scrollId = response._scroll_id;
                    more = 0;
                }
                //res.render('index', {'hourselist': array, 'scrollid': scrollId});
                console.log('search more scrollId: ' + scrollId + ' more size:' + array.length);
                return res.json({
                    code: 0,
                    hourselist: array,
                    scrollid: scrollId,
                    more: more
                });
            }

        }

    });
});

/**
 * {
"query": {
    "multi_match": {
        "query" : "海淀 西二旗",
        "type": "best_fields",
        "fields" : ["title", "content"],
"tie_breaker": 0.3
    }
  },
  "highlight" : {
        "pre_tags" : ["<tag1>"],
        "post_tags" : ["</tag1>"],
        "fields" : {
            "content" : {},
 "title" : {}
        }
    }
}
 */
//
//var exp = null;
//if (typeof exp == "null")
//{
//    alert("is null");
//}
app.get('/search_match', function (req, res) {

    console.log('/search_match');
    var query_words = req.query.match_words;

    console.log(query_words);

    if (typeof query_words == 'null') {
        return;
    }

    // first we do a search, and specify a scroll timeout
    //esClient.search({
    //    index: indexname,
    //    type:typename,
    //    // Set to 30 seconds because we are calling right back
    //    scroll: '30s',
    //    fields: ['title', 'content'],
    //    q: query_words
    //}, function getMoreUntilDone(error, response) {
    //    // collect the title from each response
    //
    //    response.hits.hits.forEach((hit) =>{
    //            //if(hit.fields['title']){
    //                console.log(hit)
    //            //}
    //    }
    //
    //
    //        //array.push({
    //        //    'title':hit._source.title,
    //        //    'content':hit._source.content,
    //        //    'hrefArray':hit._source.hrefArray,
    //        //    'href': hit._source.href,
    //        //    'hourse_id':hit._id,
    //        //    'datatime':hit.datatime
    //        //})
    //    );
    //
    //    if (response.hits.total !== array.length) {
    //        // now we can call scroll over and over
    //        esClient.scroll({
    //            scrollId: response._scroll_id,
    //            scroll: '30s'
    //        }, getMoreUntilDone);
    //    } else {
    //        console.log('every "test" title', array);
    //
    //        res.render('index',{'hourselist':array});
    //    }
    //});

    let body = {
        query: {
            multi_match: {
                query: query_words,
                type: 'phrase_prefix',
                fields: ['title', 'content']
            }
        },
        sort: [{datatime: {order: 'desc'}}],
        highlight: {
            pre_tags: ['<em>'],
            post_tags: ['</em>'],
            fields: {'title': {}, 'content': {}}
        }
    };

    var array = [];
    esClient.search({_index: indexname, _type: typename, body: body}, function getMoreUntilDone(error, results) {


//http://stackoverflow.com/questions/21782358/search-highlight-in-elasticsearch-javascript
        if (results.hits && results.hits) {

            results.hits.hits.forEach((hit, index) => {

                    var title = '';
                    var content = '';
                    if (hit.highlight.title) {
                        title = hit.highlight.title;
                    } else {
                        title = hit._source.title;
                    }

                    if (hit.highlight.content) {
                        content = hit.highlight.content;
                    } else {
                        content = hit._source.content
                    }

                    array.push({
                        'title': title,
                        'content': content,
                        'hrefArray': hit._source.hrefArray,
                        'href': hit._source.href,
                        'hourse_id': hit._id,
                        'datatime': hit._source.datatime
                    })
                }
            );

            if (PAGE_NUM > array.length && results.hits.total > PAGE_NUM) {
                //        // now we can call scroll over and over
                console.log('search more ' + results.hits.total)
                esClient.scroll({
                    scrollId: results._scroll_id,
                    scroll: '2000s'
                }, getMoreUntilDone);
            } else {

                var scrollId = -1;
                var more = -1;
                if (results.hits.total > PAGE_NUM) {
                    scrollId = results._scroll_id;
                    more = 0;
                }

                res.render('index', {
                    'index_type': 1,
                    'hourselist': array,
                    'scrollid': scrollId,
                    'query_word': query_words,
                    'more': more
                });
            }
        }


    })
});

app.get('/hourse_detail', function (req, res) {

    console.log('/hourse_detail');
    var hourseId = req.query.hourse_id;
    let query_word = req.query.query_word;

    console.log(hourseId);

    let body = {
        query: {
            match: {
                _id: hourseId
            }
        }
    };

    esClient.search({_index: indexname, _type: typename, body: body})
        .then(results => {

            var object = {};

            console.log('before ' + results.hits.hits.length);

            results.hits.hits.forEach((hit, index) =>
                object = {
                    'title': hit._source.title.replace(query_word, '<em>' + query_word + '</em>'),
                    'content': hit._source.content.replace(query_word, '<em>' + query_word + '</em>'),
                    'hrefArray': hit._source.hrefArray,
                    'id': hit._id
                }
            );

            res.render('hourse_detail', {'hourse': object});

        })

});


function isLogin(req, res, next) {
    if (!req.session.user) {

        return res.redirect('/');
    }
    next();
}


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;

    res.send('404');
});

app.use(function (error, req, res, next) {
    if (!error) {
        next();
    } else {
        console.error(error.stack);
        res.send(500);
    }
});

var superagent = require("superagent");
var cheerio = require("cheerio");

Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
};
Array.prototype.remove = function(val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};

function refresh_tokens() {
    superagent.get("http://wx.deepba.com/paper/news/bxsh/")
        .set('header', headertest)
        .end(function (error, data) {
            if (error) {
                console.log("error exception occured !" + error.toString());
                return;
            }
            var $ = cheerio.load(data.text, {decodeEntities: false});    //注意传递的是data.text而不是data本身
            //console.log('catch ' +$('.topic-doc .topic-content p').html());

            var html = '';

            $('.img-thumbnail').each(function (idx, element) {

                var $element = $(element);
                html += $element.attr("src")
            });

            if (html === '') {
                return;
            }

            var query =  url.parse(html, true);
            if (query) {

                var token = query.query.token;
                if (token && !tokens.contains(token)) {
                    tokens.forEach((tk) => {
                        tokens.remove(tk);
                    });

                    tokens.push(token);
                    console.log('token:' + token);
                } else  {
                    console.log('exist token:' + token);
                }
            }

        });

}

app.listen(3000, '127.0.0.1', function () {

    refresh_tokens();

    setInterval(()=>{
        // http://wx.deepba.com/api/?token=916683115ec037256e841a7237231b64&id=39&txt1=hhtxt2=1

        // tokens.forEach((tk) => {
        //     var request_url = 'http://wx.deepba.com/api/?token='+ tk +'&id=39&txt1=hhtxt2=1';
        //     request(request_url, function (error, response, body) {
        //         if (response.statusCode === 200) {
        //             console.log(body); // 打印google首页
        //             console.log(tk + ' is good');
        //         } else {
        //             console.log(tk + ' is error');
        //             tokens.remove(tk);
        //         }
        //     });
        // });


        setTimeout(()=>{

            refresh_tokens();

        }, 60 * 1000);

    }, 20 * 60 *1000);

    console.log('Example app listening on port 3000!')
});

app.on('error', onError);

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

var House = require('./h_model/house');
let houseUrlMap = new Map();
House.find({}, (err, results) => {

    if (err) {
        console.log('[read house from db] error:' + err);
    }
    // if (results) {
    //     houseUrlMap.clear();
    //     let size = 0;
    //     let now_date = new Date();
    //     results.forEach((obj, ind) => {
    //
    //         if (houseUrlMap.has(obj.href) || ((moment(now_date).diff(moment(obj.date), "days")) > 16 && obj.from_type === 0) ) {
    //             House.remove({title: obj.title},(err, res)=>{
    //                 // if (!err) {
    //                 console.log(obj.title + ':' + JSON.stringify(res))
    //                 // }
    //             })
    //         } else {
    //             houseUrlMap.set(obj.href, ind);
    //         }
    //
    //         size = ind;
    //     });
    //
    //     console.log('[read house from db][houselist size : ' + (size + 1) + ']' + ' houseUrlMap size :' + houseUrlMap.size)
    // } else {
    //     console.log('[read house from db] no results');
    // }

});


module.exports = app;
