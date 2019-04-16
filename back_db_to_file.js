var Promise = require('bluebird');

var MongoClient = require('mongodb').MongoClient;
var settings=require("./settings");
var mkdirp = require('mkdirp');

let util = require('./util');

let House = require("./h_model/house");
let Friend = require('./h_model/friend');
let User = require('./h_model/user');
let User_Friend = require('./h_model/user_friend');
let User_House = require('./h_model/user_house');

var fs = require('fs');

let parent_delt = '&$';
let child_delt = '@#';

let today = util.getNowFormatDate();
var space = '/';
let backup_dir = '.' + space + 'backup';
let friend_file = backup_dir + space + today + space + 'friend'  + '.txt';
let house_file = backup_dir + space + today + space + 'house'  + '.txt';
let user_file = backup_dir + space + today + space + 'user'  + '.txt';
let user_friend_file = backup_dir + space + today + space + 'user_friend'  + '.txt';
let user_house_file = backup_dir + space + today + space + 'user_house'  + '.txt';

MongoClient.connect("mongodb://"+settings.ip+"/"+settings.db, function(err, db) {


});


function write_to_db() {

    fs.exists(friend_file, function (exist) {

        if (exist) {

            fs.readFile(friend_file, {flag: 'r+', encoding: 'utf8'}, function (err, data) {

                if (!err) {

                    data.split(parent_delt).forEach(item => {

                        if (item && item.trim() !== '') {
                            let array = item.split(child_delt);

                            var friend = new Friend({
                                _id: array[0],
                                datetime: array[1],
                                city: array[2],
                                checkInDate: array[3],
                                checkInPlace: array[4],
                                callNumber: array[5],
                                other: array[6],
                                forbid: array[7],
                                visit_time: array[8]
                            });

                            friend.save((err, fri) => {
                                console.log('friend save:' + fri);
                            });
                        }
                    });


                } else {
                    console.log("read error from file " + house_file + ' : ' + err.toString())
                }

            });

        } else {
            console.log(friend_file + " not exist.")
        }
    });

    fs.exists(house_file, function (exist) {

        if (exist) {

            fs.readFile(house_file, {flag: 'r+', encoding: 'utf8'}, function (err, data) {

                if (!err) {

                    data.split(parent_delt).forEach(item => {

                        if (item && item.trim() !== '') {
                            let array = item.split(child_delt);
                            // from: {type: String, default: ""}, // 来源:豆瓣租房/个人
                            // city: {type: String, default: ""},
                            // title: {type: String, default: ""}, // 标题
                            // content: {type: String, default: ""}, // 内容
                            // imgurl_list: {type: String, default: ""}, // 图片href 数组 逗号 隔开
                            // href: {type: String, default: ""}, // 豆瓣详情页
                            // date: Date, // 创建日期
                            //     visit_time: {type: Number, default: 1}, // 查看次数
                            // forbid: {type: Boolean, default: false}, // 是否禁止显示该条信息
                            // from_type: {type:Number, default: 0}, // 0：豆瓣 1:个人
                            //
                            // es_id: {type: String, default: ""},
                            // extra: {type: String, default: ""} // 额外信息
                            var house = new House({
                                _id: array[0],
                                from: array[1],
                                city: array[2],
                                title: array[3],
                                content: array[4],
                                imgurl_list: array[5],
                                href: array[6],
                                date: array[7],
                                visit_time: array[8],
                                forbid: array[9],
                                from_type: array[10],
                                es_id: array[11]
                            });

                            house.save((err, fri) => {
                                console.log('house save:' + fri);
                            });
                        }
                    });


                } else {
                    console.log("read error from file " + house_file + ' : ' + err.toString())
                }

            });

        } else {
            console.log(house_file + " not exist.")
        }
    });

    fs.exists(user_file, function (exist) {

        if (exist) {

            fs.readFile(user_file, {flag: 'r+', encoding: 'utf8'}, function (err, data) {

                if (!err) {

                    data.split(parent_delt).forEach(item => {

                        if (item && item.trim() !== '') {
                            let array = item.split(child_delt);
                            // username: String,
                            //     password: String,
                            //     pwd: String, //明文
                            //     gender: String, // 男;女
                            //     date: Date,
                            //     forbid: {type: Boolean, default: false}, // 是否禁用该账户
                            // extra: String // 额外信息
                            var user = new User({
                                _id: array[0],
                                username: array[1],
                                password: array[2],
                                pwd: array[3],
                                gender: array[4],
                                date: array[5],
                                forbid: array[6]
                            });

                            user.save((err, fri) => {
                                console.log('user save:' + fri);
                            });
                        }
                    });


                } else {
                    console.log("read error from file " + user_file + ' : ' + err.toString())
                }

            });

        } else {
            console.log(user_file + " not exist.")
        }
    });

    fs.exists(user_friend_file, function (exist) {

        if (exist) {

            fs.readFile(user_friend_file, {flag: 'r+', encoding: 'utf8'}, function (err, data) {

                if (!err) {

                    data.split(parent_delt).forEach(item => {

                        if (item && item.trim() !== '') {
                            let array = item.split(child_delt);
                            // username: String, // 用户名
                            //     friend_id: String, // friend表id
                            //     type: {type: Number, default: 1},// 1：添加 2：关注
                            // extra: String // 额外信息
                            var user_friend = new User_Friend({
                                _id: array[0],
                                username: array[1],
                                friend_id: array[2],
                                type: array[3]
                            });

                            user_friend.save((err, fri) => {
                                console.log('user friend save:' + fri);
                            });
                        }
                    });


                } else {
                    console.log("read error from file " + user_friend_file + ' : ' + err.toString())
                }

            });

        } else {
            console.log(user_friend_file + " not exist.")
        }
    });

    fs.exists(user_house_file, function (exist) {

        if (exist) {

            fs.readFile(user_house_file, {flag: 'r+', encoding: 'utf8'}, function (err, data) {

                if (!err) {

                    data.split(parent_delt).forEach(item => {

                        if (item && item.trim() !== '') {
                            let array = item.split(child_delt);
                            // username: String, // 用户名
                            //     house_id: String, // house表id
                            //     es_id: String, // 在es中id
                            //     type: {type: Number, default: 1},// 1：添加 2：关注
                            // extra: String // 额外信息
                            var user_house= new User_House({
                                _id: array[0],
                                username: array[1],
                                house_id: array[2],
                                es_id: array[3],
                                type: array[4]
                            });

                            user_house.save((err, fri) => {
                                console.log('user_house save:' + fri);
                            });
                        }
                    });


                } else {
                    console.log("read error from file " + user_house_file + ' : ' + err.toString())
                }

            });

        } else {
            console.log(user_house_file + " not exist.")
        }
    });
}

