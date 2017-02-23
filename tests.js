var request = require('request');
var app = require('./app').app;
var Anticipant = require('anticipant');
var colors = require('colors');


var getTest = function(serverAddress, testUrl, proxyCountry, callback) {
	request.get({
		url: ["http://", serverAddress, ":", port, "/get",
			proxyCountry ? ('/proxy?country=' + proxyCountry + "&") : "?",
			'url=', testUrl].join("")
	}, function(error, response, body) {
		var result = !error && response.statusCode == 200;
		if (result) {
			console.log("get proxy response", body.substr(0, 100));
			if (body && body.length > 0) {
				console.log("OK GET".blue, testUrl);
			}
		} else {
			console.log("FAIL".blue, testUrl);
		}
		callback && callback(result);
	});
}

var postTest = function(serverAddress, testUrl, callback) {
	request.get({
		url: ["http://", serverAddress, ":", port, "/post?", testUrl].join("")
	}, function(error, response, body) {
		var result = !error && response.statusCode == 200;
		if (result) {
			console.log("post proxy response", body.substr(0, 50));
			if (body && body.length > 0) {
				console.log("OK POST".blue, testUrl);
			}
		} else {
			console.log("FAIL".blue, testUrl, error);
		}
		callback && callback(result);
	});
}

var runTestsGet = function(serverAddress) {
	var testUrls = [
		{
			url: "http://seasonvar.ru/serial-12490-Tyazhlyj_ob_ekt-1-season.html",
			expect: true
		},
		{
			url: "http://google.com",
			expect: false
		},
		{
			url: "http://www.seasonvar.ru/playls2//transNewStudio/12498/list.xml ",
			expect: true
		},
		{
			url: "http://seasonvar.ru/serial-12498-Flesh-2-season.html",
			proxyCountry: "DE",
			expect: true
		},
		{
			url: "http://seasonvar.ru/serial-14024-Prostranstvo-2-season.html",
			proxyCountry: "DE",
			expect: true
		},
		{
			url: "http://hdrezka.me/series/horror/11460-vtoroy-shans.html",
			proxyCountry: 'RU',
			expect: true
		},
	];


	testUrls.forEach(function(item) {
		testAnticipant.register("test_item" + item.url);
		getTest(serverAddress, item.url, item.proxyCountry, function(result) {
			if (result === item.expect) {
				console.log('TEST OK'.green);
			} else {
				console.log('TEST FAIL'.red);
			}
			testAnticipant.perform("test_item" + item.url);
		});
	});
}

var runTestsPost = function(serverAddress) {
	var testUrls = [
		{
			url: 'http://seasonvar.ru/player.php',
			params: {
				id: 12865,
				serial: 7783,
				type: 'flash'
			},
			expect: true
		},
		{
			url: 'http://hdrezka.me/engine/ajax/getcdnvideo.php',
			params: {
				id: 234,
				translator_id: 1
			},
			expect: true
		}
	];

	testUrls.forEach(function(item) {
		testAnticipant.register("test_item" + item.url);
		var url = 'url=' + item.url + '&params=' + JSON.stringify(item.params);
		postTest(serverAddress, url, function(result) {
			if (result === item.expect) {
				console.log('TEST OK'.green);
			} else {
				console.log('TEST FAIL'.red);
			}
			testAnticipant.perform("test_item" + item.url);
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

setTimeout(function() {
	// runTestsGet(serverAddress);
	// runTestsPost(serverAddress);

	testAnticipant.perform("all_tests");
}, 5000);
