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

Promise.resolve()
    .then(do_spider);
