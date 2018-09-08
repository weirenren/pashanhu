/**
 * Created by chaowei on 2017/5/1.
 */

var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'error'
});

//var indexname = 'hourse_datasource';
var indexname = 'hourse_test';
var typename = 'hourse_type';
var filename = 'hourse.json';
var mkdirp = require('mkdirp');

var User_House = require('./h_model/user_house');
var House = require('./h_model/house');

var superagent = require("superagent");

var domain = require('domain');

//require('superagent-proxy')(superagent);

var cheerio = require("cheerio");
var Promise = require('bluebird');

var moment = require('moment');
var request = require('request');

//var proxy = '121.232.144.27:9000';

//async提供简单,强大的功能来处理异步JavaScript
var async = require('async');
//nodejs自带文件和文件夹处理库
//此处应用图片下载和文件夹创建
var fs = require('fs');
var util = require('./util');
var space = '/';
var baseCacheDir = '.' + space + 'datasource';

var CAPTURE_PAGE_MAX = 8;

var PAGE_MAX = 20;


var CAPTURE_TASK_TYPE_TOTAL = 1;
var CAPTURE_TASK_TYPE_DAY = 2;

var CAPTURE_TASK_TYPE = CAPTURE_TASK_TYPE_DAY;

var last_page_start = 0;

var goingDeleteHouseData = [];



var crypto = require('crypto');
var iconv = require('iconv-lite');

var spider_source_settings = require('./spider_source_domain_setting');

//https://www.douban.com/group/beijingzufang/discussion?start=0 // 25递增
var baseUrl = 'https://www.douban.com/group/beijingzufang/discussion?start=';

var header = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36'
}

var headertest = {
    'User-Agent' :'Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US; rv:1.9.1.6) Gecko/20091201 Firefox/3.5.6'
}

var header2 = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.2985.134 Safari/537.36'
}



var baseDir = './public/images';

//var base = 'images';
var base = 'images';

var DETECT = 0; // ++达到10,说明之后是老数据 则停止抓取



var resultArray = []; //解析完后的数据

var picUrlList = []; //存储图片地址，并发下载
var mmLaList = []; //存储信息

var hourseMap = {'id': 33};


var tagHrefMap = new Map();

var oldTagSet = new Set;
var newTagSet = []; //未解析列表页链接tag

var currentDatetime;



var DATETIME_DEADLINE = 1; // 爬虫已经到了deadline

var HREF_DUPLICATE = 2; // href已经爬过，超过十个

var MAX_PAGE_OVER = 3; // 达到最大数量

var CAPTURE_INIT = 0;

var capture_state = CAPTURE_INIT;

let root_timer;
var parent_timer;


var d = domain.create();
d.on('error', function (err) {
    console.log('uncaughtException domain catch error:' + err +'  time:' + util.formatDate(new Date()));

    // doCapture();
});

process.on('uncaughtException', function(e) {
    console.error('uncaughtException ' + e.stack +'  time:' + util.formatDate(new Date()));

    /// Makesure error outputed before process exit.
    process.stderr.write('', function () {
        // process.exit(1);
        // doCapture();
    });
});


var download = function(uri, filename, callback){
    request.head(uri, function(err, res, body){
        // console.log('content-type:', res.headers['content-type']);
        // console.log('content-length:', res.headers['content-length']);

        d.run(()=>{

            request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
        });


    });
};


function dropIndex() {
    return client.indices.delete({
        index: indexname
    });
}


function initIndex() {
    return client.indices.create({index: indexname});
}

function bulkIndex(index, type, data) {
    let bulkBody = [];

    data.forEach(item => {
        let time = new Date(item.datatime).getTime();

        bulkBody.push({
            index: {
                _index: index,
                _type: type
            }
        });
        bulkBody.push(item);

    });

    client.bulk({body: bulkBody})
        .then(response => {
            let errorCount = 0;
            response.items.forEach(item => {
                if (item.index && item.index.error) {
                    console.log(++errorCount, item.index.error);
                }
            });
            console.log(`Successfully indexed ${data.length - errorCount} out of ${data.length} items`);
        }).catch('error: ' + console.err);
}

