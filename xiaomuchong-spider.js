/**
 * Created by chaowei on 2017/5/1.
 */

var TiaojiPost = require(__dirname + "/tiaoji_model/tiaoji_post")
var TiaojiPostAndScore = require(__dirname + "/tiaoji_model/tiaoji_post_and_score")
var TiaojiPostAndMajor = require(__dirname + "/tiaoji_model/tiaoji_post_and_major")
const Tiaoji_Domain_Settings = require(__dirname + "/tiaoji_domain_setting")
const Province_And_University_Settings = require(__dirname + "/tiaoji_domain_province_and_university")

var request = require("superagent");
var superagent = require('superagent-charset')(request)
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


var UPLOAD_NUM_MAX = 20;

var ProxyPool = require(__dirname + '/proxy/proxy_pool.js')

var CAPTURE_TASK_TYPE_TOTAL = 1;
var CAPTURE_TASK_TYPE_DAY = 2;

var last_page_start = 0;

var crypto = require('crypto');
var iconv = require('iconv-lite');



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

var oldTagSet = new Set;

var CAPTURE_INIT = 0;

var capture_state = CAPTURE_INIT;

let root_timer;
var parent_timer;

let Regular = require(__dirname + '/Test_Regular')

let MAX_DAY_DUR = 6; // 最大天数间隔


const xiaomuchong_baseurl = "http://muchong.com"
let postUrlMap = new Map(); // href 去重
let editingPostUrlMap = new Map(); // 正在更改中的Post： 列表页设置一部分属性，详情页补全且保存

// 调剂帖子与分数 map
let postAndScoreMap = new Map()

let uploadFlag = 0

let ongoingPostUrlList = [];
let ongoingScoreUrlMap = new Map();

let majorAndSubMajorMap = new Map() // 


String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

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


// 抓取调剂 前40页 全量数据
function doLoopWorkForTotal(next) {

    console.log('doLoopWorkForTotal 全量抓取100页');
  
    initDoCatch();

    const base_xiaomuchong_diaoji_url = 'http://muchong.com/f-430-'

    let last_page_start = 1
    cratchMainPage(base_xiaomuchong_diaoji_url + last_page_start, (errno, err_str) => {
        if (errno == -1) {
            ongoingPostUrlList.push(base_xiaomuchong_diaoji_url + last_page_start)
        }

        next(errno, err_str)
    })

    parent_timer = setInterval(function () {

        if (last_page_start === 5) {
            clearInterval(parent_timer);
            console.log('调剂帖子全量抓取结束 ---------------------------------------------');
        } 

        const xiaomuchong_diaoji_url = base_xiaomuchong_diaoji_url + last_page_start

        console.log("doLoopWork start time:" + util.formatDate(new Date()) + " 抓取链接：" + xiaomuchong_diaoji_url);

        cratchMainPage(xiaomuchong_diaoji_url, (errno, err_str) => {
            if (errno == -1) {
                ongoingPostUrlList.push(xiaomuchong_diaoji_url)
            }

            next(errno, err_str)
        })

        last_page_start++;

    }, 5 * 60 * 1000); // 每一页间隔 5分钟

    setInterval(function () {
       tryUploadTiaojiData()

    }, 30 * 60 * 1000); // 半小时检测一次
}

// 抓取最近更新的数据，detect重复过多就停止
function doLoopWorkForDay(next) {
    console.log('doLoopWorkForDay 非全量抓取');

    CAPTURE_TASK_TYPE = CAPTURE_TASK_TYPE_DAY;
    console.log("doLoopWork start time:" + util.formatDate(new Date()));

    PAGE_MAX = 1;
    initDoCatch();

    doWork(next);
    parent_timer = setInterval(function () {
        last_page_start = 1;
        console.log("doLoopWork start time:" + util.formatDate(new Date()));
        doWork(next);
    }, 20 * 60 * 1000); // 半小时间隔 抓一次；

    setInterval(function () {
        tryUploadTiaojiData()
    }, 15 * 60 * 1000); // 半小时检测一次
}

// 一次爬2个page
function doWork(next) {

    var xiaomuchong_diaoji_url = 'http://muchong.com/f-430-'

    cratchMainPage(xiaomuchong_diaoji_url + 1, next)

    setTimeout(() => {
        cratchMainPage(xiaomuchong_diaoji_url + 2, next)

    }, 30000);
}

const Email_Regex = /\w+@\w+\.\w+(\.\w+)?/g;
const PhoneNumber_Regex = /\b1\d{10}\b/g
const ZuojiNumber_Regex = /0\d{2,3}-\d{7,8}/


function toDate(dateStr) {
    var parts = dateStr.split("-")
    return new Date(parts[0], parts[1] - 1, parts[2])
}

function tryUploadTiaojiData() {
    console.log('tryUploadTiaojiData ' + util.formatDate(new Date()))
    if (ongoingPostUrlList.length == 0 && ongoingScoreUrlMap.size == 0) {
        uploadFlag++
        if (uploadFlag > 3) { // 标记 避免频繁上传
            console.log('开始上传数据 ')
            uploadTiaojilist(1)
        }
    }
}