function back_to_file() {
    let dir = backup_dir + space + today;
    Friend.find({},(err, friends) => {


        console.log('write friend');

        let size = 0;


        fs.exists(dir, function (exist) {

            if (exist) {
                fs.writeFileSync(friend_file,"");

                friends.forEach((item, index) => {
                    let cont = genFriendItemString(item._id, item.datetime, item.city, item.checkInDate, item.checkInPlace, item.callNumber, item.other, item.forbid, item.visit_time);
                    fs.appendFile(friend_file, cont, function () {
                        console.log(cont + ' 添加成功:' + size++);
                    });
                });
            } else {

                mkdirp(dir, function (err) {
                    if (err) console.error(err);
                    else {
                        friends.forEach((item, index) => {
                            let cont =  genFriendItemString(item._id, item.datetime, item.city, item.checkInDate, item.checkInPlace, item.callNumber, item.other, item.forbid, item.visit_time);
                            fs.appendFile(friend_file, cont, function () {

                                console.log(cont + ' 添加成功 :' + size++);
                            });
                        });
                    }
                });
            }
        });

    });

    User.find({}, (err, users) => {
        console.log('write user');
        let size = 0;
        fs.exists(dir, function (exist) {

            if (exist) {
                fs.writeFileSync(user_file,"");

                users.forEach((item, index) => {
                    let cont = genUserItemString(item._id, item.username, item.password, item.pwd, item.gender, item.date, item.forbid);
                    fs.appendFile(user_file, cont, function () {
                        console.log(cont + ' 添加成功:' + size++);
                    });
                });
            } else {

                mkdirp(dir, function (err) {
                    if (err) console.error(err);
                    else {
                        users.forEach((item, index) => {
                            let cont = genUserItemString(item._id, item.username, item.password, item.pwd, item.gender, item.date, item.forbid);
                            fs.appendFile(user_file, cont, function () {

                                console.log(cont + ' 添加成功 :' + size++);
                            });
                        });
                    }
                });
            }
        });

    });

    User_Friend.find({}, (err, user_friends)=> {
        console.log('write user friend');
        let size = 0;
        fs.exists(dir, function (exist) {

            if (exist) {
                fs.writeFileSync(user_friend_file,"");

                user_friends.forEach((item, index) => {
                    let cont = genUserFriendItemString(item._id, item.username, item.friend_id, item.type);
                    fs.appendFile(user_friend_file, cont, function () {
                        console.log(cont + ' 添加成功:' + size++);
                    });
                });
            } else {

                mkdirp(dir, function (err) {
                    if (err) console.error(err);
                    else {
                        user_friends.forEach((item, index) => {
                            let cont = genUserFriendItemString(item._id, item.username, item.friend_id, item.type);
                            fs.appendFile(user_friend_file, cont, function () {

                                console.log(cont + ' 添加成功 :' + size++);
                            });
                        });
                    }
                });
            }
        });
    });

    House.find({}, (err, houses) => {
        console.log('write house');
        let size = 0;
        fs.exists(dir, function (exist) {

            if (exist) {
                fs.writeFileSync(house_file,"");

                houses.forEach((item, index) => {
                    let cont = genHouseItemString(item._id, item.from, item.city, item.title, item.content,item.imgurl_list, item.href, item.date, item.visit_time, item.forbid, item.from_type, item.es_id);
                    fs.appendFile(house_file, cont, function () {
                        console.log(cont + ' 添加成功:' + size++);
                    });
                });
            } else {

                mkdirp(dir, function (err) {
                    if (err) console.error(err);
                    else {
                        houses.forEach((item, index) => {
                            let cont = genHouseItemString(item._id, item.from, item.city, item.title, item.content,item.imgurl_list, item.href, item.date, item.visit_time, item.forbid, item.from_type, item.es_id);
                            fs.appendFile(house_file, cont, function () {

                                console.log(cont + ' 添加成功 :' + size++);
                            });
                        });
                    }
                });
            }
        });
    });

    User_House.find({}, (err, user_houses) => {

        console.log('write house friend');
        let size = 0;
        fs.exists(dir, function (exist) {

            if (exist) {
                fs.writeFileSync(house_file,"");

                user_houses.forEach((item, index) => {
                    let cont = genUserHouseItemString(item._id, item.username, item.house_id, item.es_id, item.type);
                    fs.appendFile(user_friend_file, cont, function () {
                        console.log(cont + ' 添加成功:' + size++);
                    });
                });
            } else {

                mkdirp(dir, function (err) {
                    if (err) console.error(err);
                    else {
                        user_houses.forEach((item, index) => {
                            let cont = genUserHouseItemString(item._id, item.username, item.house_id, item.es_id, item.type);
                            fs.appendFile(house_file, cont, function () {

                                console.log(cont + ' 添加成功 :' + size++);
                            });
                        });
                    }
                });
            }
        });
    });
}


