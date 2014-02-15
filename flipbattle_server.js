var fs = require('fs')
,http = require('http')
,io = require('socket.io')
,url = require('url')
,hat = require('hat');

var AVAILABLE_TILES = 1082;
var DISTINCT_TILES = 2;
var port = process.env.PORT || 8080;
var https = process.env.PORT ? true : false;

var game = {
	tiles : [],
	players : []
};

var history = {

};

initGameModel();

var server = http.createServer(function(req, res) {
	if(https && req.headers['x-forwarded-proto']!='https') {
		res.writeHead(301, { Location: 'https://' + req.headers.host + req.url});
		res.end();
	}
	else {
		if(req.url.indexOf('favicon.png') != -1) {
			var pathname = url.parse(req.url).pathname;
			fs.readFile(__dirname + '/favicon.png', function (err, data) {
				if (err) console.log(err);
				res.writeHead(200, {'Content-Type': 'image/png'});
				res.write(data);
				res.end();
			});
		}
		else if(req.url.indexOf('.png') != -1) {
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
			var id = pathname.substring(1, pathname.length - 4);
			var img = findItemById(id).image;
			fs.readFile(__dirname + '/img/tiles/' + img + '.png', function (err, data) {
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
	}
}).listen(port, function() {
	console.log('Listening at port ' + port);
});

var clients = [];

io = io.listen(server).on('connection', function (socket) {
	clients.push(socket.id);
	io.sockets.emit('players.update', clients);
	socket.on('disconnect', function () {
    	clients.splice(clients.indexOf(socket.id), 1 );
    	io.sockets.emit('players.update', clients);
	});
	socket.on('state.init', function (id) {
		console.log('state.init received: ', id);
		socket.emit('state.init', game);
	});
	socket.on('state.update', function (selectedItems) {
		console.log('state.update received: ', selectedItems);
		var itemA = findItemById(selectedItems[0]);
		var itemB = findItemById(selectedItems[1]);
		var stateUpdate = {'items': selectedItems, 'action': 'delete'}
		if(itemA != null && itemB != null && itemA.image == itemB.image) {
			// Add score to player
			
			// Update model
			game.tiles[findItemIndexById(itemA.id)].state = "flipped";
			game.tiles[findItemIndexById(itemB.id)].state = "flipped";
			if(checkGameEnded()){
				console.log('Game ended, starting new one...');
				initGameModel();
				io.sockets.emit('state.init', game);
			}
			else {
				io.sockets.emit('state.update', stateUpdate);
			}
		}
		else {
			stateUpdate.action = 'revert';
			socket.emit('state.update', stateUpdate);
		}
	});
});

function initGameModel() {
	game.tiles = [];
	var images = [];
	for(var i = 0 ; i < DISTINCT_TILES ; i++) {
		var img = Math.floor(Math.random() * AVAILABLE_TILES);
		if(images.indexOf(img) < 0) {
			images.push(img);
			images.push(img);
		}
	}
	images = shuffle(images);
	for(var i = 0 ; i < images.length ; i++) {
		var imageId = hat();
		game.tiles.push({
			'id': imageId, 
			'image': images[i],
			'state': 'active'
		});
	}
}

function checkGameEnded() {
	for(var i = 0 ; i < game.tiles.length ; i++) {
		if(game.tiles[i].state == 'active') {
			return false;
		}
	}
	return true;
}

function findItemById(id) {
	var index = findItemIndexById(id);
	if(index >= 0)
		return game.tiles[index];
	return null;
}

function findItemIndexById(id) {
	for(var i = 0 ; i < game.tiles.length ; i++) {
		if(game.tiles[i].id == id) {
			return i;
		}
	}
	return -1;
}

function shuffle(o){ 
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};