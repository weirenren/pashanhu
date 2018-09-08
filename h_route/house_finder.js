/**
 * Created by chaowei on 2018/7/15.
 */
var express = require('express');
var router = express.Router();
var Promise = require('bluebird');
var elasticsearch = require('elasticsearch');

const querystring = require('querystring');
const https = require('https');
var mongoose = require('mongoose');

const Util = require('../util');

var User = require('../h_model/user');
var Friend = require('../h_model/friend');
var House = require('../h_model/house');
var User_Friend = require('../h_model/user_friend');
var User_House = require('../h_model/user_house');

var multer = require('multer');
var fs = require('fs');

var uploadDir = './public/apppay/upload/';
var upload = multer({dest: uploadDir}).single('file');

var img_person_tag = 'person';

var PAGE_NUM = 25;

var indexname = 'hourse_test';
var typename = 'hourse_type';

var esClient = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'error'
});


router.post('/find_user', (req, rsp) => {
    console.log('find_user:' + JSON.stringify(req.body));

    let username = req.body['username'];

    // username finder_id match?
    User.findOne({username: username}, function (err, user) {

        if (err) {
            let response = {
                msg: '不存在该用户',
                code: -1
            };
            rsp.end(JSON.stringify(response));
            return;
        }

        if (user) {

            let has_house_ids =[];
            let has_finder_ids = [];

            User_Friend.find({username: username}, (err1, ufs) => {
                if (err1) {
                    let response = {
                        msg: 'err:' + err1.toString(),
                        code: -1
                    };
                    rsp.end(JSON.stringify(response));
                    return;
                }


                let friend_ids = [];
                console.log('User_Friend find:' + ufs);

                ufs.forEach((value, ind) => {
                    if (value.type === 1) {
                        has_finder_ids.push(value.friend_id);
                    }
                    friend_ids.push( mongoose.Types.ObjectId(value.friend_id));
                });


                User_House.find({username: username}, (err2, uhs) => {

                    if (err2) {
                        let response = {
                            msg: 'err:' + err2.toString(),
                            code: -1
                        };
                        rsp.end(JSON.stringify(response));
                        return;
                    }

                    let house_list = [];
                    let ids = [];

                    console.log('User_House find:' + uhs);
                    if (uhs.length > 0) {
                        uhs.forEach((value, ind) => {
                            if (value.type === 1) {
                                has_house_ids.push(value.es_id);
                            }
                            ids.push(value.es_id);
                        });

                        console.log('User_House find:' + ids);
                        esClient.mget({index: indexname, type: typename, body: {ids: ids}}).then(results => {

                            results.docs.forEach((hit, ind) => {
                                let house_atom = hit._source;
                                if (house_atom) {
                                    house_atom._id = hit._id;
                                    house_list.push(house_atom);
                                }
                            });

                            Friend.find({
                                '_id': { $in: friend_ids}
                            }, function(err, friends){


                                let body = {
                                    has_finder_list: friends,
                                    has_house_list: house_list,
                                    has_house_ids: has_house_ids,
                                    has_finder_ids: has_finder_ids
                                };

                                let response = {
                                    msg: 'success',
                                    code: 0,
                                    data: body

                                };
                                console.log('esClient :' + JSON.stringify(body));

                                rsp.end(JSON.stringify(response));
                            });


                            // Friend.find().where('id')
                            //     .in(friend_ids)
                            //     .exec((err, friends) => {
                            //
                            //         let body = {
                            //             friend_list: friends,
                            //             house_list: house_list
                            //         };
                            //
                            //         let response = {
                            //             msg: 'success',
                            //             code: 0,
                            //             data: body
                            //
                            //         };
                            //         console.log('esClient :' + JSON.stringify(body));
                            //
                            //         rsp.end(JSON.stringify(response));
                            //     });

                        });

                    } else {


                        Friend.find({
                            '_id': { $in: friend_ids}
                        }, function(err, friends){

                            let body = {
                                friend_list: friends,
                                house_list: house_list
                            };

                            let response = {
                                msg: 'success',
                                code: 0,
                                data: body

                            };
                            console.log('esClient :' + JSON.stringify(body));

                            rsp.end(JSON.stringify(response));
                        });

                    }


                })
            });

        } else {

            let response = {
                msg: '用户信息不匹配',
                code: -1
            };
            rsp.end(JSON.stringify(response));
        }
    });


});