function cratchMainPage(url, next) {
    console.log('调剂列表页抓取 start，url:' + url + ',' + util.formatDate(new Date()))
    superagent.get(url)
        .proxy(proxy_uri)
        .charset('gbk')
        .set('header', ProxyPool.getRandomUserAgent())
        .end(function (error, data) {
            if (error) {
                console.log("execption scratching over cratch href " + url + " error exception occured :" + error.toString() + ' ' + util.formatDate(new Date()));
                var fs = require('fs');
                fs.writeFile(__dirname + "/execption.txt", util.formatDate(new Date()), function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
                // setTimeout(() => {
                //     process.exit(0)
                // }, 1000 * 2);

                next(-1, error.toString());
                return;
            }
     
            var $ = cheerio.load(data.text, { decodeEntities: false })     //注意传递的是data.text而不是data本身

            let existing_number = 0
            $('.xmc_bpt tbody .forum_list').each(function (idx, element) {
                // var tb = $(element).html();
                // var th = $(element('.forum_list').children('th').second().html();

                // var th_list = cheerio.load(tb)
                

                var th = $(element).children('th')
                var tiaoji_type = th.eq(1).children().first().text().trim();
                var tiaoji_title = th.eq(1).children('a').first().text().trim();
                var tiaoji_jump_url = th.eq(1).children('a').first().attr('href');
                var tiaoji_datetime = th.eq(2).children('span').first().text().trim();
                var tiaoji_poster_url = th.eq(2).children('cite').first().children('a').first().attr('href');
                var tiaoji_poster_name = th.eq(2).children('cite').first().children('a').first().text().trim();
              
                if (tiaoji_type.includes('硕士') && tiaoji_title.length > 10) {
                    if (!postUrlMap.has(tiaoji_jump_url)) {
                        console.log('tiaoji_type：' + tiaoji_type)
                        console.log('tiaoji_title：' + tiaoji_title)
                        console.log('tiaoji_jump_url：' + tiaoji_jump_url)
                        console.log('tiaoji_datetime：' + tiaoji_datetime)
                        console.log('tiaoji_poster_url:' + tiaoji_poster_url)
                        console.log('tiaoji_poster_name:' + tiaoji_poster_name)

                        existing_number = 0;

                        let post = new TiaojiPost({
                            user_url: tiaoji_poster_url,
                            post_url: tiaoji_jump_url,
                            post_datetime: toDate(tiaoji_datetime),
                            post_title: tiaoji_title,
                            // province_id: 101 // 北京=101
                        });

                        editingPostUrlMap.set(tiaoji_jump_url, post);

                        ongoingPostUrlList.push(tiaoji_jump_url)

                    } else {
                        existing_number++;
                        console.log(tiaoji_jump_url + ' exist before DETECT is : ' + existing_number);
                    }
                }

                // post_uname: { type: String, default: "" }, // 小木虫发帖者，或者其他发帖者
                // user_url: { type: String, default: "" }, // 发帖者个人主页，链接
                // post_url: { type: String, default: "" }, // 帖子链接
                // post_datetime: Date, // 发帖时间 年月日-时分秒
                //     post_title: { type: String, default: "" }, // 帖子标题
                // college_name: { type: String, default: "" }, // 高校名称
                // major_top_class: { type: String, default: "" }, // 一级分类 eg:工学 (工学->环境科学与工程->环境科学)
                // major_second_class: { type: String, default: "" }, // 二级分类，专业名称， eg: 化学（专业: 理学->化学->无机化学）
                // major_third_class: { type: String, default: "" }, // 三级分类，专业名称， eg: 无机化学（专业: 理学->化学->无机化学）
                // grade_level: { type: String, default: "" }, // 年级，eg: 2022
                // recruit_num: { type: String, default: "" }, // 招收人数
                // email: { type: String, default: "" },   // 邮箱
                // phone_number: { type: String, default: "" }, // 手机号
                // description: { type: String, default: "" }, // 调剂详情
                // extra: { type: String, default: "" } // 额外信息
                
            });

            if (existing_number === 20) {
                console.log("scratching over end 重复太多，达到十次以上" + util.formatDate(new Date()));
                return;
            }

            loopParse()

        });
    console.log("scratching over end" + ' time:' + util.formatDate(new Date()));
}

// 仅仅抓取调剂详情页中的 分数列表
function cratchScoreContent(url, next) {
    const exact_url = xiaomuchong_baseurl + url
    // console.log('cratchScoreContent start:' + exact_url)
    superagent.get(exact_url)
        .proxy(proxy_uri)
        .charset('gbk')
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
                // setTimeout(() => {
                //     process.exit(0)
                // }, 1000 * 2);

                next(-1, error.toString());
                return;
            }

            var $ = cheerio.load(data.text, { decodeEntities: false })     //注意传递的是data.text而不是data本身

            var userAndScoreMap = new Map()
            $('.wrapper .solid .xmc_Pages .multi tbody tr td').each(function (idx, ele) {
                var $ele = $(ele)

                if (idx == 1) {
                    var page_text = $ele.text()
                    if (page_text.indexOf('/')) {
                        var totalPage = page_text.split('/')[1]
                        totalPage = totalPage > 5 ? 5 : totalPage
                        console.log('cratchScoreContent 学生分数页面 totalPage:' + totalPage)
                        if (totalPage >=1) {

                            var base_page_url = exact_url.substring(0, exact_url.length - 1)

                            var page_makedone_mark = 0

                            for (let index = 1; index <= totalPage; index++) {

                                ongoingScoreUrlMap.set(base_page_url + index, null)
                                cratchMorePageGrade(base_page_url, index, (usrUrl, usrName, totalScore, majors, englishScore, politicsScore, kemuoneScore, kemutwoScore) => {

                                    userAndScoreMap.set(usrUrl, {
                                        usrName,
                                        usrUrl,
                                        postUrl: url,
                                        totalScore,
                                        majors,
                                        englishScore,
                                        politicsScore,
                                        kemuoneScore,
                                        kemutwoScore
                                    })

                                },
                                    (page) => {

                                        page_makedone_mark++;
                                        if (page_makedone_mark == totalPage) {

                                            var userAndScoreArray = Array.from(userAndScoreMap)

                                            userAndScoreArray.sort(function (a, b) { return b[1].totalScore - a[1].totalScore })

                                            // 比较分数差异，提取新增用户分数 数组

                                            TiaojiPostAndScore.find({post_url: url}, (err, results) => {

                                                if (err) {
                                                    console.log('[read TiaojiPostAndScore find from db] error:' + err);
                                                    return
                                                }

                                                if (results) {

                                                    userAndScoreArray.forEach(atom => {
                                                        // console.log('atom:' + JSON.stringify(atom[1]))

                                                        let exist = false
                                                        for (let obj of results) {
                                                            if (obj.user_url === atom[1].usrUrl) {
                                                                exist = true
                                                                break
                                                            }
                                                        }

                                                        if (exist === false) {

                                                            var user_score = new TiaojiPostAndScore({
                                                                user_name: atom[1].usrName,
                                                                user_url: atom[1].usrUrl,
                                                                post_url: atom[1].postUrl,
                                                                total_score: atom[1].totalScore,
                                                                english_score: atom[1].englishScore,
                                                                politic_score: atom[1].politicsScore,
                                                                kemu_one_score: atom[1].kemuoneScore,
                                                                kemu_two_score: atom[1].kemutwoScore,
                                                                major_top_class: getFirstMajor(atom[1].majors),
                                                                major_second_class: getSecondMajor(atom[1].majors),
                                                                major_third_class: getSpecificMajor(atom[1].majors)
                                                            })

                                                            user_score_queue.push(user_score)
                                                            user_score.save()
                                                        }
                                                      
                                                    })

                                                }
                                            }) 




                                            // console.log('userAndScoreArray:' + JSON.stringify(userAndScoreArray))
                                        }

                                        ongoingScoreUrlMap.delete(base_page_url + page)
                                    }, next)
                            }

                        }
                    }
                }
            })

        })


}

