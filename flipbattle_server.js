var fs = require('fs')
,http = require('http')
,io = require('socket.io')
,url = require('url');

var ITEM_MAX = 230;
var DISTINCT_ITEMS = 8;
var gameModel = [];
var port = process.env.PORT || 8080;

initGameModel();

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
		var img = findItemById(id).img;
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
}).listen(port, function() {
	console.log('Listening at: http://localhost:8080');
});

io = io.listen(server).on('connection', function (socket) {
	socket.on('state.init', function (id) {
		console.log('state.init received: ', id);
		socket.emit('state.init', gameModel);
	});
	socket.on('state.update', function (selectedItems) {
		console.log('state.update received: ', selectedItems);
		var itemA = findItemById(selectedItems[0]);
		console.log(itemA);
		var itemB = findItemById(selectedItems[1]);
		console.log(itemB);
		var stateUpdate = {'items': selectedItems, 'action': 'delete'}
		if(itemA != null && itemB != null && itemA.img == itemB.img) {
			// Add score to player
			
			// Update model
			gameModel[findItemIndexById(itemA.id)].state = "flipped";
			gameModel[findItemIndexById(itemB.id)].state = "flipped";
			if(checkGameEnded()){
				console.log('Game ended, starting new one...');
				for(var i = 0 ; i < gameModel.length ; i++) {
					gameModel[i].state = 'active';
				}
				io.sockets.emit('state.init', gameModel);
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
	var images = [];
	for(var i = 0 ; i <= DISTINCT_ITEMS ; i++) {
		var img = Math.floor(Math.random() * ITEM_MAX);
		if(images.indexOf(img) < 0) {
			images.push(img);
			images.push(img);
		}
	}
	images = shuffle(images);
	for(var i = 0 ; i < images.length ; i++) {
		gameModel.push({
			'id': i, 
			'img': images[i],
			'state': 'active'
		});
	}
}

function checkGameEnded() {
	for(var i = 0 ; i < gameModel.length ; i++) {
		if(gameModel[i].state == 'active') {
			return false;
		}
	}
	return true;
}

function findItemById(id) {
	var index = findItemIndexById(id);
	if(index >= 0)
		return gameModel[index];
	return null;
}

function findItemIndexById(id) {
	for(var i = 0 ; i < gameModel.length ; i++) {
		if(gameModel[i].id == id) {
			return i;
		}
	}
	return -1;
}

function shuffle(o){ 
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};