router.post('/focus_finder', (req, res) => {
    // User.findOne({username: username}, function (err, user) {
    console.log('focus_finder:' + JSON.stringify(req.body));

    let username = req.body['username'];
    let friendId = req.body['friend_id'];

    User.findOne({username: username}, function (err, user) {

        if (user) {
            User_Friend.findOne({username: username, friend_id: friendId, type:2}, function (err, ufriend) {

                if (ufriend) {

                } else {
                    let user_friend = new User_Friend({
                        username: username,
                        friend_id: friendId,
                        type:2
                    });

                    user_friend.save((er, uf)=>{

                    });


                }

                let response = {
                    msg: 'success',
                    code: 0
                };
                res.end(JSON.stringify(response));

            });

        } else {
            let response = {
                msg: '不存在该用户：' + username,
                code: -1
            };
            res.end(JSON.stringify(response));
        }
    });
});

router.post('/unfocus_finder', (req, res) => {
    // User.findOne({username: username}, function (err, user) {

    console.log('unfocus_finder:' + JSON.stringify(req.body));

    let username = req.body['username'];
    let friendId = req.body['friend_id'];

    User.findOne({username: username}, function (err, user) {

        if (user) {
            User_Friend.remove({username: username, friend_id: friendId, type:2}, function (err, ufriend) {
                let response = {
                    msg: 'success:',
                    code: 0
                };
                res.end(JSON.stringify(response));

            });

        } else {
            let response = {
                msg: '不存在该用户：' + username,
                code: -1
            };
            res.end(JSON.stringify(response));

        }
    });
});

router.post('/focus_house', (req, res) => {
    // User.findOne({username: username}, function (err, user) {

    console.log('focus_finder:' + JSON.stringify(req.body));

    let username = req.body['username'];
    let es_id = req.body['es_id'];

    User.findOne({username: username}, function (err, user) {

        if (user) {
            User_House.findOne({username: username, es_id: es_id, type:2}, function (err, uhouse) {

                if (uhouse) {

                } else {
                    // let user_friend = new User_Friend({
                    //     username: username,
                    //     friend_id: friendId,
                    //     type:2
                    // });
                    //
                    // user_friend.save((er, uf)=>{
                    //
                    // });


                    let user_house = new User_House({
                        username: username,
                        es_id: es_id,
                        type: 2
                    });

                    user_house.save((err, uh) => {

                    });
                }
                let response = {
                    msg: 'success',
                    code: 0
                };
                res.end(JSON.stringify(response));

            });

        } else {
            let response = {
                msg: '不存在该用户：' + username,
                code: -1
            };
            res.end(JSON.stringify(response));
        }
    });
});

router.post('/unfocus_house', (req, res) => {
    // User.findOne({username: username}, function (err, user) {

    console.log('unfocus_house:' + JSON.stringify(req.body));

    let username = req.body['username'];
    let houseId = req.body['house_id'];

    User.findOne({username: username}, function (err, user) {

        if (user) {
            User_House.remove({username: username, house_id: houseId, type:2}, function (err, uhouse) {
                let response = {
                    msg: 'success:',
                    code: 0
                };
                res.end(JSON.stringify(response));

            });

        } else {
            let response = {
                msg: '不存在该用户：' + username,
                code: -1
            };
            res.end(JSON.stringify(response));

        }
    });
});

