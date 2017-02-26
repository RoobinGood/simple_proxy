var request = require('request');
var Http = require('http');
var urlUtils = require('url');
var colors = require('colors');
var _ = require('underscore');


var CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "X-Requested-With",
};

var INNER_REQUEST_HEADERS = {
	'User-Agent': [
		'Mozilla/5.0 (X11; Linux x86_64)', 'AppleWebKit/537.36 (KHTML, like Gecko)',
		'Chrome/53.0.2785.116', 'Safari/537.36'
	].join(' '),
	'X-Requested-With': 'XMLHttpRequest'
};

var additionalHeaders = {
	'hdrezka.me': {
		'Host': 'hdrezka.me'
		// 'Upgrade-Insecure-Requests': '1',
	},
	'seasonvar.ru': {}
};

var availableHosts = _(additionalHeaders).keys();

var checkUrl = function(url) {
	var hostname = urlUtils.parse(url).hostname;
	return _(availableHosts).any(function(availableHost) {
		return availableHost === hostname;
	});
};

var getInnerRequestHeaders = function(url) {
	var hostname = urlUtils.parse(url).hostname;
	console.log(hostname)
	console.log(_({}).extend(
		INNER_REQUEST_HEADERS, additionalHeaders[hostname]
	))
	return _({}).extend(
		INNER_REQUEST_HEADERS, additionalHeaders[hostname]
	);
};


// cache
var cache = {};
var CACHE_MAX_AGE = 3000;

var cacheMiddleware = function(req, res, next) {
	var innerUrl = req.query.url;

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
};


// utils
var sendResponse = function(res, data) {
	// console.log("inner body:", data.substr(0, 20));
	res.writeHead(200, CORS_HEADERS);
	res.write(data);
	res.end();
};

var getProxyParams = function(country, success, fail) {
	// http://spys.ru/free-proxy-list/RU/
	// http://spys.ru/free-proxy-list/DE/
	var proxyParams = {};
	switch (country) {
		case 'RU':
			proxyParams.host = '62.148.134.138';
			proxyParams.port = 8081;
			break;

		case "DE":
			proxyParams.host = "52.59.38.179";
			proxyParams.port = 8083;
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

// routes
exports.init = function(app) {

	app.use(function(req, res, next) {
		var url = req.query.url;

		if (checkUrl(url)) {
			next();
		} else {
			console.log('url check error'.red);
			res.writeHead(400);
			res.end();
		}
	});

	// args: url
	app.get('/get',
		function (outerRequest, outerResponse, next) {
			var innerUrl = outerRequest.query.url;
			console.log("get".blue, innerUrl.blue);

			request.get({
				url: innerUrl,
				headers: getInnerRequestHeaders(innerUrl),
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
			var innerUrl = outerRequest.query.url;
			var country = outerRequest.query.country;
			console.log("get/proxy".blue, country.blue, innerUrl.blue);

			getProxyParams(country, function(proxyParams) {
				var req = Http.request({
					host: proxyParams.host,
					port: proxyParams.port,
					method: 'GET',
					path: innerUrl,
					headers: getInnerRequestHeaders(innerUrl),
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
			});
		}
	);

	// args: url, [params]
	app.get('/post',
		function (outerRequest, outerResponse, next) {
			var innerUrl = outerRequest.query.url;
			var params = JSON.parse(outerRequest.query.params);

			console.log('post'.blue, innerUrl.blue);
			console.log('\t', params);

			request.post({
				url: innerUrl,
				headers: getInnerRequestHeaders(innerUrl),
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
