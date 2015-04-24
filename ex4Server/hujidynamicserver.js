var path = require('path');
var hnet = require(__dirname+path.sep+'hujinet');
var hujiwebserver = require(__dirname+path.sep+'hujiwebserver');

exports.dynamicserver = function (server) {
    server.handlerArr = [];

    server.stop = function() {
        server.close();
    };

    server.use = function(resource, requestHandler) {
        arr = server.handlerArr;
        if (arguments.length === 1) arr[arr.length] = { resource:'/', handler:resource, method:"all"};
        else arr[arr.length] = { resource:resource.toLowerCase(), handler:requestHandler, method:"all"};
    };

    server.get = function(resource, requestHandler) {
        arr = server.handlerArr;
        if (arguments.length === 1) arr[arr.length] = { resource:'/', handler:resource, method:"get"};
        else arr[arr.length] = { resource:resource.toLowerCase(), handler:requestHandler, method:"get"};
    };

    server.post = function(resource, requestHandler) {
        arr = server.handlerArr;
        if (arguments.length === 1) arr[arr.length] = { resource:'/', handler:resource, method:"post"};
        else arr[arr.length] = { resource:resource.toLowerCase(), handler:requestHandler, method:"post"};
    };

    server.delete = function(resource, requestHandler) {
        arr = server.handlerArr;
        if (arguments.length === 1) arr[arr.length] = { resource:'/', handler:resource, method:"delete"};
        else arr[arr.length] = { resource:resource.toLowerCase(), handler:requestHandler, method:"delete"};
    };

    server.put = function(resource, requestHandler) {
        arr = server.handlerArr;
        if (arguments.length === 1) arr[arr.length] = { resource:'/', handler:resource, method:"put"};
        else arr[arr.length] = { resource:resource.toLowerCase(), handler:requestHandler, method:"put"};
    };

    server.findHandler = function(idx, reqObj) {
        arr = server.handlerArr;
        for(var j = idx; j < arr.length; j++) {
            if (server.isResourceMatch(arr[j].resource, reqObj) &&
                (reqObj.method === arr[j].method || arr[j].method === "all")) {
                server.addDynamicReqProperties(reqObj);
                reqObj.handler_resource = arr[j].resource;
                return {idx: j, handler: arr[j].handler};
            }
        }
    };

    server.isResourceMatch = function(resource, reqObj) {
        if (resource === '/') return true;
        var arr1 = resource.split('/');
        var arr2 = reqObj.resource.split('?')[0].split('/');
        if (arr2.length < arr1.length) return false;
        var params = {};
        for (var i = 1; i < arr1.length; i++) {
            if(arr1[i].charAt(0) === ':') params[arr1[i].substring(1,arr1[i].length)] = arr2[i];
            else {
                if(arr1[i] !== arr2[i]) return false;
            }
        }
        reqObj.params = params;
        return true;
    };

    server.addDynamicReqProperties = function(reqObj) {
        var i, tempArr;
        //req.query
        var query = {};
        var queryArr = reqObj.resource.split('?');
        if (queryArr.length > 1) {
            queryArr = queryArr[1].split('&');
            for (i = 0; i < queryArr.length; i++) {
                tempArr = queryArr[i].split('=');
                query[tempArr[0]] = tempArr[1].replace('+',' ');
            }
        }
        reqObj.query = query;
        //req.cookies
        var cookies = {};
        if (reqObj.headers.cookie !== undefined) {
            var cookieArr = reqObj.headers.cookie.split(";");
            for (i = 0; i < cookieArr.length; i++) {
                tempArr = cookieArr[i].trim().split('=');
                cookies[tempArr[0]] = tempArr[1];
            }
        }
        reqObj.cookies = cookies;
        //req.path
        reqObj.path = reqObj.resource.split('?')[0];
        //req.host
        reqObj.host = reqObj.headers.host;
        reqObj.get = function(header_name) {
            return reqObj.headers[header_name.toLowerCase()];
        };
        reqObj.param = function(param_name) {
            if (reqObj.query[param_name] !== undefined) return reqObj.query[param_name.toLowerCase()];
            return reqObj.params[param_name.toLowerCase()]
        };
        reqObj.is = function(type_name) {
            if (!("content-type" in reqObj.headers)) {
                return false;
            }
            var type = reqObj.headers["content-type"].split(';')[0];
            return (type === type_name || type.split("/")[1] === type_name ||
                (type.split("/")[0] === type_name.split("/")[0] && type_name.split("/")[1] === '*'));
        };
    };

    server.addDynamicResProperties = function(resObj, socket) {
        var prop;
        resObj.socket = socket;
        resObj.headers["Cookies"] = [];
        //res.status()
        resObj.status = function(status_code) {
            resObj.status_code = status_code;
            return resObj;
        };
        //res.set()
        resObj.set = function(p1, p2) {
            if (p1 !== null && typeof p1 === 'object') {
                for (prop in p1) if(p1.hasOwnProperty(prop)) resObj.headers[prop.toLowerCase()] = p1[prop];
            } else {
                resObj.headers[p1.toLowerCase()] = p2;
            }
        };
        //res.get()
        resObj.get = function(field) {
            return resObj.headers[field.toLowerCase()];
        };
        //res.cookie()
        resObj.cookie = function(name,value) {
            var cookie_arr = resObj.headers["Cookies"];
            if (value !== null && typeof value === 'object') {
                cookie_arr[cookie_arr.length] = value;
            } else {
                cookie_arr[cookie_arr.length] = { name: value};
            }
        };
        //res.json()
        resObj.json = function(body) {
            resObj.headers["content-type"] = 'application/json';
            if (body === null || body === undefined || (typeof body !== 'object')) resObj.body = "null";
            else resObj.body = JSON.stringify(body);
            resObj.headers["content-length"] = resObj.body.length;
            hnet.sendResponse(resObj);
        };
        //res.send()
        resObj.send = function(body) {
            if (body === null || body === undefined) resObj.body = "";
            else if (typeof body === 'object' && Buffer.isBuffer(body)) resObj.body = body.toString();
            else if (typeof body === 'object') {
                resObj.json(body);
                return;
            }
            else resObj.body = body;
            hnet.sendResponse(resObj);
        };
    };
};