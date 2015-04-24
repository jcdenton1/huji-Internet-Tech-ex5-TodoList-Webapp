exports.HTTPrequest = function (str) {
    var req_methods = new ReqMethod();
    var parse_error = false;
    var arr = str.split('\r\n\r\n');
    var meta_arr = arr[0].split('\r\n');
    var arr2 = meta_arr[0].split(' ');
    this['parse_error'] = false;
    this['method'] = arr2[0].toLowerCase();
    if (!(this['method'] in req_methods)) {
        //console.log("======  BAD METHOD:  " + this['method'] + "  =======");
        this['parse_error'] = true;
    }
    this['resource'] = arr2[1];
    //splits a string of the following sort: "HTTPS/1.1"
    var arr3 = arr2[2].split('/');
    this['version'] = arr3[1].toLowerCase();
    if (arr3[0].toLowerCase() !== 'http' && arr3[0].toLowerCase() !== 'https') {
        //console.log("======  NO HTTP TAG  =======");
        this['parse_error'] = true;
    } else this["protocol"] = arr3[0].toLowerCase();
    if (this['version'] !== '1.0' && this['version'] !== '1.1') {
        //console.log("====== VERSION IS:  " + this['version'] + "  =======");
        this['parse_error'] = true;
    }
    this['headers'] = {};
    for (var i=1; i<meta_arr.length; i++) {
        arr2 = meta_arr[i].split(': ');
        if (arr2[0].toLowerCase() === "cookie") this['headers'][arr2[0].toLowerCase()] = arr2[1];
        else this['headers'][arr2[0].toLowerCase()] = arr2[1].toLowerCase();
    }
    this['body'] = "";
    for (i=1; i<arr.length - 1; i++) {
        this['body'] += arr[i];
        this['body'] += "\r\n\r\n";
    }
    this['body'] += arr[i];
};

exports.HTTPresponse = function(version, status, ctype, clen, fd) {
    this['version'] = version;
    this['status_code'] = status;
    this['isSent'] = false;
    this['inProcess'] = false;
    this['headers'] = {};
    this['headers']['content-type'] = ctype;
    this['headers']['content-length'] = clen;
    this['body_fd'] = fd;
};

function ReqMethod() {
    this['options'] = 0;
    this['get'] = 1;
    this['head'] = 2;
    this['post'] = 3;
    this['put'] = 4;
    this['delete'] = 5;
    this['trace'] = 6;
    this['connect'] = 7;
}