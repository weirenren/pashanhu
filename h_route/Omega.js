var Omega = {};
var Action = require('../h_model/user_action');
var Util = require('../util');

Omega.markIndex = function (ip, username) {
    let date = Util.getNowFormatDate();

    Action.findOne({ip: ip, date: date}, (err, obj) => {
        if (obj) {
            let actJson = JSON.parse(obj.action);
            let sum = actJson['ind'];
            actJson['ind'] = sum + 1;
            let actres = JSON.stringify(actJson);
            Action.update({ip: ip, date: date}, {$set: {action: actres}}, function (err, user) {
            });

        } else {
            let act = JSON.stringify({ind : 1});
            let action = new Action({ip: ip, username: username, date: date, action: act});
            action.save();
        }
    });
};

Omega.markLogin = function (ip, username) {
    let date = Util.getNowFormatDate();

    Action.findOne({ip: ip, date: date}, (err, obj) => {
        if (obj) {
            let actJson = JSON.parse(obj.action);
            let sum = actJson['lgi'];
            actJson['lgi'] = sum + 1;
            let actres = JSON.stringify(actJson);
            Action.update({ip: ip, date: date}, {$set: {action: actres}}, function (err, user) {
            });

        } else {
            let act = JSON.stringify({lgi: 1});
            let action = new Action({ip: ip, username: username, date: date, action: act});
            action.save();
        }
    });
};

Omega.markLogout = function (ip, username) {
    let date = Util.getNowFormatDate();

    Action.findOne({ip: ip, date: date}, (err, obj) => {
        if (obj) {
            let actJson = JSON.parse(obj.action);
            let sum = actJson['lgt'];
            actJson['lgt'] = sum + 1;
            let actres = JSON.stringify(actJson);
            Action.update({ip: ip, date: date}, {$set: {action: actres}}, function (err, user) {
            });

        } else {
            let act = JSON.stringify({lgt: 1});
            let action = new Action({ip: ip, username: username, date: date, action: act});
            action.save();
        }
    });
};


Omega.markCreate = function (ip, username) {
    let date = Util.getNowFormatDate();

    Action.findOne({ip: ip, date: date}, (err, obj) => {
        if (obj) {
            let actJson = JSON.parse(obj.action);
            let sum = actJson['cre'];
            actJson['cre'] = sum + 1;
            let actres = JSON.stringify(actJson);
            Action.update({ip: ip, date: date}, {$set: {action: actres}}, function (err, user) {
            });

        } else {
            let act = JSON.stringify({cre: 1});
            let action = new Action({ip: ip, username: username, date: date, action: act});
            action.save();
        }
    });
};

Omega.markManager = function (ip, username) {
    let date = Util.getNowFormatDate();

    Action.findOne({ip: ip, date: date}, (err, obj) => {
        if (obj) {
            let actJson = JSON.parse(obj.action);
            let sum = actJson['manager'];
            actJson['manager'] = sum + 1;
            let actres = JSON.stringify(actJson);
            Action.update({ip: ip, date: date}, {$set: {action: actres}}, function (err, user) {
            });

        } else {
            let act = JSON.stringify({manager: 1});
            let action = new Action({ip: ip, username: username, date: date, action: act});
            action.save();
        }
    });
};

Omega.markAction = function (ip, username) {
    let date = Util.getNowFormatDate();

    Action.findOne({ip: ip, date: date}, (err, obj) => {
        if (obj) {
            let actJson = JSON.parse(obj.action);
            let sum = actJson['gaction'];
            actJson['gaction'] = sum + 1;
            let actres = JSON.stringify(actJson);
            Action.update({ip: ip, date: date}, {$set: {action: actres}}, function (err, user) {
            });

        } else {
            let act = JSON.stringify({gaction: 1});
            let action = new Action({ip: ip, username: username, date: date, action: act});
            action.save();
        }
    });
};


