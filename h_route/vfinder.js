var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var Util = require('../util');
var House = require('../h_model/house');
var User = require('../h_model/user');
var UserHouse = require('../h_model/user_house');
var moment = require('moment');
var MailUtil = require('../mail');

var RSP_OK = 0;
var RSP_NOT_EXIST = 1001;
var RSP_ERROR = -1;

var RSP_EXIST = 99;
let img_base_url = 'http://localhost:3000/images/';
let last_query_time = new Date().getTime();
const requestIp = require('request-ip');

var houseListMap = new Map(); // key:city value:houselist

//用户点击注册按钮
router.post('/findPwd', function (req, res) {

    const clientIp = requestIp.getClientIp(req);
    console.log("[findPwd]:" + clientIp + " time:" + Util.formatDate(new Date()));
    let username = req.body['username'];

    User.findOne({username: username}, function (err, user) {
        if (user) {
            var to = username;
            var from = '13717535178@163.com';

            var subject = 'from 房友网：[用户找回密码] \n ';

            var text = '亲爱的[' + username+ ']用户 您的登录密码为：[' + user.pwd + ']，请妥善保管好您的密码，不要告诉陌生人 \n\n特别提醒：如果该邮件在垃圾箱中，务必从垃圾箱移回收件箱，不然之后会收不到该邮件信息\n\n' + '欢迎您再次来到房友网：https://sharevideo.cn/#/';

            MailUtil.send(from, subject, to, text);

            // todo 发邮件
            return res.json({
                msg: '成功,请前往邮箱: '+ username+ '找回密码,邮件可能存在垃圾箱中',
                code: RSP_OK
            });
        }
        return res.json({
            msg: '不存在该用户',
            code: -1
        });
    });
});

//用户点击注册按钮
router.post('/register', function (req, res) {

    const clientIp = requestIp.getClientIp(req);
    console.log("[register]:" + clientIp + " time:" + Util.formatDate(new Date()));
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
                code: RSP_EXIST
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
            if (u) {
                console.log('注册成功' + u);
                return res.json({
                    msg: '注册成功',
                    code: 0,
                    data: {
                        _id: u._id,
                        username: u.username
                    }
                });
            }

        });
    });
});

router.post('/login', function (req, res) {
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body['password']).digest('base64');
    User.findOne({username: req.body['username']}, function (err, user) {
        console.log('login:' + user);
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

        if (user.password !== password) {
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
            code: 0,
            data: {
                username: user.username,
                _id: user._id
            }
        });
    });
});
router.get('/logout', function (req, res) {

    User.update({name: req.session.user.name}, {$set: {is_used: false}}, function (err, user) {

        if (!err) {
            console.log('user udpate success ' + user.is_used ? "true" : "false");

        } else {
            console.log('user udpate err ' + err);

        }
    });

    // req.session.username = null;
    // req.session.isLogined = false;
    // res.redirect('/');
});

function tranImgUrl(house_img_array) {
    let temp_array = [];
    house_img_array.forEach((item, ind)=>{
        let targetImgUrl = img_base_url + item
        console.log(targetImgUrl);
        temp_array.push(targetImgUrl)
    });
}

router.post('/gUseInfo', (req, rsp) => {

    var username = req.body['username'];
    UserHouse.find({username: username}, (err, uhlist) => {
        if (uhlist) {

            var ids = [];
            uhlist.forEach((uh, ind) => {
                ids.push(uh.house_id);
            });

            House.find({_id: {$in: ids}}, (err, houselist) => {

                if (houselist) {
                    let response = {
                        msg: 'success',
                        code: RSP_OK,
                        data: {
                            houselist: houselist
                        }
                    };
                    console.log('house:' + JSON.stringify(response));
                    rsp.end(JSON.stringify(response));
                } else {
                    console.log('error', err);
                }
            });
        } else {
            console.log('no uhlist:' + uhlist);
            let response = {
                msg: 'success',
                code: RSP_OK,
                data: {}
            };
            console.log('no house:' + JSON.stringify(response));
            rsp.end(JSON.stringify(response));
        }
    });
});