// checkInDate:Date,// 入职日期
//     checkInPlace:String, // 入职地点
//     callNumber:String, //联系方式
//     other:String,//其它备注信息
//     forbid: {type:Boolean, default: false}, // 是否禁用该账户
// visit_time: {type: Number, default: 1},
// extra:String // 额外信息
router.post('/create_finder', (req, res) => {

    console.log('create_finder:' + JSON.stringify(req.body));

    let username = req.body['username'];

    let checkInDate = req.body['checkInDate'];
    let checkInPlace = req.body['checkInPlace'];
    let callNumber = req.body['callNumber'];
    let other = req.body['other'];
    let city = req.body['city'];


    var friend = new Friend({
        checkInDate: checkInDate,
        checkInPlace: checkInPlace,
        callNumber: callNumber,
        other: other,
        city: city,
        datetime: Util.getDateNow()
    });


    friend.save((err, obj) => {

        if (!err) {
            // username: String, // 用户名
            //     friend_id: String, // friend表id
            //     extra: String // 额外信息
            let user_friend = new User_Friend({
                username: username,
                friend_id: obj._id
            });

            user_friend.save((err, o) => {

                if (err) {
                    console.log(err);
                    let response = {
                        msg: 'fail:' + err,
                        code: -1
                    };
                    res.end(JSON.stringify(response));

                    return;
                } else {

                    let response = {
                        msg: 'finder添加成功',
                        code: 0,
                        data: obj
                    };
                    res.end(JSON.stringify(response));

                }
            })
        } else {
            console.log(err);
            let response = {
                msg: 'fail:' + err,
                code: -1
            };
            res.end(JSON.stringify(response));
        }
    });

});

router.get('/find_house', (req, res) => {
    console.log('find_house:' + req.query.city);

    let cityName = req.query.city;

    if (cityName === undefined) {
        cityName = '北京';
    }
    let body = {
        sort: [{"times": {"order": "desc"}}],
        // sort: [{ "datatime": { "order": "asc" } }],
        query: {
            match: {
                city: cityName
            }
        }
    };

    var array = [];

    esClient.search({
        index: indexname,
        type: typename,
        scroll: '1000s',
        body: body
    }, function getMoreUntilDone(error, response) {
        // console.log('rr:' + error.toString());
        if (response.hits && response.hits.hits) {

            response.hits.hits.forEach((hit, index) => {
                    array.push({
                        'title': hit._source.title,
                        'content': hit._source.content,
                        'hrefArray': hit._source.hrefArray,
                        'from': hit._source.from,
                        '_id': hit._id,
                        'datatime': hit._source.datatime
                    })
                }
            );

            if (PAGE_NUM > array.length && response.hits.total > PAGE_NUM) {
                //        // now we can call scroll over and over
                esClient.scroll({
                    scrollId: response._scroll_id,
                    scroll: '1000s'
                }, getMoreUntilDone);
            } else {

                var more = -1;
                var scrollId = -1;
                if (response.hits.total > PAGE_NUM) {
                    scrollId = response._scroll_id;
                    more = 0;
                }

                // array.sort(sortDatetime);

                let resp = {
                    msg: 'success',
                    code: 0,
                    data: {
                        hourselist: array,
                        scrollId: scrollId,
                        more: more
                    }
                };

                res.end(JSON.stringify(resp));
            }
        }
    });
});

router.get('/test', function (req, res) {

    let resp = {
        msg: 'success',
        code: 0,
        data: ''
    };

    let friend_ids = ['5b83546515462ea16465009f','5b8a47942466ecd10d56069f'];

    User_Friend.find({
        '_id': { $in: [
                mongoose.Types.ObjectId('5b83546515462ea16465009f'),
                mongoose.Types.ObjectId('5b8a47942466ecd10d56069f')
            ]}
    }, function(err, docs){
        console.log(docs);
    });

    // User_Friend.find()
    //     .where('fb.id')
    //     .in(friend_ids)
    //     .exec((err, friends) => {
    //
    //         console.log(friends);
    //
    //         // let body = {
    //         //     friend_list: friends,
    //         //     house_list: house_list
    //         // };
    //         //
    //         // let response = {
    //         //     msg: 'success',
    //         //     code: 0,
    //         //     data: body
    //         //
    //         // };
    //         // console.log('esClient :' + JSON.stringify(body));
    //         //
    //         // rsp.end(JSON.stringify(response));
    //     });


    res.end(JSON.stringify(resp));
});