// 抓取调剂页面 详情页内容，包含分数列表
function cratchDetailPage(url, next) {
    const exact_url = xiaomuchong_baseurl + url
    console.log('parseListHref start ongoingPostUrlList size:' + ongoingPostUrlList.length + ' time:' + util.formatDate(new Date()) + ', url :' + exact_url);

    superagent.get(exact_url)
        .proxy(proxy_uri)
        .charset('gbk')
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
                // setTimeout(() => {
                //     process.exit(0)
                // }, 1000 * 2);

                next(-1, error.toString());
                return;
            }

            var $ = cheerio.load(data.text, { decodeEntities: false })     //注意传递的是data.text而不是data本身

            // 发帖人信息
            var usr = $('.pls_user h3').children('a').first()
            var usr_jump_url = usr.attr('href')
            var usrname = usr.text().trim()

            // 调剂信息
            var thlist = $('.adjust_table tbody').children('tr')

            var colleage_name = thlist.eq(1).children().last().text().trim()
            var major = thlist.eq(2).children().last().text().trim()
            var grade_level = thlist.eq(3).children().last().text().trim()
            var recruit_num = thlist.eq(4).children().last().text().trim()

            var description = $('.t_fsz table tbody tr').children('td').first().text().trim()

            // 在详情页面 过滤一些帖子
            if ((major == '' && grade_level == '') || description.length < 20) {

                console.log('调剂帖子内容不完全，跳过：' + url)
                
                postUrlMap.set(url, null)

                editingPostUrlMap.delete(url)
                return
            }



            console.log('个人信息 ------')
            console.log('usr_jump_url:' + usr_jump_url)
            console.log('usename:' + usrname)
            console.log('调剂信息 =======')
            console.log('colleage_name:' + colleage_name)
            console.log('major:' + major)

            if (major.includes('\n')) {
                major = major.split('\n')[0].trim()
            }
            
            console.log('grade_level:' + grade_level)
            console.log('recruit_num:' + recruit_num)
            console.log('description:' + description)

              // post_uname: { type: String, default: "" }, // 小木虫发帖者，或者其他发帖者
                // user_url: { type: String, default: "" }, // 发帖者个人主页，链接
                // post_url: { type: String, default: "" }, // 帖子链接
                // post_datetime: Date, // 发帖时间 年月日-时分秒
                //     post_title: { type: String, default: "" }, // 帖子标题
                // college_name: { type: String, default: "" }, // 高校名称
                // major_top_class: { type: String, default: "" }, // 一级分类 eg:工学 (工学->环境科学与工程->环境科学)
                // major_second_class: { type: String, default: "" }, // 二级分类，专业名称， eg: 化学（专业: 理学->化学->无机化学）
                // major_third_class: { type: String, default: "" }, // 三级分类，专业名称， eg: 无机化学（专业: 理学->化学->无机化学）
                // grade_level: { type: String, default: "" }, // 年级，eg: 2022
                // recruit_num: { type: String, default: "" }, // 招收人数
                // email: { type: String, default: "" },   // 邮箱
                // phone_number: { type: String, default: "" }, // 手机号
                // description: { type: String, default: "" }, // 调剂详情
                // extra: { type: String, default: "" } // 额外信息

            if (editingPostUrlMap.has(url)) {
                const post = editingPostUrlMap.get(url)
                post.major_top_class = getFirstMajor(major)
                
                const major_id = getMajorID(post.major_top_class)
                if (major_id == 0) {
                    console.log('专业大类 未找到，跳过。url=' + url + ' 待解析的大类专业名称=' + post.major_top_class)
                    editingPostUrlMap.delete(url)
                    return
                }

                post.major_id = major_id
                post.colleage_name = colleage_name
        
                let colleage_match = getProvinceAndUniversity(colleage_name)
                if (colleage_match) {
                    let province = colleage_match.province
                    let university = colleage_match.university

                    if (university) {
                        // post.is211 = university.is211
                        // post.is985 = university.is985
                        // post.yi_liu = university.isDoubleFirstStream
                    }

                    post.province_id = province != null ? province.provinceId : 0
                } 
               
                post.major_second_class = getSecondMajor(major)
                post.major_third_class = getSpecificMajor(major)

                post.grade_level = grade_level
                post.recruit_num = recruit_num

                let email = description.match(Email_Regex)
                if (email !== null && email.length > 1) {
                    email = email[0]
                }
                let phone = description.match(PhoneNumber_Regex)
                if (phone === null ) {
                    phone = description.match(ZuojiNumber_Regex)
                }
                if (phone !== null && phone.length > 1) {
                    phone = phone[0]
                }
                console.log('url:' + exact_url)
                console.log('major_top_class:' + post.major_top_class)
                console.log('major_second_class:' + post.major_second_class)
                console.log('major_third_class:' + post.major_third_class)

                console.log('email:' + email)
                console.log('phone:' + phone)

                post.email = email
                post.phone_number = phone
                post.post_uname = usrname

                // 联系方式
                post.description = description

                postUrlMap.set(post.post_url, post)

                request_queue.push(post);

                post.save((err, obj) => {

                    if (!err) {
                        console.log(`post save. url=${obj.post_url}`);
                    } else {
                        console.log(err);
                    }
                });

                editingPostUrlMap.delete(url)


                // 提取该帖子的 专业标签

                // const majorSubIds = 

                // 抓取学生填写的分数
                var description = $('.t_fsz table tbody tr').children('td').first().text().trim()


                console.log('学生分数抓取 ----------------')


            
            $('.wrapper .solid .xmc_Pages .multi tbody tr td').each(function (idx, ele) {
                var $ele = $(ele)

                if (idx == 1) {
                    var page_text = $ele.text()
                    if (page_text.indexOf('/')) {
                        var totalPage = page_text.split('/')[1]

                        console.log('cratchDetailPage 学生分数页面 totalPage:' + totalPage)
                        totalPage = totalPage > 5 ? 5 : totalPage
                        if (totalPage >= 1) {

                            var base_page_url = exact_url.substring(0, exact_url.length - 1)

                            var page_makedone_mark = 0

                            for (let index = 1; index <= totalPage; index++) {

                                ongoingScoreUrlMap.set((base_page_url + index), null)
                                
                                var userAndScoreMap = new Map()

                                cratchMorePageGrade(base_page_url, index, (usrUrl, usrName, totalScore, majors, englishScore, politicsScore, kemuoneScore, kemutwoScore) => {

                                    userAndScoreMap.set(usrUrl, {
                                        usrName,
                                        usrUrl,
                                        postUrl: url,
                                        totalScore,
                                        majors,
                                        englishScore,
                                        politicsScore,
                                        kemuoneScore,
                                        kemutwoScore
                                    })

                                },
                                (page) => {

                                    page_makedone_mark++;
                                    // if (page_makedone_mark == totalPage) {

                                        // console.log(`post_score save. url=${url}`);

                                        var userAndScoreArray = Array.from(userAndScoreMap)

                                        userAndScoreArray.sort(function (a, b) { return b[1].totalScore - a[1].totalScore })

                                        // user_name: { type: String, default: "" }, // 跟帖用户名
                                        // user_url: { type: String, default: "" }, // 跟帖个人主页，链接
                                        // post_url: { type: String, default: "" }, // 帖子链接
                                        // post_datetime: Date, // 跟帖时间 年月日-时分秒

                                        //     total_score: { type: Number, default: 0 }, // 总分
                                        // english_score: { type: Number, default: 0 }, // 英语分数
                                        // politic_score: { type: Number, default: 0 }, // 政治分数
                                        // kemu_one_score: { type: Number, default: 0 }, // 科目一分数
                                        // kemu_two_score: { type: Number, default: 0 }, // 科目二分数
                                        // major_top_class: { type: String, default: "" }, // 一级分类 eg:工学 (工学->环境科学与工程->环境科学)
                                        // major_second_class: { type: String, default: "" }, // 二级分类，专业名称， eg: 化学（专业: 理学->化学->无机化学）
                                        // major_third_class: { type: String, default: "" }, // 三级分类，专业名称， eg
                                   

                                        // post.major_top_class = getFirstMajor(major)
                                        // post.major_second_class = getSecondMajor(major)
                                        // post.major_third_class = getSpecificMajor(major)
                                   
                                        userAndScoreArray.forEach(atom => {
                                            // console.log('atom:' + JSON.stringify(atom[1]))
                                            var user_score = new TiaojiPostAndScore({
                                                user_name: atom[1].usrName,
                                                user_url: atom[1].usrUrl,
                                                post_url: atom[1].postUrl,
                                                total_score: atom[1].totalScore,
                                                english_score: atom[1].englishScore,
                                                politic_score: atom[1].politicsScore,
                                                kemu_one_score: atom[1].kemuoneScore,
                                                kemu_two_score: atom[1].kemutwoScore,
                                                major_top_class: getFirstMajor(atom[1].majors),
                                                major_second_class: getSecondMajor(atom[1].majors),
                                                major_third_class: getSpecificMajor(atom[1].majors)
                                            })

                                            TiaojiPostAndScore.findOne({ post_url: atom[1].postUrl, user_url: atom[1].usrUrl, total_score: atom[1].totalScore }, (err, obj) => {
            
                                                if (err) {
                                                    console.log(`TiaojiPostAndScore findOne. url=${atom[1].postUrl}, error=${err}`);
                                                }
                                                if (!obj) {
                                                    user_score_queue.push(user_score)

                                                    user_score.save((err, obj) => {
                                                        if (!err) {
                                                            // console.log(`score save. url=${obj.post_url}`);
                                                        } else {
                                                            console.log(err);
                                                        }
                                                    })
                                                }
                                            })
                                           
                                        })

                                    console.log('url:' + (base_page_url + page) + " scores size:" + userAndScoreArray.length)
                                    // }

                                    ongoingScoreUrlMap.delete(base_page_url + page)// 删除标记

                                }, next)
                            }

                        }
                    }
                }
            })

            }

        });
    console.log("scratching over end" + ' time:' + util.formatDate(new Date()));
}