function filter(content, parent_delt, child_delt) {
    let index = content.indexOf(parent_delt);
    let index2 = content.indexOf(child_delt);

    let result = '';
    if (index === -1) {
        result = content.replace(parent_delt, '');
    }

    if (index2 === -1) {
        result = result.replace(child_delt, '');
    }
    return result;
}

function genFriendItemString(_id,time, city, checkInDate, checkInPlace, callNumber, other, forbid, visit_time) {

    return _id + child_delt + time + child_delt + city + child_delt + checkInDate + child_delt + filter(checkInPlace, parent_delt, child_delt) + child_delt + filter(callNumber, parent_delt, child_delt) + child_delt
        +  filter(other, parent_delt, child_delt) + child_delt + forbid + child_delt + visit_time  + parent_delt;
}

// username: String,
//     password: String,
//     pwd: String, //明文
//     gender: String, // 男;女
//     date: Date,
//     forbid: {type: Boolean, default: false}, // 是否禁用该账户
// extra: String // 额外信息
function genUserItemString(_id, username, password, pwd, gender, date, forbid) {

    return _id + child_delt + username + child_delt + password + child_delt + pwd + child_delt +gender + child_delt
        + date + child_delt + forbid + parent_delt;
}

// username: String, // 用户名
//     friend_id: String, // friend表id
//     type: {type: Number, default: 1},// 1：添加 2：关注
// extra: String // 额外信息

function genUserFriendItemString(_id, username, friend_id, type) {

    return _id + child_delt + username + child_delt + friend_id + child_delt + type + parent_delt;
}

// from: {type: String, default: ""}, // 来源:豆瓣租房/个人
// city: {type: String, default: ""},
// title: {type: String, default: ""}, // 标题
// content: {type: String, default: ""}, // 内容
// imgurl_list: {type: String, default: ""}, // 图片href 数组 逗号 隔开
// href: {type: String, default: ""}, // 豆瓣详情页
// date: Date, // 创建日期
//     visit_time: {type: Number, default: 1}, // 查看次数
// forbid: {type: Boolean, default: false}, // 是否禁止显示该条信息
// from_type: {type:Number, default: 0}, // 0：豆瓣 1:个人
//
// es_id: {type: String, default: ""},
// extra: {type: String, default: ""} // 额外信息

// from: String, // 来源:豆瓣租房/个人
//     city: String,
//     title: String, // 标题
//     content: String, // 内容
//     imgurl_list: String, // 图片路径数组{"a,b"}
//     date: Date, // 创建日期
//     visit_time: {type: Number, default: 1}, // 查看次数
// forbid: {type: Boolean, default: false}, // 是否禁止显示该条信息
//
// es_id: String,
//     extra: String // 额外信息
function genHouseItemString(_id, from, city,title,content,imgurl_list, href, date, visit_time, forbid, from_type, es_id) {

    return _id + child_delt + from + child_delt + city + child_delt + filter(title, parent_delt, child_delt) + child_delt + filter(content, parent_delt, child_delt) + child_delt + imgurl_list + child_delt + href + child_delt + date + child_delt + visit_time + child_delt + forbid + child_delt + from_type + child_delt + es_id + parent_delt;
}

// username: String, // 用户名
//     house_id: String, // house表id
//     es_id: String, // 在es中id
//     type: {type: Number, default: 1},// 1：添加 2：关注
// extra: String // 额外信息
function genUserHouseItemString(_id, username, house_id, es_id, type) {

    return _id + child_delt + username + child_delt + house_id + child_delt + es_id + child_delt + type + parent_delt;
}
Promise.resolve()
    // .then(write_to_db())
    .then(back_to_file());
