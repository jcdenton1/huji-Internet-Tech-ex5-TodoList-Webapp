var path = require('path');
var fs = require('fs');
var hparser = require(__dirname+path.sep+'hujiparser');
var http = require(__dirname+path.sep+'hujihttp');
var hnet = this;
var BAD_REQ_PAGE = __dirname+path.sep+"400.html";
var BAD_PATH_PAGE = __dirname+path.sep+"404.html";

exports.handleReq = function (data, socket, server) {
    var ctype = new hnet.ContentTypeMap();
    var reqObj = hparser.parse(data.toString().trim());
    var resObj = new http.HTTPresponse('1.1', 200, ctype['html'], 0, 0);
    server.addDynamicResProperties(resObj, socket);
    if (reqObj['parse_error'] === true) hnet.createErrorRes(500, resObj);
    else {
        //go through all the handlers
        var index = 0;
        while (!resObj.isSent && !resObj.inProcess) {
            function callHandler(idx) {
                var cur_handler = server.findHandler(idx, reqObj);
                if (cur_handler === undefined) {
                    hnet.createErrorRes(404, resObj);
                    return;
                }
                var next = function() {
                    callHandler(cur_handler.idx + 1);
                };
                try {
                    cur_handler.handler(reqObj, resObj, next);
                } catch(err) {
                    hnet.createErrorRes(500, resObj);
                    return;
                }
                index = cur_handler.idx + 1;
            }
            callHandler(index);
        }
    }
};

exports.sendResponse = function(resObj) {
    var socket = resObj.socket;
    resObj.headers['content-length'] = resObj.body.length;
    var headers = hparser.stringify(resObj);
    var resp = headers + resObj.body;
    resObj.inProcess = true;
    if (socket.writable) {
        socket.write(resp, function () {
            //if should socket.end after response
            if((resObj['version'] === '1.0' &&
                ((!'connection' in resObj['headers']) || resObj['headers']['connection'] !== 'keep-alive')) ||
                resObj['headers']['connection'] === 'close') socket.end();
            resObj.inProcess = false;
            resObj.isSent = true;
        });
    }
    socket.on('error', function() {
        stream.destroy();
        socket.destroy();
    });
};

function sendStaticResponse(resObj) {
    var headers = hparser.stringify(resObj);
    var stream = resObj['body_fd'];
    var socket = resObj.socket;
    resObj.inProcess = true;
    if (socket.writable) {
        socket.write(headers, function () {
            if (socket.writable) {
                //if should socket.end after response
                if((resObj['version'] === '1.0' &&
                    ((!'connection' in resObj['headers']) || resObj['headers']['connection'] !== 'keep-alive')) ||
                    resObj['headers']['connection'] === 'close') stream.pipe(socket);
                //otherwise
                else stream.pipe(socket, { end: false });
                stream.on('end', function() {
                    resObj.inProcess = false;
                    resObj.isSent = true;
                });
            }
        });
    }
    socket.on('error', function() {
        stream.destroy();
        socket.destroy();
    });
}

exports.createStaticResponse = function(filepath, resObj) {
    resObj.inProcess = true;
    fs.stat(filepath, function(err,stats){
        var arr = filepath.split('.');
        var ctype = new hnet.ContentTypeMap();
        if(!err && stats.isFile()){
            if(arr[arr.length - 1] in ctype) {
                //good case - a requested page was found
                var fd = fs.createReadStream(filepath);
                resObj.headers['content-type'] = ctype[arr[arr.length - 1]];
                resObj.headers['content-length'] = stats.size;
                resObj['body_fd'] = fd;
                sendStaticResponse(resObj);
                return;
            }
        }
        //upon problem finding requested resource
        hnet.createStaticErrorRes(404, resObj);
    });
};

exports.createErrorRes = function(code, resObj) {
    var ctype = new hnet.ContentTypeMap();
    if(code === 500) {
        resObj.status_code = 500;
        resObj['body'] = "Internal Server Error";
        resObj.headers['content-type'] = ctype['html'];
        resObj.headers['content-length'] = resObj['body'].length;
        hnet.sendResponse(resObj);
    }
    else if (code === 404) {
        resObj.status_code = 404;
        resObj['body'] = "The requested resource not found";
        resObj.headers['content-type'] = ctype['html'];
        resObj.headers['content-length'] = resObj['body'].length;
        hnet.sendResponse(resObj);
    }
};

exports.createStaticErrorRes = function(code, resObj) {
    var ctype = new hnet.ContentTypeMap();
    resObj.inProcess = true;
    if(code === 400) {
        var fd = fs.createReadStream(BAD_REQ_PAGE);
        fs.stat(BAD_REQ_PAGE, function(err,stats){
            if(!err){
                resObj.status_code = 400;
                resObj.headers['content-type'] = ctype['html'];
                resObj.headers['content-length'] = stats.size;
                resObj['body_fd'] = fd;
                sendStaticResponse(resObj);
            }
        });
    }
    else if (code === 404) {
        fd = fs.createReadStream(BAD_PATH_PAGE);
        fs.stat(BAD_PATH_PAGE, function(err,stats){
            if(!err){
                resObj.status_code = 404;
                resObj.headers['content-type'] = ctype['html'];
                resObj.headers['content-length'] = stats.size;
                resObj['body_fd'] = fd;
                sendStaticResponse(resObj);
            }
        });
    }
};

exports.ContentTypeMap = function() {
    this['js'] = 'application/javascript';
    this['html'] = 'text/html';
    this['txt'] = 'text/plain';
    this['css'] = 'text/css';
    this['jpg'] = 'image/jpeg';
    this['jpeg'] = 'image/jpeg';
    this['gif'] = 'image/gif';
    this['png'] = 'image/png';
    this['json'] = 'application/json';
};