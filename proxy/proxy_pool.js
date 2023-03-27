const request = require('request')
const cheerio = require('cheerio')
const sqlite3 = require('sqlite3')

const rp = require('request-promise')

const db = new sqlite3.Database('Proxy.db', (err) => {
    if(!err){
        console.log('打开成功')
    } else {
        console.log(err)
    }
})

db.run('CREATE TABLE proxy(ip char(15), port char(15), type char(15))',(err) => {})

const useragent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36'

const headers = {
    'User-Agent': useragent,
}

//添加数据文件
const insertDb = function(ip, port, type){
    db.run("INSERT INTO proxy VALUES(?, ?, ?)",[ip,port,type])
}

let ipDataSourceFromWeb = []
let currentEffectiveIpData = []

let activeIpByCheckingDonban = new Map()


var doubanUrl = "https://www.baidu.com/"
const useRequestPromise = async function (ip, port) {
    let url = doubanUrl
    let options = {
        method: 'GET',
        uri: url,
        proxy: `http://${ip}:${port}`,
    };
    let rpbody = await rp(options);
    console.log("rpnbody", rpbody);
}


//提取优化文件数据
const clearN = function(l){
    let index = 0
    for (let i = 0; i < l.length; i++) {
        if(l[i] === '' || l[i] === '\n'){
        }else{
            let ips = l[i].replace('\n','')
            if (index === 0){
                var ip = ips
                console.log('爬取ip:' + ip)
            } else if(index === 1){
                var port = ips
            } else if(index === 4){
                var type = ips
            }
            index += 1
        }
    }
    insertDb(ip, port, type)
}



//分析网页内容
const loadHtml = function(data){
    let l = []
    let e = cheerio.load(data)
    e('tr').each(function(i, elem){
        l[i] = e(this).text()
    })
    for (let i = 1; i < l.length; i ++){
        clearN(l[i].split(' '))
    }
}

//链接网络
const requestProxy = function(options){
    return new Promise((resolve, reject) => {
        request(options, function(err, response, body){
            if(err === null && response.statusCode === 200){
                loadHtml(body)
                resolve()
            } else {
                console.log('链接失败')
                resolve()
            }
        })
    })
}

//链接网络
const requestProxy2 = function (options) {
    return new Promise((resolve, reject) => {
        loadIpConfig()
        resolve()
    })
}

exports.startWork  = function() {
    this.ipDataSourceFromWeb = parseIpsFromProxyWebPage()
    this.ipDataSourceFromWeb.forEach(item => {
        insertDb(item.ip, item.port, item.type)
    })

    setTimeout(checkIpAtTime, 15 * 1000)
}

const parseIpsFromProxyWebPage = function() {

    let ips = [{
        ip: '103.224.195.41',
        port: '3128',
        type: 'http'
    },
    {
        ip: '178.128.126.108',
        port: '8118',
        type: 'http'
    },
    {
        ip: '118.175.207.180',
        port: '40017',
        type: 'http'
    },
    {
        ip: '64.17.30.238',
        port: '63141',
        type: 'http'
    },
    {
        ip: '13.57.183.118',
        port: '3128',
        type: 'http'
    },
    ]

    return ips

}

const parseIpsFromProxyWebPageAtTime = function() {
    setInterval(parseIpsFromProxyWebPage, 60 * 60 * 1000) // 1小时解析一次网页
}

const checkIpAtTime = function() {

    startCheckIp()

    setInterval(startCheckIp, 3 * 60 * 1000) 

    setTimeout(startCheckRequestDonbanServer, 30 * 1000)
}

const startCheckIp = function() {
    let arr = []
    allIp((err, response) => {
        for (let i = 0; i < response.length; i++) {
            let ip = response[i]
            let proxy = new Proxys(ip.ip, ip.port, ip.type)
            arr.push(check(proxy, headers))
        }
        Promise.all(arr).then(function () {
            allIp((err, response) => {
                console.log('\n\n可用ip为:')
                console.log(response)

                currentEffectiveIpData = response
            })
        })
    })
}

