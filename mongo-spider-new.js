/**
 * Created by chaowei on 2017/5/1.
 */

var elasticsearch;

// var client = new elasticsearch.Client({
//     host: '127.0.0.1:9200',
//     log: 'error'
// });

var client;

var House = require(__dirname + "/h_model/house_upload");

var MongoClient = require('mongodb').MongoClient;
var settings = require(__dirname + "/settings");
MongoClient.connect("mongodb://" + settings.ip + "/" + settings.db, function (err, db) {

});

//var indexname = 'hourse_datasource';
var indexname = 'hourse_test';
var typename = 'hourse_type';
var filename = 'hourse.json';
var mkdirp = require('mkdirp');

var User_House = require(__dirname + '/h_model/user_house');
var House = require(__dirname + '/h_model/house_upload');

var superagent = require("superagent");
require('superagent-proxy')(superagent);
// var proxy_uri = process.env.http_proxy || 'http://203.198.94.132:80';
var proxy_uri = process.env.http_proxy
var domain = require('domain');

//require('superagent-proxy')(superagent);

var cheerio = require("cheerio");
var Promise = require('bluebird');

var moment = require('moment');
var request = require('request');

var url = require('url');

//var proxy = '121.232.144.27:9000';

//async提供简单,强大的功能来处理异步JavaScript
var async = require('async');
//nodejs自带文件和文件夹处理库
//此处应用图片下载和文件夹创建
var fs = require('fs');
var util = require(__dirname + '/util');
var space = '/';
var baseCacheDir = __dirname + space + 'datasource';

var CAPTURE_PAGE_MAX = 8;

var PAGE_MAX = 2;
var UPLOAD_NUM_MAX = 20;


var CAPTURE_TASK_TYPE_TOTAL = 1;
var CAPTURE_TASK_TYPE_DAY = 2;

var CAPTURE_TASK_TYPE = CAPTURE_TASK_TYPE_DAY;

var last_page_start = 0;

var goingDeleteHouseData = [];


var crypto = require('crypto');
var iconv = require('iconv-lite');

let ELASTIC_SEARCH_NORMAL = 0;

var spider_source_settings = require(__dirname + '/spider_source_domain_setting');

//https://www.douban.com/group/beijingzufang/discussion?start=0 // 25递增
var baseUrl = 'https://www.douban.com/group/beijingzufang/discussion?start=';

var header = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36'
}

var headertest = {
    'User-Agent': ' Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.2 Safari/605.1.15'
}

var header2 = {
    'User-Agent': ' Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.2 Safari/605.1.15'
}


var baseDir = __dirname + '/public/images';

//var base = 'images';
var base = 'images';

var DETECT = 0; // ++达到10,说明之后是老数据 则停止抓取


var resultArray = []; //解析完后的数据

var picUrlList = []; //存储图片地址，并发下载
var mmLaList = []; //存储信息

var hourseMap = { 'id': 33 };




var oldTagSet = new Set;


var currentDatetime;


var DATETIME_DEADLINE = 1; // 爬虫已经到了deadline

var HREF_DUPLICATE = 2; // href已经爬过，超过十个

var MAX_PAGE_OVER = 3; // 达到最大数量

var CAPTURE_INIT = 0;

var capture_state = CAPTURE_INIT;

let root_timer;
var parent_timer;

let Regular = require(__dirname + '/Test_Regular')

let from = '豆瓣租房';
let houseDateMap = new Map(); // key: date, value: string数组，list<title>
let houseUrlMap = new Map(); // href 去重
var tagHrefMap = new Map(); // title tag 去重
var newTagSet = []; //未解析列表页链接tag
let MAX_DAY_DUR = 16; // 最大天数间隔

var d = domain.create();
d.on('error', function (err) {
    console.log('uncaughtException domain catch error:' + err + '  time:' + util.formatDate(new Date()));

    // doCapture();
});

process.on('uncaughtException', function (e) {
    console.error('uncaughtException ' + e.stack + '  time:' + util.formatDate(new Date()));

    /// Makesure error outputed before process exit.
    process.stderr.write('', function () {
        // process.exit(1);
        // doCapture();
    });
});