function addtoMyIndex() {
    const articlesRaw = fs.readFileSync(filename);
    const articles = JSON.parse(articlesRaw);
    console.log(`${articles.length} items parsed from data file`);
    bulkIndex(indexname, typename, articles);
}


//创建文件夹存储图片
fs.exists(baseDir, function (exists) {
    if (!exists) {
        fs.mkdir(baseDir, 0o777, function (err) {
            if (!err) {
                console.log('create dir ok');
            }
        });
    }
});

function getMD5(string) {
    return crypto.createHash('md5').update(string).digest("hex");
}

let ONE_DAY_CAPTURE = 0;
let FULL_DAY_CAPTURE = 1;
let capture_type = ONE_DAY_CAPTURE;

function doCapture(next) {

    if (capture_type === ONE_DAY_CAPTURE) {
        doLoopWorkForDay(next);
    }

    if (capture_type === FULL_DAY_CAPTURE) {
        doLoopWorkForTotal(next);
    }
}




// 100天全量数据
function doLoopWorkForTotal(next) {

    console.log('doLoopWorkForTotal 全量抓取100页');
    CAPTURE_TASK_TYPE = CAPTURE_TASK_TYPE_TOTAL;
    PAGE_MAX = 50;

    console.log("doLoopWork start time:" + util.formatDate(new Date()));
    if (parent_timer) {
        clearInterval(parent_timer);
    }

    doWork(next);
    parent_timer = setInterval(function () {

        last_page_start = 0;
        if (root_timer === null) {

        } else {
            console.log('root timer is not null');
            clearInterval(root_timer);
        }

        console.log("doLoopWork start time:" + util.formatDate(new Date()));
        doWork(next);
    }, 200 * 60 * 1000); // 一小时间隔 抓一次；
}

// 抓取最近更新的数据，detect重复过多就停止
function doLoopWorkForDay(next) {
    console.log('doLoopWorkForDay 非全量抓取');

    CAPTURE_TASK_TYPE = CAPTURE_TASK_TYPE_DAY;
    console.log("doLoopWork start time:" + util.formatDate(new Date()));

    PAGE_MAX = 20;
    if (parent_timer) {
        clearInterval(parent_timer);
    }

    doWork(next);
    parent_timer = setInterval(function () {

        last_page_start = 0;

        if (root_timer === null) {

        } else {
            console.log('root timer is not null');
            clearInterval(root_timer);
        }

        console.log("doLoopWork start time:" + util.formatDate(new Date()));
        doWork(next);
    }, 80 * 60 * 1000); // 一小时间隔 抓一次；
}

function doWork(next) {

    init();

    let city_arr = spider_source_settings.domain_setting;

    doWorkTask(city_arr, next);

    root_timer = setInterval(function () {

        if (last_page_start / 25 >= PAGE_MAX) {

            clearInterval(root_timer);
            root_timer = null;
            console.log("DATETIME_DEADLINE datetime:" + currentDatetime + ' time:' + util.formatDate(new Date()));

        } else {
            doWorkTask(city_arr, next);
        }

    }, 20 * 60 * 1000);

}

function doWorkTask(city_arr, next) {

    for (let i = 0; i < city_arr.length; i++) {
        let url_arr = city_arr[i].url_array;

        console.log('doWorkTask:' + url_arr + ' time:' + util.formatDate(new Date()));
        let ll = url_arr.length;
        for (let j = 0; j < ll; j++) {
            var wait = j * 20 * 1000;

            let timer = setInterval(()=> {

                doCratch(city_arr[i].dir_name, city_arr[i].city_name, url_arr[j], last_page_start, next);

                clearInterval(timer);
            }, wait);

        }
    }
}


