/**
 * Created by chaowei on 2018/7/15.
 */
var express = require('express');
var router = express.Router();
var Promise = require('bluebird');

const https = require('https');
var mongoose = require('mongoose');

const Util = require('../util');

var moment = require('moment');


let Omega = require('../h_route/Omega');
var Action = require('../h_model/user_action');


let Online_Order = require('./order')
let Goods_Setting = require('./goods_setting')

// checkInDate:Date,// 入职日期
//     checkInPlace:String, // 入职地点
//     callNumber:String, //联系方式
//     other:String,//其它备注信息
//     forbid: {type:Boolean, default: false}, // 是否禁用该账户
// visit_time: {type: Number, default: 1},
// extra:String // 额外信息

// datetime: Date, // 创建时间
//     username: { type: String, default: "" },
// tel: { type: Number, default: 0 },// 0: boy; 1: girl
// address: { type: String, default: "" }, // 入职地点
// otherInfor: { type: String, default: 0 },
// menu: { type: String, default: '' }, // [{'name':'黄瓜','price': 3.5, ''quantity': 3},{'name':'黄瓜','price': 3.5, ''quantity': 3}]
// extra: { type: String, default: "" } // 额外信息
router.post('/o_create_order', (req, res) => {
    console.log('online_create_order:' + JSON.stringify(req.body));

    let username = req.body['username'];
    let tel = req.body['tel'];
    let address = req.body['address'];
    let otherInfor = req.body['otherInfor'];
    let menu = req.body['menu'];
    let extra = req.body['extra'];

    let order = new Online_Order({
        username: username,
        tel: tel,
        address: address,
        otherInfor: otherInfor,
        menu: JSON.stringify(menu),
        extra: extra,
        datetime: Util.getDateNow()
    })

    order.save((err, obj) => {
        if (!err) {
            let response = {
                msg: 'Order添加成功',
                code: 0,
                data: obj
            };

            console.log('添加成功：' + JSON.stringify(obj))
            res.end(JSON.stringify(response));

        } else {
            console.log(err);
            let response = {
                msg: 'fail:' + err,
                code: -1
            };
            res.end(JSON.stringify(response));
        }
    })

});

router.post('/o_create_goods', (req, res) => {
    console.log('o_create_goods:' + JSON.stringify(req.body));

    let goods = req.body['goods'];

    let item = new Goods_Setting({
        setting: goods,
        datetime: Util.getDateNow()
    })

    item.save((err, obj) => {
        if (!err) {
            let response = {
                msg: 'goods',
                code: 0,
                data: obj
            };

            console.log('添加成功：' + JSON.stringify(obj))
            res.end(JSON.stringify(response));

        } else {
            console.log(err);
            let response = {
                msg: 'fail:' + err,
                code: -1
            };
            res.end(JSON.stringify(response));
        }
    })

});

router.get('/o_find_goods', (req, res) => {
    // User.findOne({username: username}, function (err, user) {

    Goods_Setting.find({}, (err, result) => {

        if (result.length > 0) {
            let response = {
                msg: 'success:',
                code: 0,
                data: result[result.length - 1]
            };
            res.end(JSON.stringify(response));
        } else {
            let response = {
                msg: 'nothing:',
                code: -1
            };
            res.end(JSON.stringify(response));
        }

    })
});

router.get('/o_find_order', (req, res) => {
    // User.findOne({username: username}, function (err, user) {

    console.log('online_find_order:' + JSON.stringify(req.query));

    let username = req.query.username;
    let order_id = req.query.order_id;

    Online_Order.findOne({ _id: order_id }, function (err, order) {

        if (order) {

            let response = {
                msg: 'success:',
                code: 0,
                data: order
            };
            res.end(JSON.stringify(response));

            console.log('find order:' + JSON.stringify(order))
        } else {
            let response = {
                msg: '不存在该order：' + order_id,
                code: -1
            };
            res.end(JSON.stringify(response));

        }
    });
});



module.exports = router;