var download = function (uri, filename, callback) {
    request.head(uri, function (err, res, body) {
        // console.log('content-type:', res.headers['content-type']);
        // console.log('content-length:', res.headers['content-length']);

        d.run(() => {

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
    return client.indices.create({ index: indexname });
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

    client.bulk({ body: bulkBody })
        .then(response => {
            let errorCount = 0;
            response.items.forEach(item => {
                if (item.index && item.index.error) {
                    console.log(++errorCount, item.index.error);
                }
            });
            console.log(`Successfully indexed ${data.length - errorCount} out of ${data.length} items`);
        }).catch((err) => {
            console.log(err.toString());
            ELASTIC_SEARCH_NORMAL = -1;
        });
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

var ProxyPool = require(__dirname + '/proxy/proxy_pool.js')


let UseProxy = false

let ONE_DAY_CAPTURE = 0;
let FULL_DAY_CAPTURE = 1;
let capture_type = ONE_DAY_CAPTURE;

function doCapture() {

    if (capture_type === ONE_DAY_CAPTURE) {
        doLoopWorkForDay((err) => {
            console.log('doCapture:' + err);
        });
    }

    if (capture_type === FULL_DAY_CAPTURE) {
        doLoopWorkForTotal((err) => {
            console.log('doCapture:' + err);
        });
    }
}


// 100天全量数据
function doLoopWorkForTotal(next) {

    console.log('doLoopWorkForTotal 全量抓取100页');
    CAPTURE_TASK_TYPE = CAPTURE_TASK_TYPE_TOTAL;
    PAGE_MAX = 30;

    console.log("doLoopWork start time:" + util.formatDate(new Date()));
    if (parent_timer) {
        clearInterval(parent_timer);
    }
    initDoCatch();

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

function testProxyPool() {

    ProxyPool.startWork()
    // await ProxyPool.loadIpData()
    // var check = ProxyPool.run
    // await check()

    // // ProxyPool.ips((err, response) => {
    // //     console.log('ips:' + JSON.stringify(response))
    // // })

    // const rsp = await ProxyPool.getRandomIP()

    // console.log('rsp:' + JSON.stringify(rsp))

}

function checkProxyConfig() {
    var check = ProxyPool.check
    check()
    console.log('check checkProxyConfig start')
    UseProxy = !UseProxy
    if (UseProxy) {
        // ProxyPool.ips((err, response) => {

        //     if (response.length > 0) {
        //         const proxy = response[0]
        //         if (proxy) {

        //         }
        //         // proxy_uri = `${proxy.type.toLowerCase()}://${proxy.ip}:${proxy.port}`
        //         console.log('check checkProxyConfig ips:' + JSON.stringify(response[0]))
        //     }
        // })

    } else {
        // proxy_uri = process.env.http_proxy
    }
}

// 抓取最近更新的数据，detect重复过多就停止
function doLoopWorkForDay(next) {
    console.log('doLoopWorkForDay 非全量抓取');

    CAPTURE_TASK_TYPE = CAPTURE_TASK_TYPE_DAY;
    console.log("doLoopWork start time:" + util.formatDate(new Date()));

    PAGE_MAX = 1;
    initDoCatch();

    checkProxyConfig()
    setInterval(function () {

      checkProxyConfig()

    }, 10 * 60 * 1000); // 10分钟上传一次

    doWork(next);
    parent_timer = setInterval(function () {
        last_page_start = 0;
        console.log("doLoopWork start time:" + util.formatDate(new Date()));
        doWork(next);
    }, 200 * 60 * 1000); // 两小时间隔 抓一次；

    setInterval(function () {
        uploadhouselist(1); // 
    }, 3 * 60 * 1000); // 3分钟上传一次
}

function doWork(next) {

    let city_arr = spider_source_settings.domain_setting;
    let page = PAGE_MAX;
    for (let i = 0; i < page; i++) {
        setTimeout(function () {
            console.log("doWork start time:" + util.formatDate(new Date()) + ' page start: ' + i * 25);
            doWorkTask(city_arr, next)

        }, i * 8 * 60 * 1000) // 翻页抓取间隔7分钟
    }
}

function doWorkTask(city_arr, next) {

    let total_index = 0;
    for (let i = 0; i < city_arr.length; i++) {
        let url_arr = city_arr[i].url_array;
        let ll = url_arr.length;
        for (let j = 0; j < ll; j++) {

            let wait = (total_index++) * 120 * 1000;

            console.log('doWorkTask:' + url_arr[j] + ' waiting :' + wait + ', time:' + util.formatDate(new Date()));
            setTimeout(() => {

                doCratch(city_arr[i].dir_name, city_arr[i].city_name, url_arr[j], last_page_start, next);
            }, wait);

        }
    }
}


function doCratch(dir, city, url, page_start, next) {

    var action = '?start=';
    let surl_arr = url.split('?');
    var baseurl;

    if (surl_arr.length === 2) {
        baseurl = surl_arr[0] + action;
    } else {
        console.log('doCratch split url error from:' + url + ' time:' + util.formatDate(new Date()));
        return;
    }

    var start = page_start * 25;

    if (randomNum(1, 2) % 2 === 0) {
        header = header2;
    } else {
        header = headertest
    }

    let targetUrl = baseurl + (start);

    if (ELASTIC_SEARCH_NORMAL === 0) {
        cratchList(dir, city, targetUrl, next);
    }

}

function cratchList(dir, _city, url, next) {
    const city = _city;

    superagent.get(url)
        .proxy(proxy_uri)
        .set('header', ProxyPool.getRandomUserAgent())
        // .disableTLSCerts()
        .end(function (error, data) {
            if (error) {
                console.log("execption scratching over cratch href " + url + " error exception occured :" + error.toString() + ' ' + util.formatDate(new Date()));
                var fs = require('fs');
                fs.writeFile(__dirname + "/execption.txt", util.formatDate(new Date()), function (err) {
                    if (err) {
                       console.log(err);
                    }
                });
                setTimeout(() => {
                    process.exit(0)
                }, 1000 * 2);

                next(-1, error.toString());
                return;
            }
            if (ELASTIC_SEARCH_NORMAL !== 0) {
                console.log("elastch fail state ------------------------");
                return;
            }
            var $ = cheerio.load(data.text);    //注意传递的是data.text而不是data本身

            $('.olt tr').each(function (idx, element) {
                var $element = $(element);
                var th = $element.attr('class');

                if (th === '') {
                    var name = $(this).children('td[nowrap=nowrap]').first().text(); // 豆瓣用户名

                    var $$ = cheerio.load($(this).children('.title').html());

                    var href = $$('a').attr('href');
                    var title = $$('a').attr('title');

                    if (title.length > 10) {
                        let tag = getMD5(name + '_' + title);
                        if (!tagHrefMap.has(tag) && !houseUrlMap.has(href)) {
                            console.log('push tag:' + tag + ' href:' + href + ' time:' + util.formatDate(new Date()));

                            tagHrefMap.set(tag, { href: href, city: city });
                            houseUrlMap.set(href, 0);
                            newTagSet.push(tag);
                            DETECT = 0;
                        } else {
                            DETECT++;
                            console.log(href + ' exist before DETECT is : ' + DETECT);
                        }
                    }
                   
                } else {

                }
            });

            // if (DETECT === 20) {
            //     capture_state = HREF_DUPLICATE;
            //     return;
            // }

            loopParse(dir, city)

        });
    console.log("scratching over end" + ' time:' + util.formatDate(new Date()));
}

function logJson(log, json) {
    console.log(log + ":" + JSON.stringify(json));
}

var mkdirs = function (dirpath, callback) {
    fs.exists(dirpath, function (exists) {
        if (exists) {
            callback();
        } else {
            //尝试创建父目录，然后再创建当前目录
            mkdirs(path.dirname(dirpath), function () {
                fs.mkdir(dirpath, callback);
            });
        }
    })
};


function loopParse(dir, _city) {
    const city = _city
    var delay = randomNum(10000, 20000);
    var timer = setInterval(function () {
        if (newTagSet.length < 1) {
            clearInterval(timer);
        } else {
            parseListHref(dir, city);
        }

    }, delay);
}

function parseListHref(dir, _city) {

    console.log('parseListHref start inputHrefs size:' + newTagSet.length + ' time:' + util.formatDate(new Date()) + ' :' + newTagSet);
    var tag = newTagSet.pop();
    //do{
    if (tag) {
        const obj = tagHrefMap.get(tag)
        var href = obj.href;
        const city = obj.city;

        if (href === undefined || href === '' || href.length === 0) {
            console.log("href is empty : " + href);
            return;
        }

        console.log('parseListHref:' + href + ' ' + util.formatDate(new Date()));

        superagent.get(href)
            .set('header', header)
            .proxy(proxy_uri)
            .end(function (error, data) {

                if (error) {
                    console.log("error exception occured :" + error.toString() + ' time:' + util.formatDate(new Date()));
                    return;
                }

                //var html = iconv.decode(data.text, 'gb2312')
                var $ = cheerio.load(data.text, { decodeEntities: false }) //注意传递的是data.text而不是data本身

                var title = $('.tablecc ').text();

                if (title === '') {
                    title = $('#content h1').text();
                }

                var content = '';
                $('.topic-doc .topic-content p').each(function (idx, element) {

                    content += $(element).html();
                });

                if (content === '' || title === '' || content.length < 20 || title.length < 8) {
                    return;
                }

                var datetime = $('.topic-doc .color-green').text();

                if (!datetime || datetime === '') {
                    return;
                }

                if (!verifyDate(datetime)) {
                    console.log(href + ' is old time ' + datetime + ' <—— deadline time' + ' time:' + util.formatDate(new Date()))
                    // capture_state = DATETIME_DEADLINE;
                    return;
                }

                console.log('content:' + content);
                var imgHrefArray = [];

                if (currentDatetime !== datetime) {
                    currentDatetime = datetime; //保存当前

                    // apppendHref(tag, dir, city, datetime, href);

                    $('.topic-content .image-container .image-wrapper img').each(function (idx, element) {
                        var $element = $(element);
                        console.log('img href: ' + $element.attr("src"));
                        if (imgHrefArray.length <= 10) {
                            imgHrefArray.push($element.attr("src"));
                        }
                    });


                    if (title) {
                        combine(tag, dir, city, href, datetime, title, content, imgHrefArray);
                    } else {
                        console.log('no title: href-> ' + href);
                    }

                } else {
                    // apppendHref(tag, dir, city, datetime, href);

                    $('.topic-content .image-container .image-wrapper img').each(function (idx, element) {
                        var $element = $(element);

                        console.log('img href: ' + $element.attr("src"));
                        if (imgHrefArray.length <= 10) {
                            imgHrefArray.push($element.attr("src"));
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


let request_queue = [];
// let baseUploadHouseApi = 'https://sharevideo.cn/51finder/ch_list';
// let baseUploadHouseApi = 'http://127.0.0.1:3000/api/topic/upload520';
let baseUploadHouseApi = 'https://sharevideo.cn/api/topic/upload520';
// let baseUploadHouseApi = 'https://sharevideo.cn/51finder/ch_list';


var mGeoStationJson = {}

/**
 * city: geolist ()
 */
var mGeoStationMap = new Map() 

function loadGeoStationDataJson() {

    // 同步读取
    var data = fs.readFileSync(__dirname + '/GeoStationData.json');
    // console.log("同步读取: " + JSON.stringify(JSON.parse(data.toString()).subway_region[0].subways_detail));

    mGeoStationJson = JSON.parse(data.toString())

    var geoList = []
    if (mGeoStationJson.data.length > 0) {
        geoList = mGeoStationJson.data
    }

    const beijingGeoList = []
    const wuhanGeoList = []

    geoList.forEach((item) => {

        if (item.city === '北京') {
            beijingGeoList.push(item)
        }

        if (item.city === '武汉') {
            wuhanGeoList.push(item)
        }
       
    })

    mGeoStationMap.set('北京', beijingGeoList)
    mGeoStationMap.set('武汉', wuhanGeoList)
    Regular.loadSubwaysJson()

    // const subways_detail = subway_region.subways_detail
    // const regions_detail = subway_region.regions_detail

    // subways_detail.forEach(item => {

    //     mSubwayStationsMap.set(item.subway_name, item.station_list)
    //     // console.log('subways_detail item:' + item.subway_name)
    // });

    // regions_detail.forEach(item => {
    //     mRegionStationsMap.set(item.region_name, item.station_list)
    // })

    // console.log('mSubwayStationsMap:' + mSubwayStationsMap)


    // mSubwayStationsJson = '' // read file json
}


function getTags(city, title, content) { // todo
    return Regular.matchTags(title + ' ' + content);
}

function getRentGeoTags(city, title, content) {
    return Regular.regularRentContent(city, title + ' ' + content)
}

function getRentGeoFullTags(city, title, content) {
    const titleTags = Regular.regularRentContent(city, title)
    if (titleTags.length === 0) {
        return Regular.regularRentContent(city, content)
    }
    return titleTags
}

// tags to ids
function getRentGeoIds(city, title, content) {

    const rentGeoIds = []
    const rentGeoTags = getRentGeoFullTags(city, title, content)
    const geoHashs = []

    const geoList = mGeoStationMap.get(city)
    const tagNameArray = []

    console.log('rentGeoTags:' + JSON.stringify(rentGeoTags))
    if (geoList) {
        rentGeoTags.forEach(item => {
            // console.log('item:' + JSON.stringify(item))

            if (item.pname !== '' && item.cname !== '') {
                for (const it of geoList) {
                    if (it.pname === item.pname && it.cname === item.cname) {

                        rentGeoIds.push(it.geoStationId)
                        // geoHashs.push(it.geoHash)
                        tagNameArray.push(it.pname + '-' + it.cname)
                        break
                    }
                }
            } else {
              
                if (item.pname !== '') {
                    tagNameArray.push(item.pname) // 只有parent name,即 行政名称 或者地铁名称
                }
            }
        })
    }

    const result = {
        rentGeoIds: rentGeoIds,
        tags: tagNameArray
    }

    return result
}

function test_getRentGeoIds () {
    var testContent = `6号线 物资学院 新建村二期 大阳光房出租`

    // console.log(orignJson.district_list)

    var result = getRentGeoIds('北京' , "" , testContent)

    console.log('match result:' + JSON.stringify(result))
}

function checkQiuzu(content) {
    
}

function combine(tag, dir, city, href, datetime, title, content, imgHrefArray) {
    console.log('combine start href ' + href + " title :" + title + " datetime:" + datetime + " city:" + city);

    if (isExistingHouse(datetime, title, city)) {
        console.log('重复')
        return
    }

    var from = '豆瓣租房';

    let tags = []
    if (city === '北京' || city === '武汉') {
        tags = getTags(city, title, content);
        console.log('combine start href ' + href + " tags :" + tags);
    }

    var rentGeoIds = []
    if (city === '北京' || city === '武汉') {
        const result = getRentGeoIds(city, title, content)
        rentGeoIds = result.rentGeoIds
        tags = result.tags
        console.log('rent match tags: ' + JSON.stringify(result))
    } else {
        console.log('no rentGeoIds');
    }

    const house = new House({
        from: from,
        title: title,
        href: href,
        imgurl_list: imgHrefArray,
        content: content,
        date: datetime,
        city: city,
        tags: tags,
        rentGeoIds: rentGeoIds
    });

    request_queue.push(house);

    uploadhouselist(0);

    house.save((err, obj) => {

        if (!err) {
            console.log('house save:' + JSON.stringify(obj));
        } else {
            console.log(err);
        }
    });

    console.log('combine end' + ' time:' + util.formatDate(new Date()));
}

function uploadhouselist(force) {

    if (request_queue.length <= 0) {
        return;
    }

    if (force === 0) {
        if (request_queue.length > UPLOAD_NUM_MAX) {
            uploadDate(request_queue);
            request_queue = [];
        }
    } else {
        uploadDate(request_queue);
        request_queue = [];
    }
}

var fs = require("fs");
var https = require("http");

function uploadDate(data) {

    let body = { adu: 'weichao_admin', houselist: data };

    // var postData=JSON.stringify(body);
    //
    // var options = {
    //     host: "localhost",
    //     path: "/51finder/ch_list",
    //     port: 3000,
    //     method: "POST",
    //     headers:{
    //         "Content-Type": "application/json",
    //         'Content-Length': Buffer.byteLength(postData),
    //         'Connection': 'keep-alive'
    //     }
    // };
    //
    // var req = https.request(options, function (res) {
    //     console.log(res.statusCode);
    //     res.on("end",function(){
    //         console.log("upload success " + data + "  " + util.formatDate(new Date()))
    //     });
    // });
    //
    // req.on("error",function(err){
    //     console.log("upload error:" + err.message);
    // });
    //
    // req.write(postData);

    console.log('body:' + JSON.stringify(body))

    request({
        url: baseUploadHouseApi,
        method: "POST",
        json: true,
        headers: {
            "Content-Type": "application/json",
            'Content-Length': Buffer.byteLength(JSON.stringify(body)),
            'Connection': 'keep-alive'
        },
        body: body
    }, function (error, response, body) {
        if (response.statusCode === 200) {
            console.log("upload success : " + JSON.stringify(response) + " " + util.formatDate(new Date()))
        } else {
            console.log("uploadDate error : " + error);
        }
    });
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

var href_city_map = new Map();

function getCityChineseName(city_en) {
    let city_ch = '';
    if (city_en === 'beijing') {
        city_ch = '北京';
    }
    if (city_en === 'shanghai') {
        city_ch = '上海';
    }
    if (city_en === 'wuhan') {
        city_ch = '武汉';
    }
    if (city_en === 'chengdu') {
        city_ch = '成都';
    }
    if (city_en === 'shenzhen') {
        city_ch = '深圳';
    }
    if (city_en === 'nanjing') {
        city_ch = '南京';
    }
    if (city_en === 'hangzhou') {
        city_ch = '杭州';
    }
    return city_ch;
}



function updateCityToEs() {

    var root = baseCacheDir;
    var res = [], files = fs.readdirSync(root);
    files.forEach(function (file) {

        let city = file;

        let child_files = fs.readdirSync(root + space + file);

        child_files.forEach((fi) => {

            let target = root + space + file + space + fi;

            fs.readFile(target, { flag: 'r+', encoding: 'utf8' }, function (err, data) {

                if (!err) {
                    data.split('|').forEach(item => {

                        if (item && item.trim() !== '') {
                            let arr = item.split('_');
                            // oldTagSet.add(arr[0]);
                            // tagHrefMap.set(arr[0], arr[1]);
                            //
                            href_city_map.set(arr[1], city);

                            // console.log(arr[1] + '------- ' + city);
                        }
                    })
                }
            });

        });

    });

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
        client.search({ index: indexname, type: typename, body: body })
            .then(results => {

                let ind = 0;

                results.hits.hits.forEach((hit, index) => {

                    // houseData.push({
                    //     title: hit._source.title,
                    //     content: hit._source.content,
                    //     hrefArray: hit._source.hrefArray,
                    //     imgpath: hit._source.imgpath,
                    //     datetime: hit._source.datatime,
                    //     href: hit._source.href,
                    //     _id: hit._id
                    // });


                    let href = hit._source.href;
                    let city_en = href_city_map.get(href);

                    let city_ch = getCityChineseName(city_en);
                    let datetime = hit._source.datatime;

                    let body = {
                        doc: {
                            // city: city_ch,
                            // from: from,
                            // forbid: 0
                            times: new Date(datetime)
                        }
                    };

                    console.log(href + '........' + city_ch + ' ,index: ' + (ind++));

                    client.update({ index: indexname, type: typename, id: hit._id, body: body }, (err, rsp) => {

                    });

                }
                );
            });
    })
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

            list.forEach(function (file) {

                readHrefSet(dir_name, file, (exist) => {
                });
            });
        } catch (e) {
            console.log(e.toString());
        }

    }
    console.log("read old href source over.")

}

function sortDatetime(a, b) {
    return Date.parse(a.datatime) - Date.parse(b.datatime);
}

let backup_dir = __dirname + space + 'backup';


function updateHouseDataFromESToFile() {


    // let indexname = 'house_back_'+ util.getDateNow();
    //
    // let exist = client.indices.exists({index: indexname});
    //
    // if (exist === true) {
    //     client.indices.delete({index: indexname});
    // }
    //
    // client.indices.create({index: indexname});

    client.count({
        index: indexname
    }).then((result) => {

        console.log('count:' + result.count);
        let body = {
            size: result.count,
            sort: [{ "times": { "order": "desc" } }],
            query: {
                match_all: {}
            }
        };

        let houseData = [];
        // console.log('readHouseDataFromESToFile ' + ' time:' + util.formatDate(new Date()));
        client.search({ index: indexname, type: typename, body: body })
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


                    console.log(hit._source.datatime);
                    let body = {
                        doc: {
                            // from: '豆瓣租房',
                            // city: '北京',
                            // times: new Date(hit._source.datatime)
                        }
                    };

                    client.update({ index: indexname, type: typename, id: hit._id, body: body }, (err, rsp) => {

                    });

                }
                );
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
        client.search({ index: indexname, type: typename, body: body })
            .then(results => {

                console.log('before ' + results.hits.hits.length + ' time:' + util.formatDate(new Date()));

                results.hits.hits.forEach((hit, index) => {

                    houseData.push({
                        from: hit._source.from,
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
                backup_dir = backup_dir + space + util.getNowFormatDate();
                let file = backup_dir + space + 'house_es' + '.txt';
                console.log('write');


                let size = 0;
                fs.exists(backup_dir, function (exist) {

                    if (exist) {
                        fs.writeFileSync(file, "");

                        houseData.forEach((item, index) => {
                            let cont = genHouseItemString(item.from, item.city, item.title, item.content, item.hrefArray, item.imgpath, item.datetime, item.href);
                            fs.appendFile(file, cont, function () {
                                console.log(cont + ' 添加成功:' + size++);
                            });
                        });
                    } else {

                        mkdirp(backup_dir, function (err) {
                            if (err) console.error(err);
                            else {
                                houseData.forEach((item, index) => {
                                    let cont = genHouseItemString(item.from, item.city, item.title, item.content, item.hrefArray, item.imgpath, item.datatime, item.href);
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

function genHouseItemString(from, city, title, content, hrefArray, imgpath, datatime, href) {
    let parent_delt = '&$';
    let child_delt = '@#';

    return filter(from, parent_delt, child_delt) + child_delt + filter(city, parent_delt, child_delt) + child_delt + filter(title, parent_delt, child_delt) + child_delt + filter(content, parent_delt, child_delt) + child_delt
        + hrefArray + child_delt + imgpath + child_delt + datatime + child_delt + href + parent_delt;
}

function writeHouseDataFromFileToES() {

    let parent_delt = '&$';
    let child_delt = '@#';

    let file = backup_dir + space + util.getNowFormatDate() + space + 'house_es' + '.txt';

    let indexname = 'house_back_' + util.getNowFormatDate();

    client.indices.exists({ index: indexname }).then((exist) => {
        if (exist) {
            console.log('delete index:' + indexname);
            return client.indices.delete({
                index: indexname
            });
        }
    }).then(() => {
        client.indices.create({ index: indexname }, (err, res) => {

            fs.exists(file, function (exist) {

                if (exist) {

                    fs.readFile(file, { flag: 'r+', encoding: 'utf8' }, function (err, data) {

                        if (!err) {
                            let totalNum = 0;

                            data.split(parent_delt).forEach(item => {

                                if (item && item.trim() !== '') {
                                    let array = item.split(child_delt);

                                    var houseData = [];
                                    houseData.push({
                                        from: array[0],
                                        city: array[1],
                                        title: array[2],
                                        content: array[3],
                                        hrefArray: array[4],
                                        imgpath: array[5],
                                        datatime: array[6],
                                        href: array[7]
                                    });
                                    totalNum++;
                                    const ind = totalNum;
                                    setTimeout(() => {

                                        bulkIndex(indexname, typename, houseData);
                                        console.log('writeHouseDataFromFileToES success. total num:' + ind);
                                    }, totalNum * 10);



                                }
                            });


                        } else {
                            console.log("read error from file " + file + ' : ' + err.toString())
                        }

                    });

                } else {
                    console.log(file + " not exist.")
                }
            });

        });
    });

    // if (exist === true) {
    //
    //     // client.indices.create({index: indexname});
    //     // client.indices.delete({index: indexname});
    //
    //     client.indices.delete({
    //         index: indexname
    //     }, function(err, res) {
    //
    //         if (err) {
    //             console.error(err.message);
    //         } else {
    //             console.log('Indexes have been deleted!');
    //
    //         }
    //     });
    // } else {
    //     client.indices.create({index: indexname}, (err, res) => {
    //
    //
    //         fs.exists(file, function (exist) {
    //
    //             if (exist) {
    //
    //                 fs.readFile(file, {flag: 'r+', encoding: 'utf8'}, function (err, data) {
    //
    //                     if (!err) {
    //                         let totalNum = 0;
    //                         data.split(parent_delt).forEach(item => {
    //
    //                             if (item && item.trim() !== '') {
    //                                 let array = item.split(child_delt);
    //
    //                                 var houseData = [];
    //                                 houseData.push({
    //                                     from: array[0],
    //                                     city: array[1],
    //                                     title: array[2],
    //                                     content: array[3],
    //                                     hrefArray: array[4],
    //                                     imgpath: array[5],
    //                                     datatime: array[6],
    //                                     href: array[7]
    //                                 });
    //
    //                                 setTimeout(()=>{
    //                                     bulkIndex(indexname, typename, houseData);
    //                                     console.log('writeHouseDataFromFileToES success. total num:' + totalNum);
    //                                 }, totalNum * 1000);
    //
    //                                 totalNum++;
    //
    //                             }
    //                         });
    //
    //                         console.log('writeHouseDataFromFileToES success. total num:' + totalNum);
    //                     } else {
    //                         console.log("read error from file " + file + ' : ' + err.toString())
    //                     }
    //
    //                 });
    //
    //             } else {
    //                 console.log(file + " not exist.")
    //             }
    //         });
    //
    //     });
    // }
    //


}

function readHrefSet(dir, filename, callback) {

    var file = baseCacheDir + space + dir + space + filename;
    oldTagSet.clear();
    tagHrefMap.clear();

    fs.exists(file, function (exist) {

        if (exist) {

            fs.readFile(file, { flag: 'r+', encoding: 'utf8' }, function (err, data) {

                if (!err) {
                    data.split('|').forEach(item => {

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


function queryBatch() {

    let body = {
        docs: [
            { _index: indexname, _type: typename, _id: 'd6eZfmUBGbOJNG1ZaRnS' },
            { _index: indexname, _type: typename, _id: 'YqcIamUBGbOJNG1ZyAb1' }
        ]
    };

    client.mget({ index: indexname, type: typename, body: { ids: ['d6eZfmUBGbOJNG1ZaRnS', 'YqcIamUBGbOJNG1ZyAb1'] } })
        .then(results => {

            console.log(results);
            // console.log('before ' + results.hits.hits.length + ' time:' + util.formatDate(new Date()));
            // console.log('');
            results.docs.forEach((hit, index) => {
                var datetime = hit._source.datatime;

                console.log(datetime);

            }
            );


        })


    // let friend_ids = ['5b83546515462ea16465009f','5b8a47942466ecd10d56069f'];
    //
    // User_Friend.find({
    //     '_id': { $in: [
    //             mongoose.Types.ObjectId('5b83546515462ea16465009f'),
    //             mongoose.Types.ObjectId('5b8a47942466ecd10d56069f')
    //         ]}
    // }, function(err, docs){
    //     console.log(docs);
    // });


}

let DELETE_DAY_SIZE = 60;

function deleteOldHouseData() {
    let body = {
        query: {
            match: {}
        }
    };
    console.log('deleteing house deleteOldHouseData ' + ' time:' + util.formatDate(new Date()));
    client.search({ _index: indexname, _type: typename, body: body })
        .then(results => {

            console.log('before ' + results.hits.hits.length + ' time:' + util.formatDate(new Date()));

            results.hits.hits.forEach((hit, index) => {
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
                    }, (err, resp) => {

                        if (err) {
                            console.log('delete fail house: id' + house._id + ' href:' + house.href + ' err:' + err + ' time:' + util.formatDate(new Date()));
                            return
                        }

                        House.remove({ _id: house._id }, function (err, obj) {
                            if (err) {
                                console.log(err.toString() + ' time:' + util.formatDate(new Date()));
                                return;
                            }
                            if (obj) {
                                console.log(obj);
                            }
                        });

                        User_House.remove({ house_id: house._id }, (err, obj) => {
                            if (err) {
                                console.log(err.toString() + ' time:' + util.formatDate(new Date()));
                                return;
                            }
                            if (obj) {
                                console.log(obj);
                            }
                        });

                        console.log('delete response:' + resp + ' time:' + util.formatDate(new Date()));

                    })
                });

                console.log('delete goingDeleteHouseData size:' + goingDeleteHouseData.length + ' time:' + util.formatDate(new Date()));

                goingDeleteHouseData.clear();
            } else {
                console.log('deleteing house empty. time:' + util.formatDate(new Date()));
            }

        })

}

function initDoCatch() {

    House.find({}, (err, results) => {

        if (err) {
            console.log('[read house from db] error:' + err);
        }
        if (results) {
            houseUrlMap.clear();
            let size = 0;
            results.forEach((obj, ind) => {
                if (obj.from_type === 0 && houseUrlMap.has(obj.href)) {
                    House.remove({ title: obj.title }, (err, res) => {
                        // if (!err) {
                        console.log(obj.title + ':' + JSON.stringify(res))
                        // }
                    })
                } else {
                    houseUrlMap.set(obj.href, ind);

                    setToOldDateHouseDataSource(obj)
                }

                size = ind;
            });

            console.log('[read house from db][houselist size : ' + (size + 1) + ']' + ' houseUrlMap size :' + houseUrlMap.size)
        } else {
            console.log('[read house from db] no results');
        }

    });
}

function setToOldDateHouseDataSource(obj) {
    const date = JSON.stringify(obj.date)

    const key = date.split('T')[0].split('"')[1]
    if (houseDateMap.has(key)) {
        houseDateMap.get(key).push(obj)
    } else {
        var array = new Array()
        array.push(obj)
        houseDateMap.set(key, array)
    }
}

function isExistingHouse(datetime, title, city) {
    // console.log('houseDateMap:' + JSON.stringify(houseDateMap))
    const date = datetime
    var isExist = false
    if (houseDateMap.has(date)) {
        const array = houseDateMap.get(date)
        array.forEach(key => {
            if (city === key.city) {
                if (util.stringSimilarity(key.title, title)) {
                    isExist = true
                    return true
                }
            }
        });
    }
    return isExist
}

// 16天
function verifyDate(datetime) {
    return (moment(new Date()).diff(moment(datetime), "days") < MAX_DAY_DUR);
}

function catch_list() {
    superagent.get('https://www.douban.com/group/beijingzufang/discussion?start=50')
        .set('header', header)
        .end(function (error, data) {
            if (error) {

                console.log("scratching over cratch href " + " error exception occured :" + error.toString());
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

    superagent.get("http://wx.deepba.com/paper/news/bxsh/")
        .set('header', headertest)
        .end(function (error, data) {
            if (error) {
                console.log("error exception occured !" + error.toString());
                return next(error);
            }
            var $ = cheerio.load(data.text, { decodeEntities: false });    //注意传递的是data.text而不是data本身
            //console.log('catch ' +$('.topic-doc .topic-content p').html());

            var html = '';
            // $('.topic-doc .topic-content p').each(function (idx, element) {
            //
            //     html += $(element).html()
            //
            // });
            $('.img-thumbnail').each(function (idx, element) {

                var $element = $(element);
                html += $element.attr("src")

            });
            console.log(url.parse(html, true).query.token);

            // $('.topic-content .image-container .image-wrapper img').each(function (idx, element) {
            //     var $element = $(element);
            //
            //     console.log($element.attr("src"));
            //     // imgHrefArray.push({
            //     //     "id": idx,
            //     //     "href": $element.attr("src")
            //     // });
            // });


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

function find_user() {
    let cityName = '北京';


    let body = {
        sort: [{ "times": { "order": "desc" } }],
        // sort: [{ "datatime": { "order": "asc" } }],
        query: {
            match: {
                city: cityName
            }
        }
    };

    var array = [];

    client.search({
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

            if (20 > array.length && response.hits.total > 20) {
                //        // now we can call scroll over and over
                client.scroll({
                    scrollId: response._scroll_id,
                    scroll: '1000s'
                }, getMoreUntilDone);
            } else {

                var more = -1;
                var scrollId = -1;
                if (response.hits.total > 20) {
                    scrollId = response._scroll_id;
                    more = 0;
                }

                // array.sort(sortDatetime);

                array.forEach((val, ind) => {
                    console.log(JSON.stringify(val))
                });


            }
        }
    });
}

function test_date_compare() {
    let res = verifyDate('2018-12-31T08:14:50.000Z')

    console.log('res:' + res)
}


function test_string_simmiar() {
    var stringSimilarity = require('string-similarity');

    var similarity = stringSimilarity.compareTwoStrings('地铁15号线花梨坎，套装家具', ' 包物业包取暖，套装家具');

    console.log('test_string_simmiar:' + similarity);
}

function test_isExistingHouse() {

    // var items = [
    //     { character: "Guybrush Threepwood", game: "The Secret of Monkey Island" },
    //     { character: "Manny Calavera", game: "Grim Fandango" },
    //     { character: "Bernard Bernoulli", game: "Maniac Mansion" }
    // ];

    // var list = new List('users', items);

    // list.search('gu thre'); // return none
    // list.fuzzySearch.search('gu thre')
    var datetime = "2021-05-23"
    var title = "通州梨园"


    setTimeout(()=>{
        isExistingHouse(datetime, title, "北京")
    }, 15000)


}


var Spider = {};

Spider.doCapture = doCapture;

module.exports = Spider;


Promise.resolve()
    // .then(indexOf('1000转租东坝金隅汇景苑单间（近将台）'));
    // .then(catch_list);
    //  .then(dropIndex)
    // .then(initIndex)
    //     .then(test_list())
    // .then(test_date_compare())
    //     .then(test_date_compare())
    // .then(uploadDate(""))
    // .then(testProxyPool)
    .then(loadGeoStationDataJson())
        // .then(initDoCatch)
    .then(doCapture())
    // .then(test_isExistingHouse())
    // .then(test_getRentGeoIds())

    // .then(() => {
    //     console.log('hello')
    //     // console.log('constl:' + util.getDistance(116.323294, 39.893874, 116.319429, 40.070882))
    // })
    // .then(test_string_simmiar())
    // .then(initDoCatch)
    // .then(updateCityToEs)
    // .then(readHouseDataFromESToFile)
 // .then(updateHouseDataFromESToFile)
 // .then(writeHouseDataFromFileToES);
