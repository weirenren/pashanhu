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


var superagent = require("superagent");

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

var baseCacheDir = '.';
var space = '/';
var city = 'city_beijing';

var sleep = require('sleep');

var crypto = require('crypto');
var iconv = require('iconv-lite');

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

var inputHrefs = []; //未解析列表页链接

var resultArray = []; //解析完后的数据

var picUrlList = []; //存储图片地址，并发下载
var mmLaList = []; //存储信息

var hourseMap = {'id': 33};


var hrefSet = new Set;
var currentDatetime;


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
        })
        .catch(console.err);
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


function doCratch() {
    var baseCity = 'beijingzufang';
    var host = 'https://www.douban.com/group/';
    var action = 'discussion?start=';
    var baseurl = host + baseCity + '/' + action;

    var start = 0;
    var targetUrl;


    var loop = true;

    var parent = setInterval(function () {


        if (loop) {
            loop = false;

            var wait = randomNum(20, 60) * 1000;

            targetUrl = baseurl + (start);

            if(wait % 2 ==0){
                header =header2;
            }else {
                header =headertest
            }


            console.log('scratching ' + targetUrl + ' wait time:' + wait / 1000 + 's');
            var timer = setInterval(function () {

                if (DETECT < 10 && start < 20000) {



                    cratchList(targetUrl);

                    start += 25;
                    loop = true;
                    clearInterval(timer);
                } else {
                    console.log('scratching over');
                    clearInterval(timer);
                    clearInterval(parent);
                }

            }, wait);
        }


    }, 2000);


}


function cratchList(url) {
    superagent.get(url)
        .set('header', header)
        .end(function (error, data) {
            if (error) {
                console.log("cratch href "+url+" error exception occured :"+ error.toString());
                return next(error);
            }
            var $ = cheerio.load(data.text);    //注意传递的是data.text而不是data本身

            $('.olt .title a').each(function (idx, element) {
                var $element = $(element);


                var href = $element.attr("href");

                //if (href) {
                //    if (hrefSet.has(href)) {
                //        //todo 存在
                //    } else {
                //
                //        hrefSet.add(href);
                inputHrefs.push({"href": href});
                //    }
                //}

            });

            logJson("cratchList", inputHrefs);

            //fs.writeFile('hourse.json', JSON.stringify(arr) , function(err){
            //    if(err) throw err;
            //    console.log('exists.txt已存在，内容被覆盖！');
            //});
            //

            loopParse()

        });
    console.log("cratchList end");
}

function logJson(log, json) {
    console.log(log + ":" + JSON.stringify(json));
}


function loopParse() {
    var delay = randomNum(3000, 5000);
    var timer = setInterval(function () {
        if (inputHrefs.length < 1) {
            clearInterval(timer);
        } else {
            parseListHref();
        }

    }, delay);
}

function parseListHref() {

    console.log('parseListHref start inputHrefs size:' + inputHrefs.length);
    var item = inputHrefs.pop();
    //do{
    if (item) {
        var href = item['href'];

        console.log('parseListHref:' + href);

        if (hrefSet.has(href)) { //如果缓存href集合里存在 则不抓取

            DETECT++;

            console.log(href + ' exist before');
            return;
        }

        superagent.get(href)
            .set('header', header)
            .end(function (error, data) {

                if (error) {
                    console.log("error exception occured :" + error.toString());
                    return next(error);
                }

                //var html = iconv.decode(data.text, 'gb2312')
                var $ = cheerio.load(data.text, {decodeEntities: false}) //注意传递的是data.text而不是data本身


                var title = $('.tablecc ').text();

                if (title == '') {
                    title = $('#content h1').text();
                }

                var content = '';
                $('.topic-doc .topic-content p').each(function (idx, element) {

                    content += $(element).html();

                });

                console.log('content:' + content);

                var datetime = $('.topic-doc .color-green').text();

                datetime = datetime.split(' ')[0];

                if (!datetime || datetime == '') {
                    return;
                }

                if (!verifyDate(datetime)) { // 3个月以外 不爬虫
                    return;
                }


                if (currentDatetime != datetime) {
                    currentDatetime = datetime; //保存当前

                    readHrefSet(datetime, function (exist, set) {


                        if (hrefSet.has(href)) {
                            DETECT++;
                            console.log(href + ' exist after');
                            return;
                        }

                        apppendHref(datetime, href);

                        var imgHrefArray = [];

                        $('.topic-content .topic-figure img').each(function (idx, element) {
                            var $element = $(element);

                            imgHrefArray.push({
                                "id": idx,
                                "href": $element.attr("src")
                            });
                        });


                        if (title) {
                            combine(href, datetime, title, content, imgHrefArray);
                        } else {
                            console.log('no title: href-> ' + href);
                        }


                    });
                } else {
                    apppendHref(datetime, href);

                    var imgHrefArray = [];


                    $('.topic-content .topic-figure img').each(function (idx, element) {
                        var $element = $(element);

                        imgHrefArray.push({
                            "id": idx,
                            "href": $element.attr("src")
                        });
                    });


                    if (title) {
                        combine(href, datetime, title, content, imgHrefArray);
                    } else {
                        console.log('no title: href-> ' + href);
                    }
                }

            });

    }

    //}while ((item = inputHrefs.pop()))


    console.log('parseListHref end');

}