function doCratch(dir, city, url, page_start, next) {

    var action = '?start=';
    let surl_arr = url.split('?');
    var baseurl;

    if (surl_arr.length ===2) {
        baseurl = surl_arr[0] + action;
    } else {
        console.log('doCratch split url error from:' + url + ' time:' + util.formatDate(new Date()));
        return;
    }

    var start = page_start;
    var targetUrl;
    var loop = true;

    var parent = setInterval(function () {

        if (loop === true) {
            loop = false;

            var stop = 1;

            var timer = null;
            if ((start - page_start) / 25 <= CAPTURE_PAGE_MAX) {
                stop = 1;

                var wait = randomNum(20, 60) * 1000;

                targetUrl = baseurl + (start);

                if(wait % 2 === 0){
                    header = header2;
                }else {
                    header = headertest
                }

                console.log('scratching ' + targetUrl + ' wait time:' + wait / 1000 + 's' + ' time:' + util.formatDate(new Date()));
                timer = setInterval(function () {

                    if (CAPTURE_TASK_TYPE === CAPTURE_TASK_TYPE_DAY) {

                        if (stop === 1) {

                            cratchList(dir, city, targetUrl, next);

                            start += 25;
                            loop = true;
                            clearInterval(timer);
                        } else {
                            console.log('scratching over stop:CAPTURE_TASK_TYPE_DAY' + ' time:' + util.formatDate(new Date()));
                            clearInterval(timer);
                            clearInterval(parent);
                        }
                    }

                    else if (CAPTURE_TASK_TYPE === CAPTURE_TASK_TYPE_TOTAL) {
                        if (stop === 1) {

                            cratchList(dir, city, targetUrl, next);

                            start += 25;
                            loop = true;
                            clearInterval(timer);
                        } else {
                            console.log('scratching over stop:CAPTURE_TASK_TYPE_TOTAL' + ' time:' + util.formatDate(new Date()));
                            clearInterval(timer);
                            clearInterval(parent);
                        }
                    }
                }, wait);

            } else {
                console.log('scratching hold on 20 minute.' + ' time:' + util.formatDate(new Date()));
                if (timer) {
                    clearInterval(timer);
                }
                clearInterval(parent);
                last_page_start = start;
                stop = 0; // 停止

            }
        }
    }, 80000);

}


function cratchList(dir, city, url, next) {
    superagent.get(url)
        .set('header', header)
        .end(function (error, data) {
            if (error) {
                console.log("execption scratching over cratch href "+url+" error exception occured :"+ error.toString() + ' ' + util.formatDate(new Date()));
                next(-1, error.toString());
                return;
            }
            var $ = cheerio.load(data.text);    //注意传递的是data.text而不是data本身

            $('.olt tr').each(function (idx, element) {
                var $element = $(element);
                var th = $element.attr('class');

                if (th === '') {
                    var name = $(this).children('td[nowrap=nowrap]').first().text();

                    var $$ = cheerio.load($(this).children('.title').html());

                    var href = $$('a').attr('href');
                    var title = $$('a').attr('title');

                    let tag = getMD5(name +'_' + title);
                    if (tagHrefMap.get(tag) === undefined) {

                        console.log('push tag:' + tag + ' href:' + href + ' time:' + util.formatDate(new Date()));
                        tagHrefMap.set(tag, href);
                        newTagSet.push(tag);

                        console.log(href + ' DETECT set 0:');
                        DETECT = 0;
                    } else {
                        DETECT++;
                        console.log(href + ' exist before DETECT is : '+ DETECT);
                    }
                } else {

                }
            });

            if (DETECT === 20) {
                capture_state = HREF_DUPLICATE;
                return;
            }

            logJson("cratchList", newTagSet);
            loopParse(dir, city)

        });
    console.log("scratching over end" + ' time:' + util.formatDate(new Date()));
}

function logJson(log, json) {
    console.log(log + ":" + JSON.stringify(json));
}

var mkdirs = function(dirpath, callback) {
    fs.exists(dirpath, function(exists) {
        if(exists) {
            callback();
        } else {
            //尝试创建父目录，然后再创建当前目录
            mkdirs(path.dirname(dirpath), function(){
                fs.mkdir(dirpath,callback);
            });
        }
    })
};


