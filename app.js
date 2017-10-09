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
var OCR = require('./ocr');

var users = require('./route/users');
var api = require('./route/api');
var crypto = require('crypto');

var MailUtil = require('./mail');
var Util = require('./util');
var Settings = require('./settings');
// view engine setup
app.engine('html', cons.swig);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

var User = require('./model/user');
var FriendFinder = require('./model/hoursefriend_finder');

var PAGE_NUM = 25;

// 大于两分匹配
var MATCH_SCORE = 0.2;

app.use(session({
    secret: 'weichaos5210',
    cookie: {
        maxAge: 30 * 1000 * 100	//过期时间，一过期mongodb自动删除。
    }
}));

app.use('/a/api', api);
app.use('users', users);
app.use(express.static('routes'));

var elasticsearch = require('elasticsearch');

var indexname = 'hourse_datasource';
var typename = 'hourse_type';


var esClient = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'error'
});

//noinspection BadExpressionStatementJS

app.locals.server_host = "http://127.0.0.1:3000";

var multer  = require('multer');

var uploadDir = './public/apppay/upload/';

var upload = multer({dest: uploadDir}).single('logo');

// 单图上传
app.post('/a/api/upload', function(req, res, next){

    //文件上传
    upload(req, res, function(err){
        if(err){
            console.error(err.message);
        }else{
            //获取文件的名称，然后拼接成将来要存储的文件路径
            var des_file= uploadDir+req.file.originalname;

            console.error('dest file:' + des_file);
            //读取临时文件
            fs.readFile(req.file.path,function(err,data){
                //将data写入文件中，写一个新的文件
                fs.writeFile(des_file,data,function(err){
                    if(err){
                        console.error(err.message);
                    }else{
                        var reponse={
                            message:'File uploaded successfully',
                            filename:req.file.originalname
                        };
                        //删除临时文件
                        fs.unlink(req.file.path,function(err){
                            if(err){
                                console.error(err.message);
                            }else{
                                console.log('delete '+req.file.path+' successfully!');
                            }
                        });
                    }

                    OCR.ocr(des_file, function(words) {
                        var json = JSON.parse(words);


                        json['words_result'].forEach((item) => {
                            console.log(item['words']);
                        });
                        //console.log('ocr words:' + words);
                    });
                    res.end(JSON.stringify(reponse));
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
        pwd:req.body['password']
    });


    console.log(newUser);
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

            if (req.session.isLogined == true) {

                FriendFinder.find({username:req.session.username}, function(err, fds) {

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
    FriendFinder.findOne({_id: id}, function(err, finder){

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
                    array.forEach((item)=> {
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

app.get('/hoursefriend/match', function(req, res){
    if (req.session.isLogined !==true) {
        return res.json({
            msg:"没有登录",
            code: -100
        });
    }



});

app.post('/hoursefriend/delete', function (req, res) {

    if (req.session.isLogined !==true) {
        return res.json({
            msg:"没有登录",
            code: -100
        });
    }



    FriendFinder.remove({}, function(err, obeject){

        if(!err){
            console.log('UserAcount remove success');
        }else {
            flag =true;
        }

    });

})

app.post('/hoursefriend/create', function (req, res) {

    console.log('/hoursefriend/create');
    var finder = new FriendFinder;

    if (req.session.isLogined !==true) {
        return res.json({
            msg:"没有登录",
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
            msg:"输入数据不完整",
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


                    FriendFinder.find({username:req.session.username}, function(err, fds) {

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
                                msg:'error'
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


app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
})

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

module.exports = app;