Omega.markDelete = function (ip, username) {
    let date = Util.getNowFormatDate();

    Action.findOne({ip: ip, date: date}, (err, obj) => {
        if (obj) {
            let actJson = JSON.parse(obj.action);
            let sum = actJson['del'];
            actJson['del'] = sum + 1;
            let actres = JSON.stringify(actJson);
            Action.update({ip: ip, date: date}, {$set: {action: actres}}, function (err, user) {
            });

        } else {
            let act = JSON.stringify({del: 1});
            let action = new Action({ip: ip, username: username, date: date, action: act});
            action.save();
        }
    });
};

Omega.markDetail = function (ip, username) {
    let date = Util.getNowFormatDate();

    Action.findOne({ip: ip, date: date}, (err, obj) => {
        if (obj) {
            let actJson = JSON.parse(obj.action);
            let sum = actJson['det'];
            actJson['det'] = sum + 1;
            let actres = JSON.stringify(actJson);
            Action.update({ip: ip, date: date}, {$set: {action: actres}}, function (err, user) {
            });

        } else {
            let act = JSON.stringify({det: 1});
            let action = new Action({ip: ip, username: username, date: date, action: act});
            action.save();
        }
    });
};

Omega.markMatch = function (ip, username) {
    let date = Util.getNowFormatDate();

    Action.findOne({ip: ip, date: date}, (err, obj) => {
        if (obj) {
            let actJson = JSON.parse(obj.action);
            let sum = actJson['mat'];
            actJson['mat'] = sum + 1;
            let actres = JSON.stringify(actJson);
            Action.update({ip: ip, date: date}, {$set: {action: actres}}, function (err, user) {
            });

        } else {
            let act = JSON.stringify({mat: 1});
            let action = new Action({ip: ip, username: username, date: date, action: act});
            action.save();
        }
    });
};

Omega.markRegister = function (ip, username) {
    let date = Util.getNowFormatDate();

    Action.findOne({ip: ip, date: date}, (err, obj) => {
        if (obj) {
            let actJson = JSON.parse(obj.action);
            let sum = actJson['reg'];
            actJson['reg'] = sum + 1;
            let actres = JSON.stringify(actJson);
            Action.update({ip: ip, date: date}, {$set: {action: actres}}, function (err, user) {
            });

        } else {
            let act = JSON.stringify({reg: 1});
            let action = new Action({ip: ip, username: username, date: date, action: act});
            action.save();
        }
    });
};


Omega.markFindPwd = function (ip, username) {
    let date = Util.getNowFormatDate();

    Action.findOne({ip: ip, date: date}, (err, obj) => {
        if (obj) {
            let actJson = JSON.parse(obj.action);
            let sum = actJson['fpd'];
            actJson['fpd'] = sum + 1;
            let actres = JSON.stringify(actJson);
            Action.update({ip: ip, date: date}, {$set: {action: actres}}, function (err, user) {
            });

        } else {
            let act = JSON.stringify({fpd: 1});
            let action = new Action({ip: ip, username: username, date: date, action: act});
            action.save();
        }
    });
};


Omega.markGetUserInfo = function (ip, username) {
    let date = Util.getNowFormatDate();

    Action.findOne({ip: ip, date: date}, (err, obj) => {
        if (obj) {
            let actJson = JSON.parse(obj.action);
            let sum = actJson['usi'];
            actJson['usi'] = sum + 1;
            let actres = JSON.stringify(actJson);
            Action.update({ip: ip, date: date}, {$set: {action: actres}}, function (err, user) {
            });

        } else {
            let act = JSON.stringify({usi: 1});
            let action = new Action({ip: ip, username: username, date: date, action: act});
            action.save();
        }
    });
};

Omega.markUpload = function (ip, username) {
    let date = Util.getNowFormatDate();

    Action.findOne({ip: ip, date: date}, (err, obj) => {
        if (obj) {
            let actJson = JSON.parse(obj.action);
            let sum = actJson['upl'];
            actJson['upl'] = sum + 1;
            let actres = JSON.stringify(actJson);
            Action.update({ip: ip, date: date}, {$set: {action: actres}}, function (err, user) {
            });

        } else {
            let act = JSON.stringify({upl: 1});
            let action = new Action({ip: ip, username: username, date: date, action: act});
            action.save();
        }
    });
};


module.exports = Omega;
