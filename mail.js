/**
 * Created by chaowei on 17/2/25.
 */


// 引入 nodemailer
var nodemailer = require('nodemailer');

// 创建一个SMTP客户端配置
var config = {
    host: 'smtp.163.com',
    port: 25,
    auth: {
        user: '13717535178@163.com',
        pass: 'chao.126'
    }
};

// 创建一个SMTP客户端对象
var transporter = nodemailer.createTransport(config);

// 创建一个邮件对象
var mail = {
    // 发件人
    from: '13717535178@163.com',
    // 主题
    subject: '内部推荐',
    // 收件人
    to: '306917331@qq.com',
    // 邮件内容，HTML格式
    text: '内部推荐'
};



var mailer = {};

mailer.send = function (from, subject, to, text) {

    // 创建一个邮件对象
    var mail = {
        // 发件人
        from: from,
        // 主题
        subject: subject,
        // 收件人
        to: to,
        // 邮件内容，HTML格式
        text: text
    };

    // 发送邮件
    transporter.sendMail(mail, function(error, info) {
        if (error) return console.log(error);
        console.log('mail sent:', info.response);
    })
}


module.exports = mailer;