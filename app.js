var express = require('express');
var routes = require('./routes');
var colors = require('colors');
var bodyParser = require('body-parser');


var app = express();
// app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


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