const startCheckRequestDonbanServer = function() {

    currentEffectiveIpData.forEach(item => {
        // const rsp = useRequestPromise(item.ip, item.port)

        request({
            url: 'http://apps.bdimg.com/libs/jquery/2.1.4/jquery.min.js',
            proxy: `http://${item.ip}:${item.port}`,
            method: 'GET',
            timeout: 5000,
            headers,
        }
            , function (err, response, body) {
                if (!err && response.statusCode == 200) {
                    console.log(item.ip + ' 11 链接成功：')
                } else {
                    console.log(item.ip + ' ' + item.port + ' 11 链接失败')
                }
            }
        )
    })
}

//检测ip
const CheckRequestDonbanServer = function(ip, port, headers){
    return new Promise((resolve, reject) => {
        request({
            url: 'http://apps.bdimg.com/libs/jquery/2.1.4/jquery.min.js',
            proxy: `http://${ip}:${port}`,
            method:'GET',
            timeout: 2000,
            headers,}
            ,function(err, response,body){
                if(!err && response.statusCode == 200){
                    console.log(proxy.ip+' 11 链接成功：')
                    resolve()
                } else {
                    console.log(proxy.ip + ' ' + proxy.port +' 11 链接失败')
                    resolve()
                }
            }
        )
    })
}


const loadIpConfig = async function() {

    

ips.forEach(element => {
    insertDb(element.ip, element.port, element.type)
});

    await getIps( async(err, rep) => {
        console.log('loadIpData: ' + JSON.stringify(rep))
    })


}

const getProxyList = () => {
    return new Promise((resolve, reject) => {
        const nowDate = Date.now();
        if (nowDate - time < expiryTime) {
            resolve(ips);
            return;
        }
        const apiURL = 'http://www.66ip.cn/mo.php?sxb=&tqsl=100&port=&export=&ktip=&sxa=&submit=%CC%E1++%C8%A1&textarea=http%3A%2F%2Fwww.66ip.cn%2F%3Fsxb%3D%26tqsl%3D100%26ports%255B%255D2%3D%26ktip%3D%26sxa%3D%26radio%3Dradio%26submit%3D%25CC%25E1%2B%2B%25C8%25A1';
        const options = {
            method: 'GET', url: apiURL, gzip: true, encoding: null,
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate',
                'Accept-Language': 'zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4',
                'User-Agent': 'Mozilla/8.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36',
                'referer': 'http://www.66ip.cn/'
            },
        };
        request(options, (error, response, body) => {
            try {
                if (Buffer.isBuffer(body)) {
                    const ret = body.toString().match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,4}/g);
                    ips = ret;
                    time = Date.now();
                    resolve(ret);
                }
            } catch (e) {
                console.log(e);
            }
        });
    })
}

//生成网址
const ipUrl = function(resolve){
    const url = 'http://www.xicidaili.com/nn/'

    let options = {
        url:'http://www.xicidaili.com/nn/',
        headers,
    }
    let arr = []
   
    return new Promise((resolve, reject) => {
        // for (let i = 1; i <= 5; i++) {
        //     options.url = url + i
        //     arr.push(requestProxy2(options))
        // }

        arr.push(requestProxy2(options))
        Promise.all(arr).then(function(){
            resolve()
        })
    })
}



//从数据库提取所有ip
const allIp = function(callback){
    return db.all('select * from proxy', callback)
}

//代理ip对象
const Proxys = function(ip,port,type){
    this.ip = ip
    this.port = port
    this.type = type
}

//提取所有ip，通过check函数检查
const runIp = async function(){
    let arr = []

    allIp((err,response) => {
        for (let i = 0; i < response.length; i++) {
            let ip = response[i]
            let proxy = new Proxys(ip.ip, ip.port, ip.type)
            arr.push(check(proxy, headers))
        }
        Promise.all(arr).then(function(){
            allIp((err, response)=>{
                console.log('\n\n可用ip为:')
                console.log(response)
            })
        })
    })
}

