var net = require('net');
var fs = require('fs');
var path = require('path');
var hnet = require(__dirname+path.sep+'hujinet');
var hujiserver = this;
var dserver = require(__dirname+path.sep+'hujidynamicserver');

var baseFolder = __dirname;
var wwwFolder = baseFolder+path.sep+'www';

exports.start = function (port, callback) {
    var server = net.createServer(function(socket) {
        var users = server["users"];
        users.push(socket);
        socket.setMaxListeners(0);
        socket.setTimeout(2000, function() {
            socket.end();
            var index = users.indexOf(socket);
            users.splice(index,1);
        });
        socket.on('data',function(dat){
            //hnet.handleStaticReq(dat,socket,server.handlerArr);
            hnet.handleReq(dat,socket,server);
        });
        socket.on('end',function(dat){
            var index = users.indexOf(socket);
            users.splice(index,1);
        });
    });
    server.setMaxListeners(0);
    server.listen(port, "127.0.0.1", function() {
        console.log("Server listening on port: " + port);
        server["users"] = [];

        dserver.dynamicserver(server);
        callback(undefined, server);
    });

    server.on('error', function (e) {
        callback(e, undefined);
    });

};

exports.static = function (rootFolder) {
    copyErrImgs(wwwFolder + path.sep + rootFolder);
    return function(reqObj,resObj,next) {
        rpath = hujiserver.myUse(reqObj);
        rpath = rpath.replace(/\//g, path.sep);
        var fullpath = path.normalize(wwwFolder + path.sep + rootFolder + path.sep + rpath);
        //if the requested resource is inside the root folder
        if (fullpath.indexOf(path.normalize(wwwFolder + path.sep + rootFolder)) === 0) {
            hnet.createStaticResponse(fullpath, resObj);
        } else {
            hnet.createStaticErrorRes(404, resObj);
        }
    };
};

exports.myUse = function(reqObj) {
    this.toString = function() {
        console.log("returns file's relative path without the handler resource prefix");
    };
    var arr = reqObj.handler_resource.split("/");
    var hr = '';
    for (var i = 1; i < arr.length; i++) {
        if (arr[i].charAt(0) === ':') hr += '/' + reqObj.param(arr[i].split(':')[1]);
        else hr += '/' + arr[i];
    }
    return reqObj.resource.split(hr)[1];
};

function copyErrImgs(rootFolder) {
    fs.createReadStream(__dirname+path.sep+'404.jpg').pipe(fs.createWriteStream(rootFolder+path.sep+'404.jpg'));
    fs.createReadStream(__dirname+path.sep+'400.jpg').pipe(fs.createWriteStream(rootFolder+path.sep+'400.jpg'));
}