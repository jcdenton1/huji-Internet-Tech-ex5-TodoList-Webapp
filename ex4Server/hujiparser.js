var path = require('path');
var http = require(__dirname+path.sep+'hujihttp');

exports.parse = function (String) {
    return new http.HTTPrequest(String);
};

exports.stringify = function (HttpResponseObject) {
    var str = "";
    str = str.concat('HTTP/',HttpResponseObject.version,' ',HttpResponseObject.status_code,'\n');
    str = str.concat('Content-Type: ',HttpResponseObject['headers']['content-type'],'\n');
    str = str.concat('Content-Length: ',HttpResponseObject['headers']['content-length'],'\n');
    for (var i = 0; i < HttpResponseObject['headers']['Cookies'].length; i++) {
        str = str.concat('Set-Cookie: ');
        var cookie = HttpResponseObject['headers']['Cookies'][i];
        for (field in cookie) {
            if (cookie.hasOwnProperty(field))
                str = str.concat(field,'=',cookie[field],'; ');
        }
        str = str.concat('\n');
    }
    str = str.concat('\n');
    return str;
};