router.get('/find_all_house', function (req, res) {

    esClient.count({
        index: indexname
    }).then((result) => {

        console.log('count:' + result.count);
        let body = {
            size: result.count,
            sort: [{"datatime": {"order": "asc"}}],
            query: {
                match_all: {}
            }
        };
        let houseData = [];

        esClient.search({index: indexname, type: typename, body: body})
            .then(results => {

                console.log('before ' + results.hits.hits.length + ' time:' + Util.formatDate(new Date()));

                results.hits.hits.forEach((hit, index) => {

                        houseData.push({
                            from: hit._source.from,
                            city: hit._source.city,
                            title: hit._source.title,
                            content: hit._source.content,
                            datatime: hit._source.datatime,
                            _id: hit._id
                        });

                    }
                );

                houseData.sort(sortDatetime);

                let resp = {
                    msg: 'success',
                    code: 0,
                    data: houseData
                };

                res.end(JSON.stringify(resp));


            });
    });
});


function sortDatetime(a, b) {
    return Date.parse(a.datatime) - Date.parse(b.datatime);
}

router.get('/find_house_more', function (req, res) {
    var scrollId = req.query.scrollId;
    var array = [];
    console.log('search_more ' + scrollId);
    esClient.scroll({
        scrollId: scrollId,
        scroll: '1000s'
    }, function getMoreUntilDone(error, response) {
        if (error) {
            return res.json({
                code: -1,
                data: array
            });
        } else {

        }

        console.log('search_more response:' + response);

        if (response.hits && response.hits) {

            response.hits.hits.forEach((hit, index) => {

                    array.push({
                        'city': hit._source.city,
                        'title': hit._source.title,
                        'content': hit._source.content,
                        'hrefArray': hit._source.hrefArray,
                        'from': hit._source.from,
                        '_id': hit._id,
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

                array.sort(sortDatetime);
                let resp = {
                    msg: 'success',
                    code: 0,
                    data: {
                        hourselist: array,
                        scrollId: scrollId,
                        more: more
                    }
                };

                res.end(JSON.stringify(resp));
            }
        }
    });
});


router.post('/find_finder_list_limit', (req, res) => {
    console.log('find_finder_list:' + JSON.stringify(req.body));

    // let finder_id = req.body['finder_id'];
    //
    // if (finder_id) {
    //
    // } else {
    //     finder_id = -1;
    // }
    //
    // Friend.find({_id: {$lt: finder_id}}, (list) => {
    //
    //     let response = {
    //         msg: 'success',
    //         code: 0,
    //         data : list
    //     };
    //     res.end(JSON.stringify(response));
    //
    // }).sort({"date": -1}).limit(20);


    var limit = req.param("limit", 20);
    var city = req.param('city', '北京');
    var currentPage = req.param("currentPage", 1);

    if (currentPage < 1) {

        currentPage = 1;

    }

    let queryBody = {forbid: false, city: city};

    Friend.find(queryBody, (err, result) => {

        console.log(JSON.stringify(result));

        let response = {
            msg: 'success',
            code: 0,
            data: {
                totalCount: result.length,
                friends: result
            }
        };
        console.log('find friends:' + JSON.stringify(result));
        res.end(JSON.stringify(response));

    });

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

router.post('/update_finder', (req, res) => {

    console.log('update_finder:' + JSON.stringify(req.body));

    let username = req.body['username'];
    let finder_id = req.body['finder_id'];
    let checkInDate = req.body['checkInDate'];
    let checkInPlace = req.body['checkInPlace'];
    let callNumber = req.body['callNumber'];
    let city = req.body['city'];
    let other = req.body['other'];

    // username finder_id match?
    User_Friend.findOne({username: username}, function (err, user) {

        if (err) {
            let response = {
                msg: '修改失败',
                code: -1
            };
            res.end(JSON.stringify(response));
            return;
        }

        if (user) {

            Friend.findOne({_id: finder_id}, function (err, fid) {

                if (fid) {
                    Friend.update({_id: finder_id}, {
                        $set: {
                            checkInDate: checkInDate,
                            checkInPlace: checkInPlace,
                            callNumber: callNumber,
                            city: city,
                            other: other,
                            datetime: Util.getDateNow()
                        }
                    }, function (err, u) {

                        if (!err) {
                            fid.datetime = Util.getDateNow();
                            console.log('update after:' + fid);
                            let response = {
                                msg: 'finder修改成功',
                                code: 0,
                                data: fid
                            };
                            res.end(JSON.stringify(response));
                        } else {
                            let response = {
                                msg: '修改失败',
                                code: -1
                            };
                            res.end(JSON.stringify(response));
                        }
                    });

                } else {
                    let response = {
                        msg: '修改失败：不存在该finder',
                        code: -1
                    };
                    res.end(JSON.stringify(response));

                }
            });

        } else {

            let response = {
                msg: '用户信息不匹配',
                code: -1
            };
            res.end(JSON.stringify(response));
        }
    });


});

router.post('/delete_finder', (req, res) => {

    console.log('delete_finder:' + JSON.stringify(req.body));

    let username = req.body['username'];

    let finder_ids = req.body['finder_ids'];

    let finder_id_array = finder_ids.split(',');

    let finder_id = req.body['finder_id'];

    // username finder_id match?
    User_Friend.findOne({username: username}, function (err, user) {

        if (err) {
            let response = {
                msg: '修改失败',
                code: -1
            };
            res.end(JSON.stringify(response));
            return;
        }

        if (user) {

            finder_id_array.forEach((value, ind) => {

                if (value !== '' || value !== undefined) {
                    console.log('delete_id:' + value);
                    User_Friend.remove({friend_id: value}, function (err, obj) {

                        if (obj) {

                        } else {
                            // let response = {
                            //     msg: '不存在该finder',
                            //     code: -1
                            // };
                            // res.end(JSON.stringify(response));

                            console.log(value + ' not exist');
                        }
                    });
                    Friend.remove({_id: value}, function (err, obj) {

                        if (obj) {

                        } else {
                            // let response = {
                            //     msg: '不存在该finder',
                            //     code: -1
                            // };
                            // res.end(JSON.stringify(response));

                            console.log(value + ' not exist');
                        }
                    });
                }
            });

            let response = {
                msg: '删除成功',
                code: 0
            };
            res.end(JSON.stringify(response));


        } else {

            let response = {
                msg: '用户信息不匹配',
                code: -1
            };
            res.end(JSON.stringify(response));
        }
    });


});

let img_prefix = 'images/';

function buildImageHrefArray (city, imgurl_list) {
    let city_en = Util.getCityEngName(city);
    let imgPathsArray = imgurl_list.split(',');

    let imgs = [];
    imgPathsArray.forEach((value, ind) => {
        imgs.push(img_prefix + city_en + '/' + value);
    });

    return imgs;
}

// from: String, // 来源:豆瓣租房/个人
//     title: String, // 标题
//     content: String, // 内容
//     imgurl_list: String, // 图片路径数组['a','b','c']
//     date: Date, // 创建日期
//     visit_time: {type: Number, default: 1}, // 查看次数
// forbid: {type: Boolean, default: false}, // 是否禁止显示该条信息
// extra: String // 额外信息
router.post('/create_house', (req, res) => {

    console.log('create_house:' + JSON.stringify(req.body));

    let username = req.body['username'];

    let city = req.body['city'];
    let from = req.body['from'];
    let title = req.body['title'];
    let content = req.body['content'];
    let imgurl_list = req.body['imgurl_list'];
    // let date = req.body['date']; // todo 日期格式转换

    let city_en = Util.getCityEngName(city);

    User.findOne({username: username}, (err, us) => {

        if (us) {

            let imgPathsArray = buildImageHrefArray(city, imgurl_list);
            var jsonarray = [];
            let body = {
                from: '51找室友',
                title: title,
                content: content,
                hrefArray: imgPathsArray,
                imgpath: '',
                datatime: Util.formatDate(new Date()),
                href: '',
                city: city
            };

            esClient.index({
                index: indexname,
                type: typename,
                body: body
            }, (err, rsp) => {

                let es_id = rsp._id;
                console.log("add house es_id:" + es_id);

                var house = new House({
                    from: from,
                    title: title,
                    imgurl_list: imgurl_list,
                    content: content,
                    date: Util.getDateNow(),
                    es_id: es_id,
                    city: city
                });

                house.save((err, obj) => {

                    if (!err) {
                        // username: String, // 用户名
                        //     friend_id: String, // friend表id
                        //     extra: String // 额外信息
                        let user_house = new User_House({
                            username: username,
                            house_id: obj._id,
                            es_id: es_id
                        });

                        user_house.save((err, o) => {

                            if (err) {
                                console.log(err);
                                let response = {
                                    msg: 'fail:' + err,
                                    code: -1
                                };
                                res.end(JSON.stringify(response));
                            } else {

                                let response = {
                                    msg: 'house添加成功',
                                    code: 0,
                                    data: obj
                                };
                                res.end(JSON.stringify(response));
                            }
                        })

                    } else {
                        console.log(err);
                        let response = {
                            msg: 'fail:' + err,
                            code: -1
                        };
                        res.end(JSON.stringify(response));
                    }
                });
                console.log('create: ' + JSON.stringify(rsp));
            });

        } else {

            if (err) {
                console.log(err);
                let response = {
                    msg: 'fail:' + err,
                    code: -1
                };
                res.end(JSON.stringify(response));

                return;
            } else {

                let response = {
                    msg: 'no this user',
                    code: -1
                };
                res.end(JSON.stringify(response));

            }
        }


    });

});

function deleteImgFile(imglist) {

    let img_arr = imglist.split(',');
    console.log(imglist);

    img_arr.forEach((item, index) => {

        var des_file = uploadDir + item;
        //删除临时文件
        fs.unlink(des_file, function (err) {
            if (err) {
                console.error(err.message);
            } else {
                console.log('delete ' + des_file + ' successfully!');
            }
        });
    });


}

// from: String, // 来源:豆瓣租房/个人
//     title: String, // 标题
//     content: String, // 内容
//     imgurl_list: String, // 图片路径数组['a','b','c']
//     date: Date, // 创建日期
//     visit_time: {type: Number, default: 1}, // 查看次数
// forbid: {type: Boolean, default: false}, // 是否禁止显示该条信息
// extra: String // 额外信息
router.post('/update_house', (req, res) => {

    console.log('update_house:' + JSON.stringify(req.body));

    let username = req.body['username'];
    // todo username finder_id match?

    let update_img = req.body['update_img']; // update:0

    let house_id = req.body['house_id'];
    let from = req.body['from'];
    let title = req.body['title'];
    let content = req.body['content'];
    let imgurl_list = req.body['imgurl_list'];
    let date = Util.getDateNow();

    User.findOne({username: username}, (err, us) => {

        if (us) {

            House.findOne({_id: house_id}, function (err, user) {

                if (user) {
                    if (update_img === '0') {
                        deleteImgFile(user.imgurl_list);
                    }

                    House.update({_id: house_id}, {
                        $set: {
                            from: from,
                            title: title,
                            content: content,
                            imgurl_list: imgurl_list,
                            date: date
                        }
                    }, function (err, u) {

                        if (err) {
                            console.log(err);
                            return;
                        }
                        if (u) {
                            let imgPathsArray = imgurl_list.split(',');

                            let body = {
                                doc: {
                                    title: title, content: content, datatime: date, hrefArray: imgPathsArray
                                }
                            };

                            console.log('es_id:' + user);
                            esClient.update({
                                index: indexname,
                                type: typename,
                                id: user.es_id,
                                body: body
                            }, (err, rsp) => {

                            });

                            console.log('update after:' + JSON.stringify(u));
                            let response = {
                                msg: 'house修改成功',
                                code: 0,
                                data: {
                                    _id: house_id,
                                    title: title,
                                    from: from,
                                    content: content,
                                    imgurl_list: imgurl_list,
                                    datatime: date
                                }
                            };
                            res.end(JSON.stringify(response));
                        } else {
                            let response = {
                                msg: '修改失败',
                                code: -1
                            };
                            res.end(JSON.stringify(response));
                        }
                    });

                } else {
                    let response = {
                        msg: '修改失败：不存在该house',
                        code: -1
                    };
                    res.end(JSON.stringify(response));

                }
            });


        }

    });


});


router.post('/delete_house', (req, res) => {

    console.log('delete_house:' + JSON.stringify(req.body));

    let username = req.body['username'];
    // todo username finder_id match?

    // let house_id = req.body['house_id'];

    let house_ids = req.body['house_ids'];

    let houseIdArray = house_ids.split(',');

    User.findOne({username: username}, (err, us) => {

        if (us) {
            houseIdArray.forEach((house_id, ind) => {

                if (house_id === '' || house_id === undefined) {
                    return;
                }

                House.findOne({_id: house_id}, function (err, house) {

                    if (house) {

                        deleteImgFile(house.imgurl_list);

                        House.remove({_id: house_id}, function (err, obj) {

                        });

                        User_House.remove({house_id: house_id}, (err, uh) => {
                        });

                        // esClient.delete({
                        //     index: indexname, type: typename, id: house.es_id
                        // }, (err, rsp) => {
                        //
                        // });

                    } else {

                        console.log('delete_house error:' + house_id + ' not eixst');
                        // let response = {
                        //     msg: '不存在该house',
                        //     code: -1
                        // };
                        // res.end(JSON.stringify(response));
                    }

                    // esClient.delete({
                    //     index: indexname, type: typename, id: house_id
                    // }, (err, rsp) => {
                    //
                    // });
                });

                esClient.delete({
                    index: indexname, type: typename, id: house_id
                }, (err, rsp) => {

                });

            });


        }

    });


    let response = {
        msg: '删除成功',
        code: 0
    };
    res.end(JSON.stringify(response));


    // User.findOne({username: username}, (err, us) => {
    //
    //     if (us) {
    //
    //         let houseIdArray = house_ids.split(',');
    //
    //         houseIdArray.forEach((house_id, ind) => {
    //             console.log(' house_ids:' + house_id);
    //             if (house_id === '' || house_id === undefined) {
    //                 return;
    //             }
    //
    //             House.findOne({_id: house_id}, function (err, house) {
    //
    //                 if (house) {
    //
    //                     deleteImgFile(house.imgurl_list);
    //
    //                     House.remove({_id: house_id}, function (err, obj) {
    //
    //                     });
    //
    //                     User_House.remove({house_id: house_id}, (err, uh) => {
    //                     });
    //
    //                     esClient.delete({
    //                         index: indexname, type: typename, id: house.es_id
    //                     }, (err, rsp) => {
    //
    //                     });
    //
    //                 } else {
    //
    //                     console.log('delete_house error:' + house_id + ' not eixst');
    //                     // let response = {
    //                     //     msg: '不存在该house',
    //                     //     code: -1
    //                     // };
    //                     // res.end(JSON.stringify(response));
    //                 }
    //             });
    //
    //         });
    //
    //         let response = {
    //             msg: '删除成功',
    //             code: 0
    //         };
    //         res.end(JSON.stringify(response));
    //
    //
    //     } else {
    //
    //         if (err) {
    //             let response = {
    //                 msg: err.toString(),
    //                 code: -1
    //             };
    //             res.end(JSON.stringify(response));
    //             return;
    //         }
    //
    //         let response = {
    //             msg: '不存在该user',
    //             code: -2
    //         };
    //         res.end(JSON.stringify(response));
    //     }
    // });

});

router.post('/upload', (req, res) => {

    //文件上传
    upload(req, res, function (err) {
        console.log('upload:' + JSON.stringify(req.body));

        if (err) {
            console.error('err:' + err.message);
        } else {

            // let deviceid = req.body['deviceid'];
            let username = req.body['username'];

            User.findOne({username: username}, (err, us) => {

                if (err) {
                    console.log('upload=> find user err:' + err.toString());
                    let response = {
                        msg: err.message,
                        code: -1
                    };
                    res.end(JSON.stringify(response));
                    return;
                }

                if (us && username) {

                    var dates = Util.getNowFormatDate();
                    var filepath = uploadDir;
                    var filename = dates + '/' + img_person_tag + '_' + username + '_' + new Date().getTime() + '.jpg'; // 时间戳表示文件名

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

        }
    });

});

router.post('/synUserInfo', (r, rs) => {
    console.log('login:' + r.body['code']);

    // https://api.weixin.qq.com/sns/jscode2session?appid=APPID&secret=SECRET&js_code=JSCODE&grant_type=authorization_code


    // var postData = querystring.stringify({
    //     'appid' : 'wxba9d0cba68b91431',
    //     'js_code' : r.body['code'],
    //     'secret' : '38f690f1acb27573e9bb854f233ce510',
    //     'grant_type' : 'authorization_code'
    // });

    var options = {
        hostname: 'api.weixin.qq.com',
        port: 443,
        path: '/sns/jscode2session?appid=wxba9d0cba68b91431&secret=38f690f1acb27573e9bb854f233ce510&js_code=' + r.body['code'] + '&grant_type=authorization_code',
        method: 'GET'
    };

    var req = https.request(options, (res) => {
        console.log('statusCode:', res.statusCode);
        console.log('headers:', res.headers);

        res.on('data', (d) => {
            // let response = {
            //     msg: '',
            //     code: 0,
            //     data : d.toString()
            // };

            let json = JSON.parse(d.toString());

            User.findOne({username: json.openid}, function (err, user) {

                if (err) {
                    let response = {
                        msg: err.toString(),
                        code: -1
                    };
                    rs.end(JSON.stringify(response));
                    return;
                }

                console.log(d.toString());
                console.log();
                if (user) {

                    console.log('user exist:' + user);
                    let response = {
                        msg: 'success',
                        code: 0,
                        data: {
                            username: user.username,
                            _id: user._id,
                            session_key: json.session_key
                        }
                    };
                    rs.end(JSON.stringify(response));
                } else {
                    // username: String,
                    //     password: String,
                    //     pwd: String, //明文
                    //     gender: String, // 男;女
                    //     date: Date,
                    //     forbid: {type: Boolean, default: false}, // 是否禁用该账户
                    // extra: String // 额外信息
                    var uuser = new User({
                        username: json.openid,
                        date: Util.getDateNow()
                    });

                    console.log('user no exist:' + uuser.username);
                    uuser.save((err, u) => {

                        if (u) {
                            console.log(json.session_key);
                            let response = {
                                msg: 'success',
                                code: 0,
                                data: {
                                    username: u.username,
                                    _id: u._id,
                                    session_key: json.session_key
                                }
                            };
                            rs.end(JSON.stringify(response));
                        }
                    });
                }
            });
        });
    });

    req.on('error', (e) => {
        console.error(e);
    });

    req.end();

});

module.exports = router;