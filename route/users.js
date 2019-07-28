/**
 * Created by chaowei on 2017/5/30.
 */
var express = require('express');
var router = express.Router();
var User = require('../model/user');


//router.post('/users/create', isLogin);
router.post('/create', function (req, res) {

    var user = new User;


    console.log('/users/create');

    //var useracount = new UserAcount;
    //useracount.username = req.session.user.name;
    //useracount.type_id = req.body.type_id;

    user.username = req.body.username;
    user.password = req.body.password;
    user.save(function(err, obj){

        if(err) {
            console.log(err.message);
        }else {
            console.log(obj);
        }

    });

    res.json({
        code: 0
    })

});



function isLogin(req, res, next) {
    if (!req.session.user) {

        return res.redirect('/');
    }
    next();
}
module.exports = router;
