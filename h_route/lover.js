var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var Util = require('../util');

var LoverAtom = require('../love_model/LoverAtom');

var multer = require('multer');
var fs = require('fs');

var uploadDir = './public/images/lovers/';
var upload = multer({dest: uploadDir}).single('file');

var RSP_OK = 0;
var RSP_NOT_EXIST = 1001;
var RSP_ERROR = -1;
var EXPIRED_DAYS = 16;

const requestIp = require('request-ip');


router.post('/lover/upload', (req, res) => {

    const clientIp = requestIp.getClientIp(req);
    console.log("[upload]:" + clientIp + " time:" + Util.formatDate(new Date()));

    //文件上传
    upload(req, res, function (err) {
        console.log('upload:' + JSON.stringify(req.body));

        if (err) {
            console.log('err:' + err.message);
        } else {
            let username = req.body['username']; // wechat

            var dates = Util.getNowFormatDate();
            var filepath = uploadDir;
            var filename = dates + '/' + 'person' + '' + username + '010' + new Date().getTime() + '.jpg'; // 时间戳表示文件名

            //获取文件的名称，然后拼接成将来要存储的文件路径
            var des_file = filepath + filename;

            Util.getFilePath(filepath + dates, function () {

                //读取临时文件
                fs.readFile(req.file.path, function (err, data) {
                    if (err) {
                        console.error(err.message);
                        let response = {
                            msg: err.message,
                            code: -1
                        };
                        res.end(JSON.stringify(response));

                        return;
                    }
                    //将data写入文件中，写一个新的文件
                    fs.writeFile(des_file, data, function (err) {

                        if (err) {
                            console.error(err.message);
                            let response = {
                                msg: err.message,
                                code: -1
                            };
                            res.end(JSON.stringify(response));
                        } else {


                            //删除临时文件
                            fs.unlink(req.file.path, function (err) {
                                if (err) {
                                    console.error(err.message);
                                } else {
                                    console.log('delete ' + req.file.path + ' successfully!');
                                }
                            });

                            let response = {
                                msg: 'success',
                                code: 0,
                                data: {
                                    filename: filename
                                }
                            };
                            res.end(JSON.stringify(response));
                            console.log('file:' + des_file);
                        }

                    });

                });

            });

        }
    });

});


router.get('/lover/list', (req, res) => {
    // var city = req.param('city', '北京');
    var mangerid = parseInt(req.param('mangerid', 0));
    console.log('/lover/list : ' + mangerid);
    LoverAtom.find({}, function (err, list) {

        if (mangerid !== 521520) {

            console.log('clear wechat');
            list.forEach((item, indx) => {
                item.local_wechat = '';
                item.local_imgurl_list = []
            })
        }
        return res.json({
            msg: '成功',
            code: RSP_OK,
            data: {
                list: list
            }
        });
    });

});


router.get('/lover/delall', (req, res) => {
    // var city = req.param('city', '北京');
    var mangerid = req.param('mangerid', 0);
    console.log('/lover/list : ' + mangerid);
    if (mangerid === 'wei521520') {
        LoverAtom.remove({}, function (err, list) {

            return res.json({
                msg: '删除成功',
                code: RSP_OK
            });
        });
    }  else {
        return res.json({
            msg: '没有权限',
            code: -1
        });
    }

});


router.post('/lover/del', (req, res) => {
    // var city = req.param('city', '北京');

    var mangerid = req.body['mangerid'];
    var id = req.body['_id'];
    console.log('/lover/del : ' + mangerid);
    if (mangerid === 'wei521520') {

        LoverAtom.remove({_id: id}, function (err, obj) {

            return res.json({
                msg: '删除成功',
                code: RSP_OK
            });
        });
    }  else {
        return res.json({
            msg: '没有权限',
            code: -1
        });
    }

});

router.post('/lover/create', function (req, res) {
    console.log('/lover/create');
    const clientIp = requestIp.getClientIp(req);
    console.log("[register]:" + clientIp + " time:" + Util.formatDate(new Date()));
    // if (clientIp) {
    //     Omega.markRegister(clientIp, null);
    // }

    let title = req.body['title']; // 交友宣言

    let local_address = req.body['local_address'];
    let local_gender = req.body['local_gender'];
    let local_hometown = req.body['local_hometown'];
    let local_age = req.body['local_age'];
    let local_height = req.body['local_height'];
    let local_edu = req.body['local_edu'];
    let local_workyears = req.body['local_workyears'];
    let local_job = req.body['local_job'];
    let local_wechat = req.body['local_wechat'];
    let local_otherinfor = req.body['local_otherinfor'];

    let condi_gender = req.body['condi_gender'];
    let condi_age = req.body['condi_age'];
    let condi_height = req.body['condi_height'];
    let condi_edu = req.body['condi_edu'];
    let condi_hometown = req.body['condi_hometown'];
    let condi_otherinfor = req.body['condi_otherinfor'];
    let imgurl_list = req.body['imgurl_list'];

    let loverItom = new LoverAtom({
        title: title,
        local_address: local_address,
        local_gender: local_gender,
        local_hometown: local_hometown,
        local_age: local_age,
        local_height: local_height,
        local_edu: local_edu,
        local_workyears: local_workyears,
        local_job: local_job,
        local_wechat: local_wechat,
        local_otherinfor: local_otherinfor,

        condi_gender: condi_gender,
        condi_age: condi_age,
        condi_height: condi_height,
        condi_edu: condi_edu,
        condi_hometown: condi_hometown,
        condi_otherinfor: condi_otherinfor,
        local_imgurl_list: imgurl_list
    });

    loverItom.save((err, lover) => {
        if (err) {
            return res.json({
                msg: '内部错误',
                code: -1
            });
        }
        if (lover) {
            return res.json({
                msg: '提交成功',
                code: 0,
                data: {
                    _id: lover._id
                }
            });
        }
    });

});


module.exports = router;