//检测ip
const check = function(proxy, headers){
    console.log('check:' + JSON.stringify(proxy))
    return new Promise((resolve, reject) => {
        request({
            url:'http://apps.bdimg.com/libs/jquery/2.1.4/jquery.min.js',
            proxy: `${proxy.type.toLowerCase()}://${proxy.ip}:${proxy.port}`,
            method:'GET',
            timeout: 5000,
            headers,}
            ,function(err, response,body){
                if(!err && response.statusCode == 200){
                    console.log(proxy.ip+' 链接成功：')
                    resolve()
                } else {
                    console.log(proxy.ip + ' ' + proxy.port +' 链接失败')
                    removeIp(proxy.ip)
                    resolve()
                }
            }
        )
    })
}

//删除命令
const removeIp = function(ip){
    db.run(`DELETE FROM proxy WHERE ip = '${ ip }'`, function(err){
        if(err){
            console.log(err)
        }else {
            console.log('成功删除：'+ip)
        }
    })
}

exports.loadIpData = async function () {
    await loadIpConfig()
}

exports.run = async function(){
    // await ipUrl()
    await runIp()
}

exports.check = function(){
    runIp()
}

exports.getRandomUserAgent = function() {
    const userAgents = [
        'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.8.0.12) Gecko/20070731 Ubuntu/dapper-security Firefox/1.5.0.12',
        'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0; Acoo Browser; SLCC1; .NET CLR 2.0.50727; Media Center PC 5.0; .NET CLR 3.0.04506)',
        'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/535.11 (KHTML, like Gecko) Chrome/17.0.963.56 Safari/535.11',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_3) AppleWebKit/535.20 (KHTML, like Gecko) Chrome/19.0.1036.7 Safari/535.20',
        'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.0.8) Gecko Fedora/1.9.0.8-1.fc10 Kazehakase/0.5.6',
        'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/21.0.1180.71 Safari/537.1 LBBROWSER',
        'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Win64; x64; Trident/5.0; .NET CLR 3.5.30729; .NET CLR 3.0.30729; .NET CLR 2.0.50727; Media Center PC 6.0) ,Lynx/2.8.5rel.1 libwww-FM/2.14 SSL-MM/1.4.1 GNUTLS/1.2.9',
        'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.1.4322; .NET CLR 2.0.50727)',
        'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C; .NET4.0E; QQBrowser/7.0.3698.400)',
        'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; QQDownload 732; .NET4.0C; .NET4.0E)',
        'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:2.0b13pre) Gecko/20110307 Firefox/4.0b13pre',
        'Opera/9.80 (Macintosh; Intel Mac OS X 10.6.8; U; fr) Presto/2.9.168 Version/11.52',
        'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.8.0.12) Gecko/20070731 Ubuntu/dapper-security Firefox/1.5.0.12',
        'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C; .NET4.0E; LBBROWSER)',
        'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.0.8) Gecko Fedora/1.9.0.8-1.fc10 Kazehakase/0.5.6',
        'Mozilla/5.0 (X11; U; Linux; en-US) AppleWebKit/527+ (KHTML, like Gecko, Safari/419.3) Arora/0.6',
        'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C; .NET4.0E; QQBrowser/7.0.3698.400)',
        'Opera/9.25 (Windows NT 5.1; U; en), Lynx/2.8.5rel.1 libwww-FM/2.14 SSL-MM/1.4.1 GNUTLS/1.2.9',
        'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36'
    ]

    let userAgent = userAgents[parseInt(Math.random() * userAgents.length)];
    return userAgent
}

function getIps(callback){
    allIp(callback)
}



exports.getRandomIP = async function () {
    let ip = process.env.http_proxy

    // 'http://203.198.94.132:80'

    await getIps(async(err, rep) => {
        console.log('getRandomIP:' + JSON.stringify(rep))
    })

    return ip


}