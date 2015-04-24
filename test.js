var path = require('path');
var app = require(__dirname+path.sep+"main");
var http = require('http');
var querystring = require('querystring');

var max_test_num = 0;
var cookie = "";
var dserver = null;
app.startApp(main);

function main(server) {
    if (server === null) {
        console.log("Error loading app!");
        return;
    }
    dserver = server;
    runTest(0);
}

function request(test_num, test_data) {
    var body = test_data.req_data;
    var options = test_data.options;
    if (body !== null) {
        options.headers = {};
        options.headers['Content-Length'] = querystring.stringify(body).length;
        options.headers['Content-Type'] = 'text/html';
    }
    if (cookie !== "") {
        if (!("headers" in options)) options.headers = {};
        options.headers['Cookie'] = cookie;
    }
    var req = http.request(test_data.options, function(res) {
        var res_data = [];
        res.on('data', function (net_chunk) {
            res_data.push(net_chunk);
        });
        res.on('end', function () {
            res_data = Buffer.concat(res_data).toString();
            checkResult(test_num, {status: res.statusCode, data: res_data, headers: res.headers}, test_data.expected_res);
        });
    });
    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });
    req.write(querystring.stringify(body));
    req.end();
}

function runTest(idx) {
    var test_list = getTests();
    max_test_num = test_list.length;
    request(idx + 1, test_list[idx]);
}

function finishedAllTests(test_num) {
    if (test_num === max_test_num) {
        console.log("All tests finished!");
        dserver.stop();
    } else {
        runTest(test_num);
    }
}

function extractCookie(resObj) {
    var headers = resObj.headers;
    if ("set-cookie" in headers) {
        cookie = headers["set-cookie"][0].split(";")[0];
    }
}

function checkResult(test_num, resObj, expRes) {
    var failed = false;
    extractCookie(resObj);
    if (expRes.status !== resObj.status) {
        console.log("Expected status: " + expRes.status + ". Received: " + resObj.status);
        failed = true;
    }
    if (expRes.data !== resObj.data) {
        console.log("Expected object: " + expRes.data + ". Received: " + resObj.data);
        failed = true;
    }
    if (failed) {
        console.log("Test #" + test_num + " failed!");
        finishedAllTests(test_num);
        return;
    }
    console.log("Test #" + test_num + " passed!");
    finishedAllTests(test_num);
}

function getTests() {
    return [
        {   req_data: {username: "testuser", fullname: "blabla", password: "aaa"},
            options: { host: '127.0.0.1', port: 80, path: '/register', method: 'POST'},
            expected_res: {status: 200, data: "Registered successfully" }   } ,
        {   req_data: {username: "testuser", fullname: "omg", password: "aaaa"},
            options: { host: '127.0.0.1', port: 80, path: '/register', method: 'POST'},
            expected_res: {status: 500, data: "Error: username already taken" }   } ,
        {   req_data: {username: "testuser2", fullname: "omg", password: "asasfsadkaspodka"},
            options: { host: '127.0.0.1', port: 80, path: '/register', method: 'POST'},
            expected_res: {status: 200, data: "Registered successfully" }   } ,
        {   req_data: null,
            options: { host: '127.0.0.1', port: 80, path: '/item', method: 'GET'},
            expected_res: {status: 200, data: "{}" }   },
        {   req_data: {id: "2", value: "omgomg"},
            options: { host: '127.0.0.1', port: 80, path: '/item', method: 'POST'},
            expected_res: {status: 400, data: '{"status":1,"msg":"Error: bad session or user"}' }   },
        {   req_data: {id: "2", value: "omgomg", status: 0},
            options: { host: '127.0.0.1', port: 80, path: '/item', method: 'PUT'},
            expected_res: {status: 400, data: '{"status":1,"msg":"Error: bad session or user"}' }   },
        {   req_data: {id: "2"},
            options: { host: '127.0.0.1', port: 80, path: '/item', method: 'DELETE'},
            expected_res: {status: 400, data: '{"status":1,"msg":"Error: bad session or user"}' }   },
        {   req_data: null,
            options: { host: '127.0.0.1', port: 80, path: '/login?username=testuser&password=aaa', method: 'GET'},
            expected_res: {status: 200, data: '' }   } ,
        {   req_data: null,
            options: { host: '127.0.0.1', port: 80, path: '/item', method: 'GET'},
            expected_res: {status: 200, data: '{"todoList":{}}' }   } ,
        {   req_data: {id: "2", value: "todo1"},
            options: { host: '127.0.0.1', port: 80, path: '/item', method: 'POST'},
            expected_res: {status: 200, data: '{"status":0,"msg":""}' }   },
        {   req_data: {id: "3", value: "todo2"},
            options: { host: '127.0.0.1', port: 80, path: '/item', method: 'POST'},
            expected_res: {status: 200, data: '{"status":0,"msg":""}' }   },
        {   req_data: {id: "3", value: "todo3"},
            options: { host: '127.0.0.1', port: 80, path: '/item', method: 'POST'},
            expected_res: {status: 500, data: '{"status":1,"msg":"Error: given data-id already exists"}' }   },
        {   req_data: {id: "4", value: "todo3", status: 1},
            options: { host: '127.0.0.1', port: 80, path: '/item', method: 'PUT'},
            expected_res: {status: 200, data: '{"status":0,"msg":""}' }   },
        {   req_data: {id: "3", value: "todo11", status: 1},
            options: { host: '127.0.0.1', port: 80, path: '/item', method: 'PUT'},
            expected_res: {status: 200, data: '{"status":0,"msg":""}' }   },
        {   req_data: null,
            options: { host: '127.0.0.1', port: 80, path: '/item', method: 'GET'},
            expected_res: {status: 200, data: '{"todoList":{"2":{"value":"todo1","completed":false},"3":{"value":"todo11","completed":true},"4":{"value":"todo3","completed":true}}}' }   } ,
        {   req_data: {id: "2"},
            options: { host: '127.0.0.1', port: 80, path: '/item', method: 'DELETE'},
            expected_res: {status: 200, data: '{"status":0,"msg":""}' }   },
        {   req_data: {id: "4"},
            options: { host: '127.0.0.1', port: 80, path: '/item', method: 'DELETE'},
            expected_res: {status: 200, data: '{"status":0,"msg":""}' }   },
        {   req_data: {id: "2"},
            options: { host: '127.0.0.1', port: 80, path: '/item', method: 'DELETE'},
            expected_res: {status: 200, data: '{"status":0,"msg":""}' }   },
        {   req_data: null,
            options: { host: '127.0.0.1', port: 80, path: '/item', method: 'GET'},
            expected_res: {status: 200, data: '{"todoList":{"3":{"value":"todo11","completed":true}}}' }   } ,
        {   req_data: {id: "3000", value: "todo3000"},
            options: { host: '127.0.0.1', port: 80, path: '/item', method: 'POST'},
            expected_res: {status: 200, data: '{"status":0,"msg":""}' }   },
        {   req_data: {id: "-1"},
            options: { host: '127.0.0.1', port: 80, path: '/item', method: 'DELETE'},
            expected_res: {status: 200, data: '{"status":0,"msg":""}' }   },
        {   req_data: null,
            options: { host: '127.0.0.1', port: 80, path: '/item', method: 'GET'},
            expected_res: {status: 200, data: '{"todoList":{}}' }   }
    ];
}