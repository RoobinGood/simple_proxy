var request = require('request');
var app = require('./app').app;

var getTest = function(serverAddress, testUrl, needProxy) {
	request.get({
		url: ["http://", serverAddress, ":", port, "/get", needProxy ? "/proxy" : "", "?", testUrl].join("")
	}, function(error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log("get proxy response", body.substr(0, 50));
			// console.log("proxy response", response);
		} else {
			console.log("get proxy error:", error);
		}
	});
}

var postTest = function(serverAddress, testUrl) {
	request.get({
		url: ["http://", serverAddress, ":", port, "/post?", testUrl].join("")
	}, function(error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log("post proxy response", body.substr(0, 50));
			// console.log("post proxy response", response);
		} else {
			console.log("post proxy error:", error);
		}
		// server.close();
	});
}

var runTestsGet = function(serverAddress) {
	var testUrls = [
		{
			url: "http://seasonvar.ru/serial-12490-Tyazhlyj_ob_ekt-1-season.html",
		}, {
			url: "http://hdrezka.me/series/horror/11460-vtoroy-shans.html",
			needProxy: true,
		},
	];
	testUrls.forEach(function(url) {
		getTest(serverAddress, url.url, url.needProxy);
	});
}

var runTestsPost = function(serverAddress) {
	var testUrls = [
		"http://seasonvar.ru/player.php?id=12865&serial=7783&type=flash",
		"http://hdrezka.me/engine/ajax/getcdnvideo.php?id=234&translator_id=1",
	];
	testUrls.forEach(function(url) {
		postTest(serverAddress, url);
	});
}


var port = process.env.PORT || 8085;
var server = app.listen(port, function() {
	console.log("Listening on", port);
});

var serverAddress = "127.0.0.1";

runTestsGet(serverAddress);
// runTestsPost(serverAddress);