function getMajorSubIDs(post) {

   const majors = majorAndSubMajorMap.get(post.major_top_class)
   if (majors) {
       const match_origin = post.major_second_class + ' ' + post.major_third_class

       majors.forEach(item => {
           item.name
       })
   }
}


function getMajorID(colleage_name) {

    let colleage_id = 0
    switch(colleage_name) {
        case '工学':
            colleage_id = 101
            break
        case '理学':
            colleage_id = 102
            break
        case '哲学':
            colleage_id = 103
            break
        case '经济学':
            colleage_id = 104
            break
        case '法学':
            colleage_id = 105
            break
        case '教育学':
            colleage_id = 106
            break
        case '文学':
            colleage_id = 107
            break
        case '历史学':
            colleage_id = 108
            break
        case '农学':
            colleage_id = 109
            break
        case '医学':
            colleage_id = 110
            break
        case '军事学':
            colleage_id = 111
            break
        case '管理学':
            colleage_id = 112
            break
        case '艺术学':
            colleage_id = 113
            break
        default:
            break
    }

    return colleage_id
}


function getProvinceID_similar(colleage_name) {

    for (let province of Province_And_University_Settings.provinceUniversityDatasource) {
        for (let university of province.universityTotal) {
            sim = util.stringSimilaritySecond(colleage_name, university.name)
            if (sim > 0.55) {
                return { province, university }
            }
        }
    }
    return null
}

