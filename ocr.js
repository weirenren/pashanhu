/**
 * Created by chaowei on 2017/10/8.
 */
var AipOcrClient = require("baidu-ai").ocr;
var fs = require('fs');

// 设置APPID/AK/SK
var APP_ID = "10213925";
var API_KEY = "CGPBkseTG9kFW3tMffwBrcWH";
var SECRET_KEY = "pPSGyCGNnTUYZhFMKinXjFxMSjAb8L0Y";

var client = new AipOcrClient(APP_ID, API_KEY, SECRET_KEY);


var OCR = {};

//'./public/demo.png'
OCR.ocr = function(filepath,next){

    var image = fs.readFileSync(filepath);
    var base64Img = new Buffer(image).toString('base64');
    client.generalBasic(base64Img).then(function(result) {
        next(JSON.stringify(result));
    });

};

module.exports = OCR;