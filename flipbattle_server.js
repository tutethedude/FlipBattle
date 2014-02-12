var fs = require('fs')
,http = require('http')
,io = require('socket.io')
,url = require('url');

var ITEM_COUNT_HALF = 9;
var gameModel = new Array();
for(var i = 0 ; i < ITEM_COUNT_HALF ; i++) {
	gameModel.push({'id': i, 'img': (i + 10)});
}

var server = http.createServer(function(req, res) {
	if(req.url.indexOf('.png') != -1) {
		var pathname = url.parse(req.url).pathname;
		fs.readFile(__dirname + '/img' + pathname, function (err, data) {
			if (err) console.log(err);
			res.writeHead(200, {'Content-Type': 'image/png'});
			res.write(data);
			res.end();
		});
	}
	else if(req.url.indexOf('.img') != -1) {
		var pathname = url.parse(req.url).pathname;
		var id = parseInt(pathname.substring(1, pathname.length - 4));
		var img = 0;
		// Find imag from id
		for(var i = 0 ; i < gameModel.length ; i++) {
			if(gameModel[i].id == id) {
				img = gameModel[i].img;
				break;
			}
		}
		fs.readFile(__dirname + '/img/flags/' + img + '.png', function (err, data) {
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

io.listen(server).on('connection', function (socket) {
	socket.on('state.init', function (id) {
		console.log('state.init received: ', id);
		socket.emit('state.init', gameModel);
	});
	socket.on('state.update', function (id) {
		console.log('state.update received: ', id);
		socket.broadcast.emit('state.update', gameModel);
	});
});