router.get('/ghouse', (req, rsp) => {
    var houseId = req.param('houseId', '');
    console.log('[get] [ghouse] houseId:' + houseId);
    const clientIp = requestIp.getClientIp(req);
    console.log("[ghouse]:" + clientIp + " time:" + Util.formatDate(new Date()));
    House.find({_id: houseId}, (err, result) => {
        if (result) {

            if (result.from_type === 1) {
                result.imgurl_list = tranImgUrl(result.imgurl_list)
            }
            let response = {
                msg: 'success',
                code: RSP_OK,
                data: {
                    house: result
                }
            };
            rsp.end(JSON.stringify(response));
        } else {
            let response = {
                msg: '不存在该house：' + houseId,
                code: RSP_NOT_EXIST
            };
            rsp.end(JSON.stringify(response));
        }

    });
});

// 暂时不分页
router.get('/ghouselist', (req, rsp) => {
 // todo 参数合法性检测
    // var limit = req.param("limit", 20);

    // var currentPage = req.param("currentPage", 1);
    // if (currentPage < 1) {
    //     currentPage = 1;
    // }

    const clientIp = requestIp.getClientIp(req);
    console.log("[ghouselist]:" + clientIp + " time:" + Util.formatDate(new Date()));
    let now_time = new Date().getTime();
    let needfullquery = Math.floor((now_time - last_query_time) / (1000)) > 5;

    var city = req.param('city', '北京');

    let queryBody = {forbid: false, city: city};
    if (houseListMap.has(city) && !needfullquery) {
        var houseList = houseListMap.get(city);
        let response = {
            msg: 'success',
            code: 0,
            data: {
                totalCount: houseList.length,
                house_list: houseList
            }
        };
        console.log('houseList city:' + city + ' exist -- ' + JSON.stringify(houseList.length));
        rsp.end(JSON.stringify(response));

    } else {
        last_query_time = new Date().getTime();
        let now_date = new Date();

        House.find(queryBody).sort({date: 'desc'}).exec(function(err, result) {
            var houseList = [];
            if (result) {
                result.forEach((obj, ind) => {

                    if ((moment(now_date).diff(moment(obj.date), "days")) < 16) {
                        houseList.push({
                            _id: obj._id,
                            title: obj.title,
                            datetime: obj.date,
                            city: obj.city,
                            from_type: obj.from_type
                        })
                    }

                });

                houseListMap.set(city, houseList);
            }

            let response = {
                msg: 'success',
                code: 0,
                data: {
                    totalCount: houseList.length,
                    house_list: houseList
                }
            };
            console.log('houseList city:' + city + ' not exist -- ' + JSON.stringify(houseList.length));
            rsp.end(JSON.stringify(response));
        });
    }





    // House.find(queryBody, (err, result) => {
    //
    //     console.log(JSON.stringify(result));
    //
    //     let response = {
    //         msg: 'success',
    //         code: 0,
    //         data: {
    //             totalCount: result.length,
    //             friends: result
    //         }
    //     };
    //     console.log('find friends:' + JSON.stringify(result));
    //     rsp.end(JSON.stringify(response));
    //
    // });

    // Friend.find(queryBody).exec(function (err, rs) {
    //     if (err) {
    //         let response = {
    //             msg: 'fail',
    //             code: -1,
    //             data : err
    //         };
    //         res.end(JSON.stringify(response));
    //     } else {
    //         var totalPage = Math.floor(rs.length / limit);
    //         if (rs.length % limit !== 0) {
    //             totalPage += 1;
    //         }
    //
    //         if (currentPage > totalPage) {
    //             currentPage = totalPage;
    //         }
    //         console.log(currentPage);
    //         var query = Friend.find(queryBody);
    //         query.skip((currentPage - 1) * limit);
    //         query.sort({"checkInDate": -1});
    //         query.limit(limit);
    //         query.exec(function (err, result) {
    //
    //             let response = {
    //                 msg: 'success',
    //                 code: 0,
    //                 data : {
    //                     totalCount: rs.length,
    //                     friends: result
    //                 }
    //             };
    //             console.log('find friends:' + JSON.stringify(result));
    //             res.end(JSON.stringify(response));
    //         });
    //     }
    // });

});

module.exports = router;