function getProvinceID_Match(colleage_name) {

    for (let province of Province_And_University_Settings.provinceUniversityDatasource) {
        for (let university of province.universityTotal) {
            if (university.name === colleage_name) {
                return { province, university }
            }
        }
    }
    return null
}

function getProvinceID_MatchProvice(colleage_name) {

    for (let province of Province_And_University_Settings.provinceUniversityDatasource) {
        if (province.provinceName.includes("省") || province.provinceName.includes("市")) {
            matchword = province.provinceName.substring(0, province.provinceName.length - 1)
        }
        if (colleage_name.includes(matchword)) {
            return { province, university: null }
        }
    }
    return null
}


function getProvinceAndUniversity(colleage_name) {
    // console.log(colleage_name + " colleage_name:")
    let proName = null
    if (colleage_name.includes("大学") || colleage_name.includes("学院")) {
        proName = getProvinceID_Match(colleage_name)
    } else if (colleage_name.endsWith("大")) {
       
        proName = getProvinceID_similar(colleage_name)
       
    } else {
        proName = getProvinceID_Match(colleage_name + "大学")
    }

    // 再来一次
    if (proName == null) {
        proName = getProvinceID_similar(colleage_name)
    }

    // 特别case
    if (proName == null) {
        proName = getProvinceID_MatchProvice(colleage_name)
    }

    if (proName == null) {
        switch(colleage_name) {
            case '哈工程':
                return {
                    "is985": false,
                    "universityId": "800004",
                    "is211": true,
                    "name": "哈尔滨工程大学",
                    "isDoubleFirstStream": true
                }

        }
    }

    // console.log(colleage_name + " in pro:" + proName.provinceName)

    return proName
}

