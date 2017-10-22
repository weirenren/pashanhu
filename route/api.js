/**
 * Created by chaowei on 2017/5/30.
 */
var express = require('express');
var router = express.Router();
var User = require('../model/user');
var Vip = require('../model/vip');
var Qrcode = require('../model/qrcode');
var Util = require('../util');
let Settings = require('../settings');
var AppUserInfo = require('../model/appUserInfo');
var Service = require('../model/service');
var crypto = require('crypto');

router.get('/checkversion', function (req, res) {

    //let packageName = req.body['packageName'];
    //let versionCode = req.body['versionCode'];


    console.log('checkversion');

    return res.json({
        code:0,
        data :{
            vcode: Settings.apkVersionCode,
            changelog: Settings.changelog,
            downurl: Settings.downurl,
            vname: Settings.vname
        }

    })

    //if (versionCode < Settings.apkVersionCode) { // todo 选择用户升级
    //    console.log('需要升级')
    //    return res.json({
    //        code:0,
    //        data :{
    //            vcode: Settings.apkVersionCode,
    //            changelog: Settings.changelog,
    //            downurl: Settings.downurl,
    //            vname: Settings.vname
    //        }
    //
    //    })
    //} else {
    //    console.log('不需要升级')
    //    return res.json({
    //        code:0,
    //        data :{
    //            vcode: Settings.apkVersionCode,
    //            changelog: Settings.changelog,
    //            downurl: Settings.downurl,
    //            vname: Settings.vname
    //        }
    //    })
    //}

});

//用户点击注册按钮
router.post('/register', function (req, res) {

    console.log('register');
    let username = req.body['username'];
    let deviceid = req.body['deviceid'];

    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body['password']).digest('base64');
    var newUser = new User({
        username: req.body['username'],
        password: password,
        pwd: req.body['password']
    });
    User.findOne({username: newUser.username}, function (err, user) {
        if (user) {
            return res.json({
                msg: newUser.username + ' 已经存在',
                code: -1
            });
        }
        if (err) {
            return res.json({
                msg: '内部错误',
                code: -1
            });
        }
        newUser.save(function (err, u) {
            if (err) {
                return res.json({
                    msg: '内部错误',
                    code: -1
                });
            }

            let app = new AppUserInfo();
            app.deviceid = deviceid;
            app.username = u.username;
            app.save(function (e,a) {

                if (a) {
                    console.log('注册成功' + a);
                    let tokendata = {
                        id: u._id,
                        username: u.username,
                        deviceid: deviceid
                    };
                    let token = Util.genToken(tokendata);
                    return res.json({
                        msg: '注册成功',
                        code: 0,
                        data: {
                            id: u._id,
                            username: u.username,
                            token: token
                        }
                    });
                }
            });

        });
    });
});

// 禁止用户会员
router.post('/forbid', function(req, res){

    let admincode = req.body['admincode'];
    if (Settings.admincode !== admincode) {
        return res.json({
            msg: '没有权限',
            code: -1
        });
    }

});
router.post('/deleteshadow', function(req, res){


    let admincode = req.body['admincode'];
    if (Settings.admincode !== admincode) {
        return res.json({
            msg: '没有权限',
            code: -1
        });
    }

    let shadowcode = req.body['shadowcode'];

    Qrcode.remove({qrcode: shadowcode}, function(err, obeject){

        if (obeject) {
            Qrcode.find({forbid:false}, function(err, qrcodes) {
                if (qrcodes) {
                    return res.json({
                        msg: '成功',
                        data : {
                            qrcodes: qrcodes
                        },
                        code: 0
                    });
                }
            })
        }
    });

});


router.get('/getqcode', function (req, res) {

    Qrcode.find({forbid:false}, function(err, qrs) {

        return res.json({
            data:{
                qrcodes: qrs
            },
            code: 0
        });

    });
});

