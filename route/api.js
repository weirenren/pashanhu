/**
 * Created by chaowei on 2017/5/30.
 */
var express = require('express');
var router = express.Router();
var User = require('../model/user');
var Util = require('../util');
let Settings = require('../settings');
var AppUserInfo = require('../model/appUserInfo');


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
        newUser.save(function (err) {
            if (err) {
                return res.json({
                    msg: '内部错误',
                    code: -1
                });
            }

            AppUserInfo.save(function (e) {

                if (e) {
                    return res.json({
                        msg: '登录成功',
                        code: 0,
                        data: {
                            id: u._id,
                            username: u.username,
                            token: token,
                            deadline: u.deadline,
                            shadow:''
                        }
                    });
                }
            });

        });
    });
});

router.post('/payshadow', function (req, res) {
    let username = req.body['username'];
    let password = req.body['password'];
    let deviceid = req.body['deviceid'];
    let viplevel = req.body['viplevel'];

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

        let vipuser = new AppUserInfo();

        vipuser.viplevel = viplevel;
        vipuser.deadline = 30;
        vipuser.username = username;
        vipuser.deviceid = deviceid;

        vipuser.save(function (err, vip) {

            let token;
            if (vip) {

                let tokendata = {
                    id: user._id,
                    username: user.username
                };

                token = Util.genToken(tokendata + deviceid);
                return res.json({
                    msg: '支付成功',
                    code: 0,
                    data: {
                        id: user._id,
                        username: user.username,
                        token: token,
                        deadline: vipuser.deadline,
                        shadow:''
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

        AppUserInfo.findOne({username:username}, function (err, u){

            if (err) {
                return res.json({
                    msg: '内部错误',
                    code: -1
                });
            }

            let tokendata = {
                id: user._id,
                username: user.username
            };
            let token;

            if (u) {

                if (u.deviceid !== deviceid) {
                    return res.json({
                        msg: '请用注册的手机登录账号',
                        code: -1001
                    });
                } else {

                    token = Util.genToken(tokendata + u.deviceid);
                    return res.json({
                        msg: '登录成功',
                        code: 0,
                        data: {
                            id: user._id,
                            username: u.username,
                            token: token,
                            deadline: u.deadline,
                            shadow:''
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
                        username: u.username,
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