function cratchMorePageGrade(base_url, page, callback, endcallback, next) {
    var url = base_url + page
    // console.log(' cratchMorePageGrade：' + url)
    superagent.get(url)
        .proxy(proxy_uri)
        .charset('gbk')
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
                // setTimeout(() => {
                //     process.exit(0)
                // }, 1000 * 2);

                next(-1, error.toString());
                return;
            }

            var $ = cheerio.load(data.text, { decodeEntities: false })     //注意传递的是data.text而不是data本身

            $('.wrapper .maincontent table tbody').each(function (idx, element) {
                if (idx < 2) { // 跳过一些无关节点
                    // console.log(' html 解析 没有发现分数排名数据：' + base_url) 
                    return
                }

                var $element = $(element)

                var usr = $element.children('tr').first().children('td').first().children('div').first().children('h3').first().children('a').first()
                var usr_url = usr.attr('href')
                var usr_name = usr.text()

                if (usr_url == undefined || usr_name == undefined) {
                    // console.log(' html 解析 用户等重要数据没有：' + usr.html()) 
                    return
                }
           
                var usr_grade = $element.children('tr').first().children('td').last().children('div').first().children('div').first().children('table').first().children('tbody').first().children('tr').first().children('td').first()
        
                if (!usr_grade.html()) {
                    // console.log(' html body 获取失败：' + base_url + ' body:' + usr_grade.html()) 
                    return
                }

                if (!usr_grade.html().includes('<br>')) {
                    // console.log(' html 不包含br 标签：' + url) 
                    return
                }

                var scoreItems = usr_grade.html().split('<br>')
                if (scoreItems !== undefined && scoreItems.length == 6) {

                    if (!scoreItems[0].includes(':') 
                        || !scoreItems[1].includes(':') 
                        || !scoreItems[2].includes(':')
                        || !scoreItems[3].includes(':')
                        || !scoreItems[4].includes(':')
                        || !scoreItems[4].includes(':')) {
                        console.log(' 分数格式不对：' + url) 
                            return
                        }
                
                    // console.log('scoreItems:' + JSON.stringify(scoreItems))
                    var totalScore = scoreItems[0].split(':')[1].trim()
                    var majors = scoreItems[1].split(':')[1]
                   
                    const englishScores = scoreItems[2].split(':')
                    if (englishScores.length !== 2) return
                    var englishScore = englishScores[1].trim()

                    const politicsScores = scoreItems[3].split(':')
                    if (politicsScores.length !== 2) return
                    var politicsScore = politicsScores[1].trim()

                    const kemuoneScores = scoreItems[4].split(':')
                    var kemuoneScore = '0'
                    if (kemuoneScores.length == 2) {
                        kemuoneScore = kemuoneScores[1].trim()
                        if (kemuoneScore == '') kemuoneScore = '0'
                    }

                    const kemutwoScores = scoreItems[5].split(':')
                    var kemutwoScore = '0'
                    if (kemutwoScores.length == 2) {
                        kemutwoScore = kemutwoScores[1].trim()
                        if (kemutwoScore == '') kemutwoScore = '0'
                    }

                    if (totalScore == '') {
                        console.log(' 分数解析错误：' + url) 
                        return
                    }

                    // 存在小数
                    if (totalScore.includes('.')
                        || englishScore.includes('.')
                        || politicsScore.includes('.')
                        || kemuoneScore.includes('.')
                        || kemutwoScore.includes('.')) {
                        console.log(' 分数存在小数：' + url) 
                        return
                    }

                    var regPos = /^[1-9]\d*$/; // 非负整数

                    // 不合法。类似于这种：74（六级512）
                    if (!regPos.test(totalScore)
                        || !regPos.test(englishScore)
                        || !regPos.test(politicsScore)
                        || !regPos.test(kemuoneScore)
                        || !regPos.test(kemutwoScore)
                        ) {
                        console.log(' 分数包含非整数：' + url) 
                        return
                    }

                    // console.log('kemuoneScore:' + kemuoneScore + " kemutwoScore:" + kemutwoScore + " url:" + url)

                    callback(usr_url, usr_name, totalScore, majors, englishScore, politicsScore, kemuoneScore, kemutwoScore)
                }
            });

            endcallback(page)

        })
}

function getFirstMajor(major) {
    if (!major.includes('->')) {
        return major.trim()
    }

    const majors = parseMajors(major)
    if (majors.length >= 2) {
        return majors[0].trim();
    }
    return majors.trim()
}

function getSecondMajor(major) {
    if (!major.includes('->')) {
        return major.trim()
    }

    const majors = parseMajors(major)
    if (majors.length >= 2) {
        return majors[1].trim();
    }
    return majors.trim()
}

function getSpecificMajor(major) {
    if (!major.includes('->')) {
        return major.trim()
    }

    const majors = parseMajors(major)

    if (majors.length >= 2) {
        return majors[majors.length - 1].trim();
    }
    return majors.trim()
}