function loopParse(dir, city) {
    var delay = randomNum(5000, 12000);
    var timer = setInterval(function () {
        if (newTagSet.length < 1) {
            clearInterval(timer);
        } else {
            parseListHref(dir, city);
        }

    }, delay);
}

function parseListHref(dir, city) {

    console.log('parseListHref start inputHrefs size:' + newTagSet.length + ' time:' + util.formatDate(new Date()) + ' :' + newTagSet);
    var tag = newTagSet.pop();
    //do{
    if (tag) {
        var href = tagHrefMap.get(tag);

        if (href === undefined || href==='' || href.length === 0) {
            console.log("href is empty : " + href);
            return;
        }

        console.log('parseListHref:' + href + ' ' + util.formatDate(new Date()));

        superagent.get(href)
            .set('header', header)
            .end(function (error, data) {

                if (error) {
                    console.log("error exception occured :" + error.toString() + ' time:' + util.formatDate(new Date()));
                    return;
                }

                //var html = iconv.decode(data.text, 'gb2312')
                var $ = cheerio.load(data.text, {decodeEntities: false}) //注意传递的是data.text而不是data本身

                var title = $('.tablecc ').text();

                if (title === '') {
                    title = $('#content h1').text();
                }

                var content = '';
                $('.topic-doc .topic-content p').each(function (idx, element) {

                    content += $(element).html();
                });

                console.log('content:' + content);

                var datetime = $('.topic-doc .color-green').text();

                if (!datetime || datetime === '') {
                    return;
                }

                if (!verifyDate(datetime)) {
                    console.log(datetime + ' <—— deadline time' + ' time:' + util.formatDate(new Date()))
                    // capture_state = DATETIME_DEADLINE;
                    return;
                }

                var imgHrefArray = [];

                if (currentDatetime !== datetime) {
                    currentDatetime = datetime; //保存当前

                    apppendHref(tag, dir, city, datetime, href);

                    $('.topic-content .image-container .image-wrapper img').each(function (idx, element) {
                        var $element = $(element);

                        if (imgHrefArray.length < 5) {
                            imgHrefArray.push({
                                "id": idx,
                                "href": $element.attr("src")
                            });
                        }
                    });


                    if (title) {
                        combine(tag, dir, city, href, datetime, title, content, imgHrefArray);
                    } else {
                        console.log('no title: href-> ' + href);
                    }

                } else {
                    apppendHref(tag, dir, city, datetime, href);

                    $('.topic-content .image-container .image-wrapper img').each(function (idx, element) {
                        var $element = $(element);

                        if (imgHrefArray.length <= 5) {
                            imgHrefArray.push({
                                "id": idx,
                                "href": $element.attr("src")
                            });
                        }

                    });

                    if (title) {
                        combine(tag, dir, city, href, datetime, title, content, imgHrefArray);
                    } else {
                        console.log('no title: href-> ' + href + ' time:' + util.formatDate(new Date()));
                    }
                }

            });

    } else {
        console.log('parseListHref inputHrefs is empty' + ' time:' + util.formatDate(new Date()));
    }

    console.log('parseListHref end' + ' time:' + util.formatDate(new Date()));

}