function parseDetail() {

}


function combine(href, datatime, title, content, imgHrefArray) {
    console.log('combine start title ' + title + " imgs size:" + imgHrefArray.length);
    var titlemd5 = getMD5(title.toString());
    var imgPathsArray = [];

    var serverpath = base +'/' + titlemd5;

    var localpath = baseDir + '/' + titlemd5;
    //创建文件夹存储图片
    fs.exists(localpath, function (exists) {
        if (!exists) {
            fs.mkdir(localpath, 0o777, function (err) {
                if (!err) {

                    async.mapLimit(imgHrefArray, imgHrefArray.length, function (item, callback) {

// delay 的值在 2000 以内，是个随机的整数
                        var delay = randomNum(1500, 4000);

                        setTimeout(function () {

                            var server_imgpath = serverpath + '/' + item.id + '.jpg';

                            var local_imgpath = localpath + '/' + item.id + '.jpg';
                            var stream = fs.createWriteStream(local_imgpath);
                            var req = request.get(item.href).pipe(stream);

                            imgPathsArray.push(server_imgpath);

                            callback(null, req);

                        }, delay);


                    }, function (err, res) {

                        if (!err) {

                            var jsonarray = [];
                            jsonarray.push({
                                "title": title,
                                "content": content,
                                "hrefArray": imgPathsArray,
                                "imgpath": titlemd5,
                                "datatime": datatime,
                                "href": href
                            });
                            console.log('图片下载完毕 ');

                            bulkIndex(indexname, typename, jsonarray);
                        }
                    });

                }
            });
        }
    });

    console.log('combine end');
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

    client.del
    client.search(indexname, body)
        .then(results => {
            console.log(`found ${results.hits.total} items in ${results.took}ms`);
            console.log(`returned article titles:`);
            results.hits.hits.forEach((hit, index) => console.log(`\t${body.from + ++index} - ${hit._source.title}`));
        })
        .catch(console.error);
}

function apppendHref(datetime, href) {

    DETECT = 0;

    var result = href + '|';

    var dir = baseCacheDir + space + city;

    var file = dir + space + datetime + '.txt';
    fs.exists(dir, function (exist) {

        if (exist) {
            fs.appendFile(file, result, function () {
                console.log(file + ' 存在; 添加content:' + result);
            });
        } else {

            fs.mkdir(dir, 0o777, function (err) {
                if (!err) {
                    fs.appendFile(file, result, function () {
                        console.log(file + ' 创建成功 添加content:' + result);
                    });
                } else {
                    console.log(file + ' 创建失败' + err.toString());
                }
            });
        }
    });
}

function init() {

    var date = new Date();

    currentDatetime = moment(date).format('YYYY-MM-DD');

    console.log(currentDatetime);
    readHrefSet(currentDatetime, function (exist, set) {

        if (exist) {
            console.log(currentDatetime + '.txt exist');
        }
    });  //初始化读取当前日期抓取的href

}

function readHrefSet(datetime, callback) {

    var file = baseCacheDir + space + city + space + datetime + '.txt';
    fs.exists(file, function (exist) {


        if (exist) {

            fs.readFile(file, {flag: 'r+', encoding: 'utf8'}, function (err, data) {

                if (!err) {
                    data.split('|').forEach(item=> {

                        if (item) {
                            hrefSet.add(item);
                        }
                    })
                }

                callback(exist, null);
            });


        } else {
            callback(exist, null);
        }
    });


}

function verifyDate(datetime) {
    return (moment(new Date()).diff(moment(datetime), "days") < 30 * 3);
}

function test() {

    superagent.get("https://www.douban.com/group/topic/102482092/")
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
                //var $element = $(element);


                //var href = $element.html();
                html += $(element).html()


            });

            console.log(html);

        });
    console.log("cratchList end");

}

//生成从minNum到maxNum的随机数
function randomNum(minNum, maxNum) {
    switch (arguments.length) {
        case 1:
            return parseInt(Math.random() * minNum + 1, 10);
            break;
        case 2:
            return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
            break;
        default:
            return 0;
            break;
    }
}

Promise.resolve()
    //.then(test)
    .then(dropIndex)
//    .then(initIndex)
//    .then(init)
//    .then(doCratch)
