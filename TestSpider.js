let Spider = require('./spider');
let Util = require('./util');

let tiger;
let ERROR_RETRY_TIME = 2 * 60 * 60 * 1000; // 两小时重试下
let waitting = -1;
function do_spider() {

//     var sp = new Object();
//     sp.do_sp = Spider.doCapture;
//
//
//     // sp.do_sp();
//
//
//
//
//
// // let spider = new Spider();
// //
// //     waitting = -1;
//     sp.do_sp((code, msg) => {
//
//         if (code === -1) {
//             sp = null;
//             waitting = 0;
//             //
//             // tiger= setTimeout(do_spider, ERROR_RETRY_TIME);
//             // console.log('-------------------------------------');
//             console.log(msg +' ' + Util.formatDate(new Date()));
//             // console.log('next time do spider waitting...');
//             // console.log('-------------------------------------');
//
//         }
//     })

    let array = [];
    array.push({a:1.4, b:'a'})
    array.push({a:1.2, b:'b'})
    array.push({a:1.5, b:'c'})
    array.push({a:1.3, b:'d'})

    array.sort((a,b) => {
        return a.a > b.a ? 1 : -1
    })

    console.log(JSON.stringify(array))
}



var url = require('url');
var https = require('https');
var HttpsProxyAgent = require('https-proxy-agent');

// HTTP/HTTPS proxy to connect to
var proxy = process.env.http_proxy || 'https://8.210.246.252:8118';
console.log('using proxy server %j', proxy);

// HTTPS endpoint for the proxy to connect to
var endpoint = process.argv[2] || 'https://www.nowcoder.com/contestRoom?mutiTagIds=642';
console.log('attempting to GET %j', endpoint);
var options = url.parse(endpoint);

// create an instance of the `HttpsProxyAgent` class with the proxy server information
var agent = new HttpsProxyAgent(proxy);
options.agent = agent;
options.protocol ="https:"

https.get(options, function (res) {
    console.log('"response" event!', res.body);
    res.pipe(process.stdout);
});



function test() {
   
}

// Promise.resolve()
//     .then(test);