function combine(tag, dir, city, href, datatime, title, content, imgHrefArray) {
    console.log('combine start href ' + href + " imgs :" + imgHrefArray);
    var titlemd5 = getMD5(title.toString());

    let array = href.split('/');
    let page_id = '';
    if (array.length >2) {
        page_id = array[array.length-2];
    }
    var imgPathsArray = [];

    let date = datatime.split(' ')[0];
    var img_dir = titlemd5 + '_' + date + '_'+ page_id;

    var serverpath = base +'/'+ dir + '/' + date + '/' + img_dir;

    var localpath = baseDir  +'/'+ dir + '/' + date + '/' + img_dir;
    //创建文件夹存储图片
    fs.exists(localpath, function (exists) {
        if (!exists) {

            mkdirp(localpath, function (err) {

                if (err) {
                    console.log(err);
                } else {

                    let download_success_size = 0;
                    async.mapLimit(imgHrefArray, imgHrefArray.length, function (item, callback) {

// delay 的值在 2000 以内，是个随机的整数
                        var delay = randomNum(1500, 8000);

                        setTimeout(function () {

                            var server_imgpath = serverpath + '/' + item.id + '.jpg';

                            var local_imgpath = localpath + '/' + item.id + '.jpg';

                            download(item.href, local_imgpath, ()=>{

                                download_success_size++;

                                console.log(item.href + ' download done' + ' time:' + util.formatDate(new Date()));

                                imgPathsArray.push(server_imgpath);

                                if (download_success_size === imgHrefArray.length) {
                                    var jsonarray = [];
                                    jsonarray.push({
                                        city: city,
                                        title: title,
                                        content: content,
                                        hrefArray: imgPathsArray,
                                        imgpath: img_dir,
                                        datatime: datatime,
                                        href: href
                                    });
                                    console.log('图片下载完毕： ' + imgPathsArray + ' time:' + util.formatDate(new Date()));
                                    console.log('current inputHrefs size:' + newTagSet.length);
                                    oldTagSet.add(tag); // 写会旧缓存
                                    bulkIndex(indexname, typename, jsonarray);
                                }

                            });
                            // var stream = fs.createWriteStream(local_imgpath);
                            // var req = request(item.href).pipe(stream).on('close', callback);




                        }, delay);


                    }, function (err, res) {

                        if (!err) {


                        } else {
                            console.log('图片下载失败：' + err + ' ' + imgPathsArray.toString() + ' time:' + util.formatDate(new Date()));
                        }
                    });
                }
            });
        }
    });

    console.log('combine end' + ' time:' + util.formatDate(new Date()));
}
function searchTest() {
    searchFrom(indexname, 0, 20);
}

function searchFrom(indexname, from, size) {
    let body = {
        size: size,
        from: from,
        query: {
            match_all: {}
        }
    };

    client.search(indexname, body)
        .then(results => {
            console.log(`found ${results.hits.total} items in ${results.took}ms`);
            console.log(`returned article titles:`);
            results.hits.hits.forEach((hit, index) => console.log(`\t${body.from + ++index} - ${hit._source.title}`));
        })
        .catch(console.error);
}

function apppendHref(tag, basedir, city, datetime, href) {

    DETECT = 0;

    var result = tag + '_' + href + '|';

    var dir = baseCacheDir + space + basedir;

    var file = dir + space + datetime.split(' ')[0] + '.txt';

    fs.exists(dir, function (exist) {

        if (exist) {
            fs.appendFile(file, result, function () {
                console.log(file + ' 存在; 添加content:' + result);
            });
        } else {

            mkdirp(dir, function (err) {
                if (err) console.error(err);
                else {
                    fs.appendFile(file, result, function () {
                        console.log(file + ' 创建成功 添加content:' + result);
                    });
                }
            });
        }
    });
}


function init() {

    capture_state = CAPTURE_INIT;
    DETECT = 0;

    var date = new Date();

    currentDatetime = moment(date).format('YYYY-MM-DD');

    let city_arr = spider_source_settings.domain_setting;
    var len = city_arr.length;

    for (let i = 0; i < len; i++) {
        let dir_name = city_arr[i].dir_name;

        let path = baseCacheDir + space + dir_name;

        try {
            let list = fs.readdirSync(path);

            list.forEach(function(file) {

                readHrefSet(dir_name, file, (exist)=>{});
            });
        } catch (e) {
            console.log(e.toString());
        }

    }
    console.log("read old href source over.")

}

function sortDatetime(a, b) {
    return Date.parse(a) - Date.parse(b);
}

let backup_dir = '.' + space + 'backup';