router.post('/addshadow', function(req, res){


    let admincode = req.body['admincode'];
    if (Settings.admincode !== admincode) {
        return res.json({
            msg: '没有权限',
            code: -1
        });
    }

    let shadowcode = req.body['shadowcode'];
    let name = req.body['name'];
    Qrcode.findOne({qrcode: shadowcode}, function(err, vip) {

        if (vip) {
            return res.json({
                msg: '添加失败,二维码:' +shadowcode+ ' 已存在',
                code: -2
            });
        }


        let qrcode = new Qrcode();
        qrcode.name = name;
        qrcode.qrcode = shadowcode;

        qrcode.save(function(err, v){
            if (v) {
                console.log('addshadow-> success:' + v);
                return res.json({
                    msg: '添加成功',
                    data : {
                        qrcode: v
                    },
                    code: 0
                });
            }
        });
    });
});


//vipcode: String, // 激活码
//    qrcode: String, // 二维码
//    time: 10, // 剩余天数
router.post('/addvipcode', function(req, res){

    console.log('addshadow');

    let admincode = req.body['admincode'];
    if (Settings.admincode !== admincode) {
        return res.json({
            msg: '没有权限',
            code: -1
        });
    }

    let vipcode = req.body['vipcode'];
    let qrcode = req.body['qrcode'];
    let time = req.body['time'];
    Vip.findOne({vipcode: vipcode}, function(err, vip) {

        if (vip) {
            return res.json({
                msg: '添加失败,激活码:' +vipcode+ ' 已存在',
                code: -2
            });
        }

        let newVip = new Vip();
        newVip.vipcode = vipcode;
        newVip.qrcode = qrcode;
        newVip.time = time;

        newVip.save(function(err, v){
            if (v) {
                console.log('addshadow-> success:' + v);
                return res.json({
                    msg: '添加成功',
                    data : {
                        vip: v
                    },
                    code: 0
                });
            }
        });
    });
});


router.post('/getvips', function (req, res) {

    let admincode = req.body['admincode'];
    if (Settings.admincode !== admincode) {
        return res.json({
            msg: '没有权限',
            code: -1
        });
    }

    //todo 权限验证 只有管理员才能
    Vip.find({}, (err, vips) => {
        console.log("getvips -> " + vips);

        return res.json({
            msg: '获取成功',
            data : {
                vips: vips
            },
            code: 0
        });

    });

});

router.post('/updatevip', function (req, res) {

    let admincode = req.body['admincode'];
    if (Settings.admincode !== admincode) {
        return res.json({
            msg: '没有权限',
            code: -1
        });
    }

    let id = req.body['_id'];
    let vipcode = req.body['vipcode'];
    let qrcode = req.body['qrcode'];
    let time = req.body['time'];
    let payed = req.body['payed'];

    Vip.findOneAndUpdate({_id : id}, {$set: {vipcode: vipcode, qrcode: qrcode, time: time, payed: payed === 'true'}},{new: true}, (err, v) => {
        if (v) {
            return res.json({
                msg: '修改成功',
                data : {
                    vip: v
                },
                code: 0
            });
        } else {
            return res.json({
                msg: '没有该会员账号',
                code: -1
            });
        }

    });

});

router.get('/services', function (req, res) {

    console.log('/services');

    Service.find({}, function(err, services) {

        console.log(services);
        return res.json({
            msg: 'success',
            code: 0,
            data: services
        });
    });

});




