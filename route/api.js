/**
 * Created by chaowei on 2017/5/30.
 */
var express = require('express');
var router = express.Router();
var User = require('../model/user');
var Util = require('../util');
var AppUserInfo = require('../model/appUserInfo');


//router.post('/users/create', isLogin);
router.post('/login', function (req, res) {

    console.log('/api/login');

    //var useracount = new UserAcount;
    //useracount.username = req.session.user.name;
    //useracount.type_id = req.body.type_id;

    var username = req.body['username'];
    var password = req.body['password'];
    var deviceid = req.body['deviceid'];
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

        if (user.pwd != password) {
            return res.json({
                msg: '账号密码错误',
                code: -2
            });
        }

        AppUserInfo.findOne({username:username}, function (err, u){

            if (u) {

                if (u.deviceid != deviceid) {
                    return res.json({
                        msg: '请用注册的手机登录账号',
                        code: -2
                    });
                } else {

                    var tokendata = {
                        id: user._id,
                        username: user.username
                    };
                    var token = Util.genToken(tokendata + u.deviceid);

                    return res.json({
                        msg: '登录成功',
                        code: 0,
                        data: {
                            id: u._id,
                            username: u.username,
                            token: token,
                            deadline: u.deadline
                        }
                    });

                }
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