function updateHouseDataFromESToFile() {


    let indexname = 'house_back_2018-08-25';
    client.count({
        index: indexname
    }).then((result) => {

        console.log('count:' + result.count);
        let body = {
            size: result.count,
            query: {
                match_all: {}
            }
        };

        let houseData = [];
        console.log('readHouseDataFromESToFile ' + ' time:' + util.formatDate(new Date()));
        client.search({index: indexname, type: typename, body: body})
            .then(results => {


                results.hits.hits.forEach((hit, index) => {

                        houseData.push({
                            title: hit._source.title,
                            content: hit._source.content,
                            hrefArray: hit._source.hrefArray,
                            imgpath: hit._source.imgpath,
                            datetime: hit._source.datatime,
                            href: hit._source.href,
                            _id: hit._id
                        });


                    let body = {
                        doc: {
                            city: '北京'
                        }
                    };

                    client.update({index: indexname, type: typename, id:  hit._id, body: body}, (err, rsp) => {

                    });

                    }
                );

                console.log('before ' + results.hits.hits.length + ' time:' + util.formatDate(new Date()));



                //
                // houseData.sort(sortDatetime);
                //
                // let file = backup_dir + space + util.getNowFormatDate() + '.txt';
                // console.log('write');
                //
                // let size = 0;
                // fs.exists(backup_dir, function (exist) {
                //
                //     if (exist) {
                //         houseData.forEach((item, index) => {
                //             let cont = genHouseItemString(item.title, item.content, item.hrefArray, item.imgpath, item.datetime, item.href);
                //             fs.appendFile(file, cont, function () {
                //                 console.log(cont + ' 添加成功:' + size++);
                //             });
                //         });
                //     } else {
                //
                //         mkdirp(backup_dir, function (err) {
                //             if (err) console.error(err);
                //             else {
                //                 houseData.forEach((item, index) => {
                //                     let cont = genHouseItemString(item.title, item.content, item.hrefArray, item.imgpath, item.datatime, item.href);
                //                     fs.appendFile(file, cont, function () {
                //
                //                         console.log(cont + ' 添加成功 :' + size++);
                //                     });
                //                 });
                //             }
                //         });
                //     }
                // });
            });
    })
}