router.post('/payshadow', function (req, res) {
    console.log('payshadow');
    let username = req.body['username'];
    let password = req.body['password'];
    let deviceid = req.body['deviceid'];
    //let viplevel = req.body['viplevel'];
    let vipcode = req.body['vipcode']; // vip激活码

    User.findOne({username: username}, function (err, user) {

        if (!user) {
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

        if (user.pwd !== password) {
            return res.json({
                msg: '账号密码错误',
                code: -2
            });
        }

        Vip.findOne({vipcode: vipcode}, function(err, v){

            if (v) {
                if (v.payed !== true) {

                    AppUserInfo.findOne({username: username}, function(err, vipuser) {

                        vipuser.date = new Date();
                        vipuser.vipcode = v.vipcode;
                        vipuser.qrcode = v.qrcode;
                        vipuser.time = v.time;

                        if (vipuser.deviceid !== deviceid) {
                            return res.json({
                                msg: '请用注册的手机登录账号',
                                code: -1001
                            });
                        }

                        vipuser.save(function(err, vu) {

                            if (vu) {

                                let tokendata = {
                                    id: vu._id,
                                    username: vu.username,
                                    deviceid:deviceid
                                };

                                let token = Util.genToken(tokendata);

                                return res.json({
                                    msg: '支付成功',
                                    code: 0,
                                    data: {
                                        id: vu._id,
                                        username: vu.username,
                                        token: token,
                                        deadline: v.time,
                                        shadow: v.qrcode
                                    }
                                });
                            }

                            if (err) {
                                return res.json({
                                    msg: '内部错误',
                                    code: -1
                                });
                            }
                        });

                        v.payed = true;
                        v.save();

                    });

                } else {
                    return res.json({
                        msg: '已经被激活',
                        code: 1
                    });
                }
            }else {
                return res.json({
                    msg: '此激活码无效',
                    code: 1
                });
            }
        })


    });

});

router.get('/payqcode', function(req, res){

    return res.json({
        code: 0,
        data: {
            qcode:Settings.payweixin
        }
    });
})

router.get('/getviprices', function(req, res) {
    console.log("getviprices");
    return res.json({
        code: 0,
        data: {
            vipprices:[
                {name:'倔强青铜',
                    price:2,
                    des:"2元/天"
                },
                {name:'黄金荣耀',
                    price:15,
                    des:"15元/月"
                },
                { name:'尊贵铂金',
                    price:65,
                    des:"60元/半年"
                },
                {name:'钻石新耀',
                    price:100,
                    des:"100元/年"
                }

            ]
        }
    });
});

router.post('/downloadapkurl', function (req, res) {
    return res.json({
        code: 0,
        data: {
            downurl: ''
        }
    });
})
//router.post('/users/create', isLogin);
router.post('/login', function (req, res) {

    console.log('/api/login');

    //var useracount = new UserAcount;
    //useracount.username = req.session.user.name;
    //useracount.type_id = req.body.type_id;

    let username = req.body['username'];
    let password = req.body['password'];
    let deviceid = req.body['deviceid'];
    User.findOne({username: username}, function (err, user) {

        console.log('User.findOne' + user);
        if (!user) {
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

        if (user.pwd !== password) {
            return res.json({
                msg: '账号密码错误',
                code: -2
            });
        }

        AppUserInfo.findOne({username:username}, function (err, a){

            if (err) {
                return res.json({
                    msg: '内部错误',
                    code: -1
                });
            }

            let tokendata = {
                id: user._id,
                username: user.username,
                deviceid: deviceid
            };
            let token;

            console.log(a);
            if (a) {

                if (a.deviceid !== deviceid) {
                    return res.json({
                        msg: '请用注册的手机登录账号',
                        code: -1001
                    });
                } else {

                    token = Util.genToken(tokendata);
                    let days;
                    if (a.qrcode.length === 0) {
                        days = -1;
                    } else {
                        days = a.time - Util.getDays(a.date, new Date());
                    }
                    return res.json({
                        msg: '登录成功',
                        code: 0,
                        data: {
                            id: user._id,
                            username: a.username,
                            token: token,
                            deadline: days,
                            shadow: a.qrcode,
                            date: a.date
                        }
                    });

                }
            } else {
                token = Util.genToken(tokendata);

                return res.json({
                    msg: '登录成功',
                    code: 0,
                    data: {
                        id: user._id,
                        username: user.username,
                        token: token
                    }
                });
            }
        })


    });


});

function isLogin(req, res, next) {
    if (!req.session.user) {

        return res.redirect('/');
    }
    next();
}
module.exports = router;