function parseMajors(major_origin) {
    if (major_origin.includes('->')) {
        return major_origin.split('->')
    }
    return major_origin.trim()
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


function loopParse() {
    var delay = randomNum(1000, 5000);
    var timer = setInterval(function () {
        if (ongoingPostUrlList.length < 1) {
            console.log("队列中的帖子已经执行完毕：" + util.formatDate(new Date()));
            
            uploadTiaojilist(0)

            clearInterval(timer);
        } else {

            const url = ongoingPostUrlList.pop();
            if (url !== undefined) {
                cratchDetailPage(url, (errno, err_str) => {
                    if (errno === -1) {
                        ongoingPostUrlList.push(url)
                    }
                })
            }
          
        }

    }, delay);

    var doubleScratchTimer = setInterval(() => {
        if (doubleScratchPosts.length < 1) {
            clearInterval(doubleScratchTimer)
        } else {
            const post = doubleScratchPosts.pop();
            if (post !== undefined) {
                cratchScoreContent(post.post_url, (errno, err_str) => {
                    if (errno === -1) {
                        doubleScratchPosts.push(post)
                    }
                })
            }
        }
    }, delay)
}

let request_queue = []; // 新抓取的调剂post列表
let user_score_queue = []; // 调剂post下面的分数列表，也会包含再次抓取的帖子
let doubleScratchPosts = []; // 选择5天内的帖子 重新抓取分数列表 看是否更新user_score

// let baseUploadHouseApi = 'https://sharevideo.cn/51finder/ch_list';
// let baseUploadHouseApi = 'http://127.0.0.1:3000/api/topic/upload520';
let baseUploadHouseApi = 'https://sharevideo.cn/api/topic/upload520';
// let baseUploadTiaojiApi = 'http://127.0.0.1:8082/api/tiaoji/upload520';
let baseUploadTiaojiApi = 'https://sharevideo.cn/api/tiaoji/upload520';
// let baseUploadHouseApi = 'https://sharevideo.cn/51finder/ch_list';


function uploadTiaojilist(force) {

    if (request_queue.length <= 0) {
        console.log('uploadTiaojilist no data')
        return;
    }

    uploadFlag = 0 // 标记 避免频繁上传

    if (force === 0) {
        if (request_queue.length > UPLOAD_NUM_MAX) {
            uploadDate(request_queue, () => {});
            request_queue = [];
            user_score_queue = []
        }
    } else {

        uploadDate(request_queue, () => { });
        request_queue = [];
        user_score_queue = []
    }
}

var fs = require("fs");
var https = require("http");
const { post } = require("superagent");

function uploadDate(data, next) {

    let pbody = { adu: 'weichao_admin', tiaojilist: data, usrscorelist: user_score_queue };

    // console.log('body:' + JSON.stringify(pbody))

    request({
        url: baseUploadTiaojiApi,
        method: "POST",
        json: true,
        headers: {
            "Content-Type": "application/json",
            'Content-Length': Buffer.byteLength(JSON.stringify(pbody)),
            'Connection': 'keep-alive'
        },
        body: pbody
    }, function (error, response, body) {
        console.log("upload callback:" + JSON.stringify(response) + " error:" + error)
        if (response.statusCode === 200) {
            next()

            console.log("upload success, tiaojilist->data_len: " + pbody.tiaojilist.length + " user_scorelist->data_len:" + pbody.usrscorelist.length +" "+ util.formatDate(new Date()))
        } else {
            console.log("uploadDate error : " + error);
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

function readHrefSet(dir, filename, callback) {

    var file = baseCacheDir + space + dir + space + filename;
    oldTagSet.clear();

    fs.exists(file, function (exist) {

        if (exist) {

            fs.readFile(file, { flag: 'r+', encoding: 'utf8' }, function (err, data) {

                if (!err) {
                    data.split('|').forEach(item => {

                        if (item && item.trim() !== '') {
                            let arr = item.split('_');
                            oldTagSet.add(arr[0]);
                        
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

function initDoCatch() {

    var nowDay = util.getNowFormatDate();

    TiaojiPost.find({}, (err, results) => {

        if (err) {
            console.log('[read house from db] error:' + err);
        }
        if (results) {
            postUrlMap.clear();
            let size = 0;
            results.forEach((obj, ind) => {
                if (postUrlMap.has(obj.post_url)) {
                    TiaojiPost.deleteOne({ post_url: obj.post_url }, (err, res) => {
                        // if (!err) {
                        console.log(obj + ':' + JSON.stringify(res))
                        // }
                    })
                } else {
                    postUrlMap.set(obj.post_url, obj)

                    // getProvinceID(obj.colleage_name)

                    // setToOldDateHouseDataSource(obj)

                    const post_datetime = util.formatDate(obj.post_datetime)
                    const diffdays = util.getDays(nowDay, post_datetime.split(' ')[0])
                    // console.log('diffdays:' + diffdays + " post_datetime:" + post_datetime)
                    if (diffdays <= 10) { // 重新抓取最近10天的帖子
                        doubleScratchPosts.push(obj)
                    }
                }

                size = ind;
            });

            console.log('[read house from db][houselist size : ' + (size + 1) + ']' + ' postUrlMap size :' + postUrlMap.size + ", doubleScratchPosts size:" + doubleScratchPosts.length)
        } else {
            console.log('[read house from db] no results');
        }

    });

    // TiaojiPostAndScore.find({}, (err, results) => {

    //     if (err) {
    //         console.log('[read house from db] error:' + err);
    //     }
    //     if (results) {
    //         postAndScoreMap.clear();
    //         let size = 0;
    //         results.forEach((obj, ind) => {
                
    //             if (postAndScoreMap.has(obj.post_url)) {
    //                 const scoreMap = postAndScoreMap.get(obj.post_url)
    //                 if (scoreMap.has(obj.usr_url)) {
    //                     const score = scoreMap.get(obj.usr_url)
                        
    //                 } else {
    //                     scoreMap
    //                 }
    //             }

    //             if (postUrlMap.has(obj.post_url)) {
    //                 TiaojiPost.remove({ post_url: obj.post_url }, (err, res) => {
    //                     // if (!err) {
    //                     console.log(obj + ':' + JSON.stringify(res))
    //                     // }
    //                 })
    //             } else {
    //                 postUrlMap.set(obj.post_url, obj)

    //                 // setToOldDateHouseDataSource(obj)

    //                 const post_datetime = util.formatDate(obj.post_datetime)
    //                 const diffdays = util.getDays(nowDay, post_datetime.split(' ')[0])
    //                 // console.log('diffdays:' + diffdays + " post_datetime:" + post_datetime)
    //                 if (diffdays <= 10) { // 重新抓取最近10天的帖子
    //                     doubleScratchPosts.push(obj)
    //                 }
    //             }

    //             size = ind;
    //         });

    //         console.log('[read house from db][houselist size : ' + (size + 1) + ']' + ' postUrlMap size :' + postUrlMap.size + ", doubleScratchPosts size:" + doubleScratchPosts.length)
    //     } else {
    //         console.log('[read house from db] no results');
    //     }

    // });

    // const result = await TiaojiPostAndScore.findOne({ post_url: atom[1].postUrl, user_url: atom[1].usrUrl, total_score: atom[1].totalScore })



    const domain_setting = Tiaoji_Domain_Settings.domain_setting
    domain_setting.forEach(item => {
        majorAndSubMajorMap.set(item.top_major, item.major_tag_array)
    })

}

function syncTiaojiPostAndScore() {
    TiaojiPost.find({}, (err, results) => {
        if (results) {
            results.forEach((obj, ind) => {
                request_queue.push(obj)
            });
        } 
        console.log("TiaojiPost read over.")
    })

    TiaojiPostAndScore.find({}, (err, results) => {
        if (results) {
            results.forEach((obj, ind) => {
                user_score_queue.push(obj)
            });
        } 
        console.log("TiaojiPostAndScore read over.")
    })

    setTimeout(() => {
        uploadTiaojilist(1)
    }, 15000)
}

function setToOldDateHouseDataSource(obj) {
    const post_datetime = JSON.stringify(obj.post_datetime)

    // const key = date.split('T')[0].split('"')[1]
    // if (houseDateMap.has(key)) {
    //     houseDateMap.get(key).push(obj)
    // } else {
    //     var array = new Array()
    //     array.push(obj)
    //     houseDateMap.set(key, array)
    // }
}

// 16天
function verifyDate(datetime) {
    return (moment(new Date()).diff(moment(datetime), "days") < MAX_DAY_DUR);
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

function test_date_compare() {
    let res = verifyDate('2018-12-31T08:14:50.000Z')

    console.log('res:' + res)
}


function test_string_simmiar() {
    var stringSimilarity = require('string-similarity');

    var similarity = stringSimilarity.compareTwoStrings('地铁15号线花梨坎，套装家具', ' 包物业包取暖，套装家具');

    console.log('test_string_simmiar:' + similarity);
}

function test_regex() {
    // const origin = '，能源材料合成与模拟方向学生3名，联系邮箱yhdd@wzu.edu.cn、2576775583@qq.com。电话：029-81535043 赵老师 吴老师 13717535178在吗'
    // const result = origin.match(PhoneNumber_Regex)
    // console.log('result:' + result) 

    var regPos = /^[1-9]\d*$/; // 非负整数

    // 不合法。类似于这种：74（六级512）
    if (regPos.test(134)
        && regPos.test(321)
        && regPos.test(44)
        && regPos.test(11)
        && regPos.test(44)) {

                console.log('result:' + 1) 
 
    }
    console.log('result:' + 0)
}

function test_cratchMorePageGrade() {
    cratchMorePageGrade('', 1, ()=>{}, ()=>{}, ()=> {})
}

function test_xiaomuchong() {
    var xiaomuchong_diaoji_url = '/t-15218001-1'

    cratchDetailPage(xiaomuchong_diaoji_url, ()=> {
        console.log(' next end')
    })

    // var xiaomuchong_diaoji_detail_url = 'http://muchong.com/t-15213046-1'

    // cratchDetailPage(xiaomuchong_diaoji_detail_url, () => {
    //     console.log(' next end')
    // })
}

async function reset() {
    await TiaojiPost.deleteMany({})
    await TiaojiPostAndScore.deleteMany({})
    console.log('reset everything done.')
}


var Spider = {};

Spider.doCapture = doCapture;

module.exports = Spider;


Promise.resolve()
    // .then(indexOf('1000转租东坝金隅汇景苑单间（近将台）'));
    // .then(catch_list);
    //  .then(dropIndex)
    // .then(reset)
        // .then(test_cratchMorePageGrade())
    // .then(test_date_compare())
    //     .then(test_date_compare())
    // .then(uploadDate(""))
    // .then(syncTiaojiPostAndScore)
    // .then(initDoCatch)
    // .then(test_xiaomuchong)
    // .then(loadGeoStationDataJson())
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
