var express = require('express');
var request = require('request');
var Http = require('http');
// var Anticipant = require('anticipant');

var app = express();

var CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "X-Requested-With",
}

var INNER_REQUEST_HEADERS = {
	"User-Agent": ["Mozilla/5.0 (X11; Linux x86_64)", "AppleWebKit/537.36 (KHTML, like Gecko)", 
		"Chrome/45.0.2454.101", "Safari/537.36"].join(" "),
	"X-Requested-With": "XMLHttpRequest",
}

var cache = {};
var CACHE_MAX_AGE = 3000;

app.get('/get', function (outerRequest, outerResponse) {
	var innerUrl = outerRequest.url.substr("/get?".length);
	console.log("get", innerUrl);

	request.get({
		url: innerUrl,
		headers: INNER_REQUEST_HEADERS,
	}, function(error, innerResponse, body) {
		if (!error && innerResponse.statusCode == 200) {
			console.log("inner body:", body.substr(0, 20));
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

app.get('/get/proxy', function (outerRequest, outerResponse) {
	var innerUrl = outerRequest.url.substr("/get/proxy?".length);
	var country = innerUrl.split("&")[0];
	innerUrl = innerUrl.substr(3);
	console.log("get/proxy", country, innerUrl);

	if (cache[innerUrl]) {
		console.log("cache body: ", cache[innerUrl].substr(0, 20));
		outerResponse.writeHead(200, CORS_HEADERS);
		outerResponse.write(cache[innerUrl]);
		outerResponse.end();
	} else {
		var host, port;

		// http://spys.ru/free-proxy-list/DE/
		switch (country) {
			case "RU": 
				host = "31.173.74.73";
				port = 8080;
				break;

			case "DE":
				host = "85.114.130.226";
				port = 3128;
				break;
		}

		if (!host || !port) {
			console.log("wrong country");
			outerResponse.writeHead(401);
			outerResponse.end();
			return;
		}

		var req = Http.request({
			host: host,
			port: port,
			method: 'GET',
			path: innerUrl,
			headers: INNER_REQUEST_HEADERS,
		}, function (res) {
			var body = "";
			res.on('data', function (data) {
				body += data;
			});
			res.on('end', function() {
				cache[innerUrl] = body;
				setTimeout(function() {
					delete cache[innerUrl];
				}, CACHE_MAX_AGE);

				console.log("inner body: ", body.substr(0, 20));
				outerResponse.writeHead(200, CORS_HEADERS);
				outerResponse.write(body);
				outerResponse.end();
			});
		});
		req.on('error', function(error) {
			console.log("inner error:", error);
			outerResponse.writeHead(400);
			outerResponse.end();
		});
		req.end();
	}

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

module.exports.app = app;

if (!module.parent) {
	var port = process.env.PORT || 8085;
	var server = app.listen(port, function() {
		console.log("Listening on", port);
	});
}