var express = require('express');
var request = require('request');
// var Anticipant = require('anticipant');

var app = express();

var CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "X-Requested-With",
}

var INNER_REQUEST_HEADERS = {
	"User-Agent": ["Mozilla/5.0 (X11; Linux x86_64)", "AppleWebKit/537.36 (KHTML, like Gecko)", 
		"Chrome/45.0.2454.101", "Safari/537.36"].join(" "),
}

app.get('/get', function (outerRequest, outerResponse) {
	var innerUrl = outerRequest.url.substr("/get?".length);
	console.log(innerUrl);

	request.get({
		url: innerUrl,
		headers: INNER_REQUEST_HEADERS,
	}, function(error, innerResponse, body) {
		if (!error && innerResponse.statusCode == 200) {
			console.log("inner body: ", body.substr(0, 20));
			outerResponse.writeHead(200, CORS_HEADERS);
			outerResponse.write(body);
			outerResponse.end();
		} else {
			console.log("inner error:", error, innerResponse && innerResponse.statusCode);
			outerResponse.writeHead(400);
			outerResponse.end();
		}
	}, function() {
		console.log("inner error:", error, innerResponse && innerResponse.statusCode);
		outerResponse.writeHead(400);
		outerResponse.end();
	});
});

app.get('/post', function (outerRequest, outerResponse) {
	var urlComponents = outerRequest.url.substr("/post?".length).split("?");
	var innerUrl = urlComponents[0];
	console.log(innerUrl);
	var params = {};
	if (urlComponents.length > 1) {
		var paramsList = urlComponents[1].split("&");
		paramsList.forEach(function(p) {
			var paramData = p.split("=");
			params[paramData[0]] = paramData[1];
		});
	}
	console.log("\t", params);

	request.post({
		url: innerUrl,
		headers: INNER_REQUEST_HEADERS,
		formData: params,
	}, function(error, innerResponse, body) {
		if (!error && innerResponse.statusCode == 200) {
			console.log("inner body: ", body.substr(0, 20));
			outerResponse.writeHead(200, CORS_HEADERS);
			outerResponse.write(body);
			outerResponse.end();
		} else {
			console.log("inner error:", error, innerResponse && innerResponse.statusCode);
			outerResponse.writeHead(400);
			outerResponse.end();
		}
	}, function() {
		console.log("inner error:", error, innerResponse && innerResponse.statusCode);
		outerResponse.writeHead(400);
		outerResponse.end();
	});
});

var port = process.env.PORT || 8085;
app.listen(port, function() {
	console.log("Listening on", port);
});


var getTest = function(serverAddress) {
	var testUrl;
	testUrl = "http://seasonvar.ru/serial-12490-Tyazhlyj_ob_ekt-1-season.html";
	testUrl = "http://hdrezka.me/series/horror/11460-vtoroy-shans.html";

	request.get({
		url: ["http://", serverAddress, ":", port, "/get?", testUrl].join("")
	}, function(error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log("get proxy response", body.substr(0, 50));
			// console.log("proxy response", response);
		} else {
			console.log("get proxy error:", error);
		}
	});
}

var postTest = function(serverAddress) {
	var testUrl;
	testUrl = ["http://hdrezka.me/engine/ajax/getcdnvideo.php", "id=234&translator_id=1"].join("?");

	request.get({
		url: ["http://", serverAddress, ":", port, "/post?", testUrl].join("")
	}, function(error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log("post proxy response", body.substr(0, 50));
			// console.log("proxy response", response);
		} else {
			console.log("post proxy error:", error);
		}
	});
}


var serverAddress;
serverAddress = "127.0.0.1";

getTest(serverAddress);
postTest(serverAddress);