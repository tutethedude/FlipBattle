var fs = require('fs')
	,http = require('http')
	,socketio = require('socket.io')
	,url = require('url');
 
var server = http.createServer(function(req, res) {
	if(req.url.indexOf('.png') != -1) {
		var pathname = url.parse(req.url).pathname;
		console.log("Request for " + pathname + " received.");
		fs.readFile(__dirname + '/img' + pathname, function (err, data) {
			if (err) console.log(err);
			res.writeHead(200, {'Content-Type': 'image/png'});
			res.write(data);
			res.end();
		});
	}
	else if(req.url.indexOf('flipbattle_client.js') != -1) {
		fs.readFile(__dirname + '/flipbattle_client.js', function (err, data) {
			if (err) console.log(err);
			res.writeHead(200, {'Content-Type': 'text/javascript'});
			res.write(data);
			res.end();
		});
	}
	else if(req.url.indexOf('flipbattle.css') != -1) {
		fs.readFile(__dirname + '/flipbattle.css', function (err, data) {
			if (err) console.log(err);
			res.writeHead(200, {'Content-Type': 'text/css'});
			res.write(data);
			res.end();
		});
	}
	else {
		res.writeHead(200, { 'Content-type': 'text/html'});
		res.end(fs.readFileSync(__dirname + '/flipbattle.html'));
	}	
}).listen(8080, function() {
	console.log('Listening at: http://localhost:8080');
});
 
socketio.listen(server).on('connection', function (socket) {
	socket.on('item.delete', function (id) {
		console.log('Delete received: ', id);
		socket.broadcast.emit('item.delete', id);
	});
});