var request = require('request');
var app = require('./app').app;
var Anticipant = require('anticipant');

var getTest = function(serverAddress, testUrl, proxyCountry, success) {
	request.get({
		url: ["http://", serverAddress, ":", port, "/get", 
			proxyCountry ? ("/proxy?" + proxyCountry + "&") : "?", testUrl].join("")
	}, function(error, response, body) {
		if (!error && response.statusCode == 200) {
			// console.log("get proxy response", body.substr(0, 50));
			if (body && body.length > 0) {
				console.log("OK", testUrl);
			}
		} else {
			console.log("get proxy error:", error);
		}
		success && success();
	});
}

var postTest = function(serverAddress, testUrl, success) {
	request.get({
		url: ["http://", serverAddress, ":", port, "/post?", testUrl].join("")
	}, function(error, response, body) {
		if (!error && response.statusCode == 200) {
			// console.log("post proxy response", body.substr(0, 50));
			if (body && body.length > 0) {
				console.log("OK", testUrl);
			}
		} else {
			console.log("post proxy error:", error);
		}
		success && success();
	});
}

var runTestsGet = function(serverAddress) {
	var testUrls = [
		{
			url: "http://seasonvar.ru/serial-12490-Tyazhlyj_ob_ekt-1-season.html",
		}, {
			url: "http://seasonvar.ru/serial-12498-Flesh-2-season.html",
			proxyCountry: "DE",
		}, {
			url: "http://hdrezka.me/series/horror/11460-vtoroy-shans.html",
			proxyCountry: "RU",
		},
	];
	testUrls.forEach(function(url) {
		testAnticipant.register("test_item");
		getTest(serverAddress, url.url, url.proxyCountry, function() {
			testAnticipant.perform("test_item");
		});
	});
}

var runTestsPost = function(serverAddress) {
	var testUrls = [
		"http://seasonvar.ru/player.php?id=12865&serial=7783&type=flash",
		"http://hdrezka.me/engine/ajax/getcdnvideo.php?id=234&translator_id=1",
	];
	testUrls.forEach(function(url) {
		testAnticipant.register("test_item");
		postTest(serverAddress, url, function() {
			testAnticipant.perform("test_item");
		});
	});
}


var port = process.env.PORT || 8085;
var server = app.listen(port, function() {
	console.log("Listening on", port);
});

var serverAddress = "127.0.0.1";

var testAnticipant = Anticipant.create(["all_tests"], function() {
	server.close();
});

runTestsGet(serverAddress);
runTestsPost(serverAddress);

testAnticipant.perform("all_tests");