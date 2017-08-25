/**
 * Created by chaowei on 2017/5/30.
 */
var express = require('express');
var router = express.Router();

var FriendFinder = require('../model/hoursefriend_finder');


router.post('/hoursefriend/create', isLogin);
router.post('/hoursefriend/create', function (req, res) {

    var finder = new FriendFinder;



    //var useracount = new UserAcount;
    //useracount.username = req.session.user.name;
    //useracount.type_id = req.body.type_id;

    finder.save({}, function(err){


    });



    res.json({
        type_id:req.body.type_id,
        code: 0
    })


});

router.post('/login',function(req,res){
    var md5=crypto.createHash('md5');
    var password=md5.update(req.body.password).digest('base64');
    User.findOne({name:req.body.username},function(err,user){
        if(!user){
            req.session.error="用户不存在";
            //return res.json({
            //    pass: false,
            //    data: "用户不存在"
            //})

            //return res.render('login',{
            //    pass: false,
            //    data: "用户不存在"
            //});
            return res.redirect('/login');
        }

        if(user.is_used === true){
            req.session.error="用户不能重复登录";
            return res.redirect('/login');
        }

        user.is_used = true;

        User.findOneAndUpdate({name:user.name}, user,function(err, doc){

            if (!err) {

                console.log(' acount update success');

            }else {
                console.log(' acount update falure:'+err);
            }

        });


        if(user.password!=password){
            req.session.error="密码错误";
            return res.json({
                pass: false,
                data: "密码错误"
            })
            //return  res.redirect('/login');
        }

        var tokendata = {
            id: user.id,
            name: user.name
        }
        var token = util.genToken(tokendata);

        //return res.json({
        //    pass: true,
        //    token: token,
        //    data: user
        //})



        req.session.name = user.name;
        req.session.pass = true;
        req.session.success="登录成功";
        console.log('session id:'+req.session.id);
        res.redirect('/');
    });
});




function isLogin(req, res, next) {
    if (!req.session.user) {

        return res.redirect('/');
    }
    next();
}
module.exports = router;