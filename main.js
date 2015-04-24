var http = require('http');
var path = require('path');
var fs = require('fs');
var hujiserver = require(__dirname+path.sep+"ex4Server"+path.sep+'hujiwebserver');
var uuid = require('uuid');
var querystring = require('querystring');

var dserver = null;
var app_home_page;
var FE_file_list;
var static_path_prefix = "/static";
var users = {};
var sessions = {};
var app_load = { env1: false, env2: false, handlers: false };

exports.startApp = function (callback) {
    hujiserver.start(80, function(err, server) {
        if (err) {
            console.log(err);
            callback(dserver);
        }
        else {
            console.log('App Backend: connection established with server');
            dserver = server;
            prepareEnv(callback);
            registerHandlers(callback);
        }
    });
};

function checkAppLoad(callback) {
    if (app_load.env1 === true && app_load.env2 === true) callback(dserver);
}

function prepareEnv(callback) {
    fs.readdir(__dirname+path.sep+"www", function (err, files) {
        if (err) throw err;
        FE_file_list = files;
        app_load.env1 = true;
        checkAppLoad(callback);
    });
    fs.readFile(__dirname+path.sep+"www"+path.sep+"index.html", function (err, data) {
        if (err) throw err;
        app_home_page = data.toString();
        for (f in FE_file_list) {
            if (FE_file_list.hasOwnProperty(f)) {
                app_home_page = app_home_page.replace(FE_file_list[f],static_path_prefix+"/"+FE_file_list[f]);
            }
        }
        app_load.env2 = true;
        checkAppLoad(callback);
    });
}

function registerHandlers(callback) {
    dserver.get('/login',loginHandler);
    dserver.post('/register',registrationHandler);
    dserver.get('/item',getList);
    dserver.post('/item',createNewElemInList);
    dserver.put('/item',updateExistingElemInList);
    dserver.delete('/item',deleteFromList);
    dserver.use(static_path_prefix, hujiserver.static(".."+path.sep+".."+path.sep+"www"));
    dserver.use(returnHomeHandler);
    app_load.handlers = true;
    checkAppLoad(callback);
}

function returnHomeHandler(req,res,next) {
    res.status(200);
    res.send(app_home_page);
}

function loginHandler(req,res,next) {
    var user = req.query.username;
    var pass = req.query.password;
    if (!(user in users)) {
        res.status(403);
        res.send("Forbidden: Unknown username, please register!");
        return;
    }
    if (users[user]["password"] !== pass) {
        res.status(403);
        res.send("Forbidden: Bad password!");
        return;
    }
    res.status(200);
    var key = uuid.v4();
    sessions[key] = {};
    sessions[key]["user"] = user;
    var exp_time = updateSessionExpiration(key);
    res.cookie(1, { "key":key, "Expires": exp_time });
    res.send();
}

function updateSessionExpiration(session_id) {
    var exp_time = new Date();
    exp_time.setMinutes(exp_time.getMinutes() + 30);
    sessions[session_id]["expires"] = exp_time;
    return exp_time;
}

function registrationHandler(req,res,next) {
    var req_body;
    try {
        req_body = JSON.parse(req.body);
    } catch (e) {
        req_body = querystring.parse(req.body);
    }
    var user = req_body.username;
    var pass = req_body.password;
    var name = req_body.fullname;
    if (user in users) {
        res.status(500);
        res.send("Error: username already taken");
        return;
    }
    users[user] = {};
    users[user]["password"] = pass;
    users[user]["fullname"] = name;
    users[user]["todolist"] = {};
    res.status(200);
    res.send("Registered successfully");
}

function isSessionValid(req) {
    if (JSON.stringify(req.cookies) !== JSON.stringify({}) &&
        req.cookies["key"] in sessions) {
        var now = new Date();
        if (now > sessions[req.cookies["key"]]["expires"]) {
            delete sessions[req.cookies["key"]];
            return false;
        }
        return true;
    }
    return false;
}

function getList(req,res,next) {
    res.status(200);
    var json = {};
    if (isSessionValid(req)) {
        updateSessionExpiration(req.cookies["key"]);
        json = {todoList: users[sessions[req.cookies["key"]]["user"]]["todolist"]};
    }
    res.send(json);
}

function createNewElemInList(req,res,next) {
    var resObj = {status:0, msg:""};
    if (!isSessionValid(req)) {
        res.status(400);
        resObj.status = 1;
        resObj.msg = "Error: bad session or user";
    } else {
        updateSessionExpiration(req.cookies["key"]);
        var req_json;
        try {
            req_json = JSON.parse(req.body);
        } catch (e) {
            req_json = querystring.parse(req.body);
        }
        var list = users[sessions[req.cookies["key"]]["user"]]["todolist"];
        if (req_json.id in list) {
            res.status(500);
            resObj.status = 1;
            resObj.msg = "Error: given data-id already exists";
        } else {
            list[req_json.id.toString()] = { value: req_json.value, completed: false };
            res.status(200);
        }
    }
    res.send(resObj);
}

function updateExistingElemInList(req,res,next) {
    var resObj = {status:0, msg:""};
    if (!isSessionValid(req)) {
        res.status(400);
        resObj.status = 1;
        resObj.msg = "Error: bad session or user";
    } else {
        updateSessionExpiration(req.cookies["key"]);
        var req_json;
        try {
            req_json = JSON.parse(req.body);
        } catch (e) {
            req_json = querystring.parse(req.body);
            req_json.status = parseInt(req_json.status);
        }
        var list = users[sessions[req.cookies["key"]]["user"]]["todolist"];
        list[req_json.id.toString()] = { value: req_json.value, completed: (req_json.status === 1) };
        res.status(200);
    }
    res.send(resObj);
}

function deleteFromList(req,res,next) {
    var resObj = {status:0, msg:""};
    if (!isSessionValid(req)) {
        res.status(400);
        resObj.status = 1;
        resObj.msg = "Error: bad session or user";
    } else {
        updateSessionExpiration(req.cookies["key"]);
        var id;
        try {
            id = JSON.parse(req.body).id.toString();
        } catch (e) {
            id = querystring.parse(req.body).id.toString();
        }
        var user = users[sessions[req.cookies["key"]]["user"]];
        if (id === "-1") user["todolist"] = {};
        else delete user["todolist"][id];
        res.status(200);
    }
    res.send(resObj);
}