var express = require('express');
var routes = require('./routes');
var colors = require('colors');


var app = express();

app.use(function(req, res, next) {
	req.queryParams = Object.keys(req.query);
	// console.log(req.queryParams);
	next();
});

routes.init(app);

// errorHandler
app.use(function(req, res) {
	console.log("error".red);
	res.writeHead(400);
	res.end();
});


module.exports.app = app;

if (!module.parent) {
	var port = process.env.PORT || 8085;
	var server = app.listen(port, function() {
		console.log("Listening on", port);
	});
}