/**
 * Created by chaowei on 2017/8/19.
 */
var Service = require('./model/service');
var Vip = require('./model/vip');
var User = require('./model/user');
var Payinfo = require('./model/payinfo');
var AppUserInfo = require('./model/appuserInfo');

var Promise = require('bluebird');

var MongoClient = require('mongodb').MongoClient;
var settings=require("./settings");
MongoClient.connect("mongodb://"+settings.ip+"/"+settings.db, function(err, db) {

    initServices();
});
//list.add(new GridAdapter.ItemData("头条", "https://m.toutiao.com/?W2atIF=1", this));
//list.add(new GridAdapter.ItemData("喜马拉雅FM", "https://m.ximalaya.com", this));
//list.add(new GridAdapter.ItemData("读书", "http://dushu.xiaomi.com/#page=main&tab=0", this));
//list.add(new GridAdapter.ItemData("音乐", "https://music.baidu.com/home", this));
//list.add(new GridAdapter.ItemData("环球网", "http://m.huanqiu.com", this));
//list.add(new GridAdapter.ItemData("铁血", "http://m.tiexue.net", this));
//list.add(new GridAdapter.ItemData("糗事百科", "https://www.qiushibaike.com", this));
//list.add(new GridAdapter.ItemData("爱奇艺", "http://m.iqiyi.com", this));
//list.add(new GridAdapter.ItemData("1", "折800", "https://m.zhe800.com", this));

function initServices() {
    console.log('initServices');
    Vip.remove({},()=>{});
    AppUserInfo.remove({},()=>{});
    User.remove({},()=>{});
    Payinfo.remove({},()=>{});

    Vip.find({}, (v)=>{
        console.log(v);
    })
    Service.remove({}, () => {

        let toutiao = new Service({
            title:'头条',
            url:'https://m.toutiao.com/?W2atIF=1'
        });
        toutiao.save();

        let ximalaya = new Service({
            title:'喜马拉雅FM',
            url:'https://m.ximalaya.com'
        });

        ximalaya.save();

        let dushu = new Service({
            title:'读书',
            url:'http://dushu.xiaomi.com/#page=main&tab=0'
        });
        dushu.save();

        let music = new Service({
            title: '音乐',
            url: 'https://music.baidu.com/home'
        });
        music.save();

        let huanqiu = new Service({
            title: '环球网',
            url: 'http://m.huanqiu.com'
        });
        huanqiu.save();

        let tiexue = new Service({
            title: '铁血',
            url: 'http://m.tiexue.net'
        });
        tiexue.save();

        let qiushibaike = new Service({
            title: '糗事百科',
            url: 'https://www.qiushibaike.com'
        });
        qiushibaike.save();

        let aiqiyi = new Service({
            title: '爱奇艺',
            url: 'http://m.iqiyi.com'
        });
        aiqiyi.save();

        let zhe800 = new Service({
            title:'折800',
            url: 'https://m.zhe800.com'
        });
        zhe800.save();
        let korean = new Service({
            title: '日韩看片',
            url: 'https://www.youtube.com/watch?v=9iMMHXHHwQg',
            type: 1
        });

        korean.save();

        // let oumei = new Service({
        //     title: '欧美大片',
        //     url: 'https://www.youtube.com/watch?v=832nC2tf5YQ',
        //     type: 1
        // });
        //
        // oumei.save();


        let rentiyishu = new Service({
            title: '人体艺术',
            url: 'http://www.hkrenti.com/'

        });
        rentiyishu.save();

        let guochan = new Service(
            {
                title: '国产看片',
                url:'https://www.pornhub.com/view_video.php?viewkey=ph59976f957d4de',
                type: 1
            }
        );
        guochan.save();

        let korealive = new Service({
            title: '韩国美女直播',
            url: 'http://m.afreecatv.com/#/home'
        });
        korealive.save();

        let sexyvideo = new Service({
            title:'午夜空间',
            url:'https://www.xvideos.com/tags/sexy-girl-sex',
            type: 1
        });

        sexyvideo.save();

    })

}

Promise.resolve()
    .then(initServices);