function readHouseDataFromESToFile() {

    client.count({
        index: indexname
    }).then((result) => {

        console.log('count:' + result.count);
        let body = {
            size: result.count,
            query: {
                match_all: {}
            }
        };

        let houseData = [];
        console.log('readHouseDataFromESToFile ' + ' time:' + util.formatDate(new Date()));
        client.search({index: indexname, type: typename, body: body})
            .then(results => {

                console.log('before ' + results.hits.hits.length + ' time:' + util.formatDate(new Date()));

                results.hits.hits.forEach((hit, index) => {

                        houseData.push({
                            city: hit._source.city,
                            title: hit._source.title,
                            content: hit._source.content,
                            hrefArray: hit._source.hrefArray,
                            imgpath: hit._source.imgpath,
                            datetime: hit._source.datatime,
                            href: hit._source.href,
                            _id: hit._id
                        });

                    }
                );

                houseData.sort(sortDatetime);

                let file = backup_dir + space + util.getNowFormatDate() + '.txt';
                console.log('write');

                let size = 0;
                fs.exists(backup_dir, function (exist) {

                    if (exist) {
                        houseData.forEach((item, index) => {
                            let cont = genHouseItemString(item.city, item.title, item.content, item.hrefArray, item.imgpath, item.datetime, item.href);
                            fs.appendFile(file, cont, function () {
                                console.log(cont + ' 添加成功:' + size++);
                            });
                        });
                    } else {

                        mkdirp(backup_dir, function (err) {
                            if (err) console.error(err);
                            else {
                                houseData.forEach((item, index) => {
                                    let cont = genHouseItemString(item.city, item.title, item.content, item.hrefArray, item.imgpath, item.datatime, item.href);
                                    fs.appendFile(file, cont, function () {

                                        console.log(cont + ' 添加成功 :' + size++);
                                    });
                                });
                            }
                        });
                    }
                });
            });
    })
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

function genHouseItemString(city, title, content, hrefArray, imgpath, datatime, href) {
    let parent_delt = '&$';
    let child_delt = '@#';

    return filter(city, parent_delt, child_delt) + child_delt  + filter(title, parent_delt, child_delt) + child_delt + filter(content, parent_delt, child_delt) + child_delt
        + hrefArray + child_delt + imgpath + child_delt + datatime + child_delt + href + parent_delt;
}

function writeHouseDataFromFileToES() {

    let parent_delt = '&$';
    let child_delt = '@#';

    let today = util.getNowFormatDate();
    let file = backup_dir + space + today  + '.txt';

    let indexname = 'house_back_' + today;

    client.indices.delete({index: indexname});
    client.indices.create({index: indexname});

    fs.exists(file, function (exist) {

        if (exist) {

            fs.readFile(file, {flag: 'r+', encoding: 'utf8'}, function (err, data) {

                if (!err) {
                    let totalNum = 0;
                    data.split(parent_delt).forEach(item=>{

                        if (item && item.trim() !== '') {
                            let array = item.split(child_delt);

                            var houseData = [];
                            houseData.push({
                                city: array[0],
                                title: array[1],
                                content: array[2],
                                hrefArray: array[3],
                                imgpath: array[4],
                                datatime: array[5],
                                href: array[6]
                            });

                            totalNum++;
                            bulkIndex(indexname, typename, houseData);
                        }
                    });

                    console.log('writeHouseDataFromFileToES success. total num:' + totalNum);
                } else {
                    console.log("read error from file " + file +' : '+ err.toString())
                }

            });

        } else {
            console.log(file + " not exist.")
        }
    });

}

function readHrefSet(dir, filename, callback) {

    var file = baseCacheDir + space + dir + space + filename;
    oldTagSet.clear();
    tagHrefMap.clear();

    fs.exists(file, function (exist) {

        if (exist) {

            fs.readFile(file, {flag: 'r+', encoding: 'utf8'}, function (err, data) {

                if (!err) {
                    data.split('|').forEach(item=> {

                        if (item && item.trim() !== '') {
                            let arr = item.split('_');
                            oldTagSet.add(arr[0]);
                            tagHrefMap.set(arr[0], arr[1]);
                        }
                    })
                }

                callback(exist);
            });

        } else {
            callback(exist);
        }
    });


}

let DELETE_DAY_SIZE = 60;

function deleteOldHouseData() {
    let body = {
        query: {
            match: {
            }
        }
    };
    console.log('deleteing house deleteOldHouseData ' + ' time:' + util.formatDate(new Date()));
    client.search({_index: indexname, _type: typename, body: body})
        .then(results => {

            console.log('before ' + results.hits.hits.length + ' time:' + util.formatDate(new Date()));

            results.hits.hits.forEach((hit, index) =>{
                    var datetime = hit._source.datatime;

                    var nowDay = util.getNowFormatDate();

                    if (util.getDays(nowDay, datetime) > DELETE_DAY_SIZE) {

                        goingDeleteHouseData.push({
                            datetime: datetime,
                            href: hit._source.href,
                            _id: hit._id
                        });

                    }
            }
            );

            if (goingDeleteHouseData.length > 0) {

                console.log('deleteing house going' + ' time:' + util.formatDate(new Date()));

                // 删除抓取的house
                goingDeleteHouseData.forEach((house, index) => {

                    console.log("deleteing house: id" + house._id + ' href:' + house.href + ' time:' + util.formatDate(new Date()));
                    client.delete({
                        _index: indexname,
                        _type: typename,
                        _id: house._id,
                    }, (err, resp)=>{

                        if (err) {
                            console.log('delete fail house: id' + house._id + ' href:' + house.href + ' err:' + err + ' time:' + util.formatDate(new Date()));
                            return
                        }

                        House.remove({_id: house._id}, function (err, obj) {
                            if (err) {
                                console.log(err.toString() + ' time:' + util.formatDate(new Date()));
                                return;
                            }
                            if (obj) {
                                console.log(obj);
                            }
                        });

                        User_House.remove({house_id: house._id}, (err, obj) => {
                            if (err) {
                                console.log(err.toString() + ' time:' + util.formatDate(new Date()));
                                return;
                            }
                            if (obj) {
                                console.log(obj);
                            }
                        });

                        console.log('delete response:' +resp + ' time:' + util.formatDate(new Date()));
                        // if (resp.hits.successful < 1) {
                        //    console.log('no ' + house.toString() + ' exist')
                        // } else {
                        //     return next({status: true, message: 'POST DELETED', data: error, code: 500});
                        // }
                    })
                });

                console.log('delete goingDeleteHouseData size:' + goingDeleteHouseData.length + ' time:' + util.formatDate(new Date()));

                goingDeleteHouseData.clear();
            } else {
                console.log('deleteing house empty. time:' + util.formatDate(new Date()));
            }

        })

}
// 16天
function verifyDate(datetime) {
    return (moment(new Date()).diff(moment(datetime), "days") < 16);
}

function catch_list() {
    superagent.get('https://www.douban.com/group/beijingzufang/discussion?start=50')
        .set('header', header)
        .end(function (error, data) {
            if (error) {

                console.log("scratching over cratch href "+" error exception occured :"+ error.toString());
                return;
            }
            var $ = cheerio.load(data.text);    //注意传递的是data.text而不是data本身

            $('.olt .title a').each(function (idx, element) {
                var $element = $(element);

                var href = $element.attr("href");
                var title = $element.attr('title');



            });
            // $('td[nowrap=nowrap] a').each(function (idx, element) {
            //     console.log($(this).text());
            // });

            $('.olt tr').each(function (idx, element) {
                var $element = $(element);


                var th = $element.attr('class');

                if (th === '') {
                    var name = $(this).children('td[nowrap=nowrap]').first().text();
                    console.log(name);

                    var $$ = cheerio.load($(this).children('.title').html());

                    var href = $$('a').attr('href');
                    var title = $$('a').attr('title');

                    console.log(title);
                    console.log(href);
                } else {

                }

            });


        });
}

function test() {

    superagent.get("https://www.douban.com/group/topic/120469608/")
        .set('header', headertest)
        .end(function (error, data) {
            if (error) {
                console.log("error exception occured !" + error.toString());
                return next(error);
            }
            var $ = cheerio.load(data.text, {decodeEntities: false});    //注意传递的是data.text而不是data本身
            //console.log('catch ' +$('.topic-doc .topic-content p').html());

            var html = '';
            $('.topic-doc .topic-content p').each(function (idx, element) {

                html += $(element).html()

            });
            console.log(html);

            $('.topic-content .image-container .image-wrapper img').each(function (idx, element) {
                var $element = $(element);

                console.log($element.attr("src"));
                // imgHrefArray.push({
                //     "id": idx,
                //     "href": $element.attr("src")
                // });
            });




        });
    console.log("cratchList end");

}


//生成从minNum到maxNum的随机数
function randomNum(minNum, maxNum) {
    switch (arguments.length) {
        case 1:
            return parseInt(Math.random() * minNum + 1, 10);
        case 2:
            return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
        default:
            return 0;
    }
}

function indexOf(content) {
    let parent_delt = '&$';
    let child_delt = '@#';

    let index = content.indexOf(parent_delt);
    let index2 = content.indexOf(child_delt);

    let result = '';
    if (index === -1) {
        console.log('replace 1:' + content);
        result = content.replace(parent_delt, '');
    }

    if (index2 === -1) {
        console.log('replace 2:' + result);
        result = result.replace(child_delt, '');
    }
}



var Spider = {};

Spider.doCapture = doCapture;

module.exports = Spider;


Promise.resolve()
    // .then(indexOf('1000转租东坝金隅汇景苑单间（近将台）'));
    // .then(catch_list);
   //  .then(dropIndex)
   // .then(initIndex)
   .then(doCapture)
    // .then(updateHouseDataFromESToFile)
   //  .then(writeHouseDataFromFileToES);
