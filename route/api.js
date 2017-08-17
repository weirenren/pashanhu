/**
 * Created by chaowei on 2017/5/30.
 */
var express = require('express');
var router = express.Router();
var User = require('../model/user');
var Vip = require('../model/vip');
var Util = require('../util');
let Settings = require('../settings');
var AppUserInfo = require('../model/appUserInfo');
var crypto = require('crypto');

router.get('/checkversion', function (req, res) {

    let packageName = req.body['packageName'];
    let versionCode = req.body['versionCode'];


    if (versionCode < Settings.apkVersionCode) { // todo 选择用户升级

        return res.json({
            code:0,
            data :{
                vcode: Settings.apkVersionCode,
                changelog:'',
                downurl: '',
                vname:''
            }

        })
    } else {
        return res.json({
            code:0,
            data :{
                vcode: Settings.apkVersionCode,
                changelog:'',
                downurl: '',
                vname:''
            }
        })
    }

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

//vipcode: String, // 激活码
//    qrcode: String, // 二维码
//    time: 10, // 剩余天数
router.post('/addshadow', function(req, res){

    console.log('addshadow');
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
                    vip: v,
                    code: 0
                });
            }
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
                        })

                        v.date = new Date();
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

                    let days = a.time - Util.getDays(a.date, new Date());
                    return res.json({
                        msg: '登录成功',
                        code: 0,
                        data: {
                            id: user._id,
                            username: a.username,
                            token: token,
                            deadline: days,
                            shadow: a.qrcode
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