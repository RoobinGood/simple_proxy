var request = require('request');
var Http = require('http');
var colors = require('colors');
var _ = require('underscore');


var CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "X-Requested-With",
};

var INNER_REQUEST_HEADERS = {
	"User-Agent": ["Mozilla/5.0 (X11; Linux x86_64)", "AppleWebKit/537.36 (KHTML, like Gecko)", 
		"Chrome/45.0.2454.101", "Safari/537.36"].join(" "),
	"X-Requested-With": "XMLHttpRequest",
};

var AVAILABLE_SITES = [
	'hdrezka.me', 'seasonvar.ru'
];

// cache
var cache = {};
var CACHE_MAX_AGE = 3000;

var cacheMiddleware = function(req, res, next) {
	var innerUrl = req.queryParams[1];

	if (cache[innerUrl]) {
		console.log("get/proxy".blue, country.blue, innerUrl.blue);
		console.log("cache body: ", cache[innerUrl].substr(0, 20));
		res.writeHead(200, CORS_HEADERS);
		res.write(cache[innerUrl]);
		res.end();
	} else {
		next();
	}
};

var saveInCache = function(requestUrl, data) {
	cache[requestUrl] = data;
	setTimeout(function() {
		delete cache[requestUrl];
	}, CACHE_MAX_AGE);
}


// utils
var sendResponse = function(res, data) {
	// console.log("inner body:", data.substr(0, 20));
	res.writeHead(200, CORS_HEADERS);
	res.write(data);
	res.end();
};

var getProxyParams = function(country, success, fail) {
	// http://spys.ru/free-proxy-list/DE/
	var proxyParams = {};
	switch (country) {
		case "RU": 
			proxyParams.host = "31.173.74.73";
			proxyParams.port = 8080;
			break;

		case "DE":
			proxyParams.host = "85.114.130.226";
			proxyParams.port = 3128;
			break;

		default:
			proxyParams = null;
	}

	if (proxyParams) {
		success(proxyParams);
	} else {
		fail();
	}
};

var checkUrl = function(url) {
	return _.some(AVAILABLE_SITES, function(item) {
		return new RegExp('^http\:\/\/(www.)?' + item).test(url);
	});
};


// routes
exports.init = function(app) {

	// args: url
	app.get('/get',
		function (outerRequest, outerResponse, next) {
			var innerUrl = outerRequest.queryParams[0];
			console.log("get".blue, innerUrl.blue);

			if (!checkUrl(innerUrl)) {
				next();
				return;
			}

			request.get({
				url: innerUrl,
				headers: INNER_REQUEST_HEADERS,
			}, function(error, innerResponse, body) {
				if (!error && innerResponse.statusCode == 200) {
					sendResponse(outerResponse, body);
				} else {
					next();
				}
			}, function() {
				next();
			});
		}
	);

	// args: url, country
	app.get('/get/proxy',
		cacheMiddleware,
		function (outerRequest, outerResponse, next) {
			var country = outerRequest.queryParams[0];
			var innerUrl = outerRequest.queryParams[1];
			console.log("get/proxy".blue, country.blue, innerUrl.blue);

			if (!checkUrl(innerUrl)) {
				next();
				return;
			}

			getProxyParams(country, function(proxyParams) {
				var req = Http.request({
					host: proxyParams.host,
					port: proxyParams.port,
					method: 'GET',
					path: innerUrl,
					headers: INNER_REQUEST_HEADERS,
				}, function (res) {
					var body = "";
					res.on('data', function (data) {
						body += data;
					});
					res.on('end', function() {
						saveInCache(outerRequest.url, body);
						sendResponse(outerResponse, body);
					});
				});
				req.on('error', function(error) {
					next();
				});
				req.end();
			}, function() {
				next();
			})
		}
	);

	// args: url, [params]
	app.get('/post',
		function (outerRequest, outerResponse, next) {
			var innerUrl = outerRequest.queryParams[0].split('?')[0];
			console.log('post'.blue, innerUrl.blue);

			if (!checkUrl(innerUrl)) {
				next();
				return;
			}

			var params = outerRequest.query;
			var key = outerRequest.queryParams[0].split('?')[1];
			params[key] = params[outerRequest.queryParams[0]];
			delete params[outerRequest.queryParams[0]];

			console.log('\t', params);

			request.post({
				url: innerUrl,
				headers: INNER_REQUEST_HEADERS,
				formData: params,
			}, function(error, innerResponse, body) {
				if (!error && innerResponse.statusCode == 200) {
					sendResponse(outerResponse, body);
				} else {
					next();
				}
			}, function() {
				next();
			});
		}
	);
};
