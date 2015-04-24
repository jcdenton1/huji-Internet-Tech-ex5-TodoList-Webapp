var http = require('http');
var path = require('path');
var hujiserver = require(__dirname+path.sep+'hujiwebserver');

function loadTest() {
    hujiserver.start(80, function(err, server) {
        if (err) {
            console.log(err);
        } else {
            server.use('/static', hujiserver.static("ex2"));
            loadServer();
        }
    });
}

function loadServer() {
    var resnumpersec = 0;
    var timer = setInterval(function() {
        console.log("Server successful response rate:  " + resnumpersec + " / sec");
        resnumpersec = 0;
    }, 1000);
    var options = {
        hostname: '127.0.0.1',
        port: 80,
        path: '/static/index.html',
        method: 'GET',
        version: '1.0',
        agent:false
    };
    var req_timer = setInterval(function() {
        var req = http.request(options, function (res) {
            res.on('data', function (chunk) {
            });
            res.on('end', function () {
                if (res.statusCode !== 200) {
                    console.log("Error: Status code is: " + res.statusCode);
                } else {
                    resnumpersec += 1;
                }
            });
        });
        req.on('error', function (e) {
            console.log('problem with request: ' + e.message);
        });
        req.end();
    }, 1);
}

loadTest();