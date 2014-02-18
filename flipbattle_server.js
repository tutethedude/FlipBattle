/**
* Node modules
**/
var fs = require("fs");
var http = require("http");
var io = require("socket.io");
var url = require("url");
var hat = require("hat");

/**
* Parameters
**/
var AVAILABLE_TILES = 1082;
var DISTINCT_TILES = 14;
var MATCH_TILES = 2;
var SUFFIX_TILE = ".tile";
var PORT = process.env.PORT || 8080;
var USE_SSL = process.env.PORT ? true : false;

/**
* Socket events
**/
var EVENT_CONNECTION = "connection";
var EVENT_DISCONNECT = "disconnect";
var EVENT_PLAYERS_UPDATE = "players.update";
var EVENT_STATE_INIT = "state.init";
var EVENT_STATE_UPDATE = "state.update";

/**
* Tile states
**/
var TILE_FLIPPED = "flipped";
var TILE_READY = "ready";

/**
* Game state structure
**/
var game = {
	images : [],
	tiles : [],
	players : [],
	parameters : {
		distinctTiles : DISTINCT_TILES,
		matchTiles : MATCH_TILES,
		suffixTile : SUFFIX_TILE
	},
	wave : 0
};

/**
* Global statistics
**/
var history = {
	games : 0,
	flips : 0,
	highscore : []
};

// Init game model for first use
initGame();

// Start server
var server = http.createServer(processRoute).listen(PORT, function() {
	console.log("Listening at port " + PORT);
});

// Init sockets
io = io.listen(server).on(EVENT_CONNECTION, function (socket) {
	// Player connection event
	eventConnection(socket);
	// Player disconnect event
	socket.on(EVENT_DISCONNECT, function () {
		eventDisconnect(socket);
	});
	// Player state init event
	socket.on(EVENT_STATE_INIT, function (playerName) {
		eventStateInit(socket, playerName);
	});
	// Player state update event
	socket.on(EVENT_STATE_UPDATE, function (selectedTiles) {
		eventStateUpdate(socket, selectedTiles);
	});
});

/**
* Socket.io events
**/
function eventConnection(socket) {
	var player = {
		id : socket.id,
		name : "Anonymous",
		score : 0,
		avatar : 0
	};
	game.players.push(player);
}

function eventDisconnect(socket) {
	game.players.splice(indexById(game.players, socket.id), 1);
    io.sockets.emit(EVENT_PLAYERS_UPDATE, game.players);
}

function eventStateInit(socket, player) {
	game.players[indexById(game.players, socket.id)].name = player.name;
	game.players[indexById(game.players, socket.id)].avatar = player.avatar;
	socket.emit(EVENT_STATE_INIT, gamePublicData(socket.id));
	io.sockets.emit(EVENT_PLAYERS_UPDATE, game.players);
}

function eventStateUpdate(socket, selectedTiles) {
	var tiles = [];
	var images = [];
	for(var i = 0; i < selectedTiles.length; i++) {
		tiles.push(game.tiles[indexById(game.tiles, selectedTiles[i])]);
		images.push(game.images[indexById(game.images, selectedTiles[i])]);
	}
	
	var correctFlip = true;
	for(var i = 1; i < images.length; i++) {
		correctFlip &= images[i].image == images[0].image;
	}

	if(correctFlip == true) {
		for(var i = 0; i < tiles.length; i++) {
			game.tiles[indexById(game.tiles, tiles[i].id)].state = TILE_FLIPPED;
			tiles[i].state = TILE_FLIPPED;
		}
		game.players[indexById(game.players, socket.id)].score += 1;
		if(checkGameEnded()){
			initGame();
			io.sockets.emit(EVENT_STATE_INIT, gamePublicData(socket.id));
		}
		else {
			var updateData = {
				tiles : tiles,
				players : game.players
			};
			io.sockets.emit(EVENT_STATE_UPDATE, updateData);
		}
	}
	else {
		var updateData = {
			tiles : tiles,
			players : game.players
		};
		socket.emit(EVENT_STATE_UPDATE, updateData);
	}
}

/**
* Init game tiles
**/
function initGame() {
	game.tiles = [];
	var images = [];
	for(var i = 0 ; i < DISTINCT_TILES ; i++) {
		var img = Math.floor(Math.random() * AVAILABLE_TILES);
		if(images.indexOf(img) < 0) {
			for(var j = 0 ; j < MATCH_TILES ; j++) {
				images.push(img);
			}
		}
	}
	images = shuffle(images);
	for(var i = 0 ; i < images.length ; i++) {
		var imageId = hat();
		game.tiles.push({
			id: imageId,
			state: TILE_READY
		});
		game.images.push({
			id: imageId, 
			image: images[i]
		});
	}
	for(var i = 0 ; i < game.players ; i++) {
		//game.players[i].score = 0;
	}
	game.wave++;
}

/**
* True if all tiles are cleared
**/
function checkGameEnded() {
	for(var i = 0 ; i < game.tiles.length ; i++) {
		if(game.tiles[i].state != TILE_FLIPPED) {
			return false;
		}
	}
	return true;
}

function gamePublicData(playerId) {
	return {
		tiles : game.tiles,
		parameters : game.parameters,
		players : game.players,
		wave : game.wave,
		playerId : playerId
	};
}

/**
* Util functions
**/
function shuffle(o){ 
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

function indexByKey(array, key, value) {
    for (var i = 0; i < array.length; i++) {
        if (array[i][key] == value) {
            return i;
        }
    }
    return null;
}

function indexById(array, value) {
    return indexByKey(array, "id", value);
}

/**
* Process requests and routing
**/
function processRoute(req, res) {
	// Always redirect to HTTPS
	if(USE_SSL && req.headers["x-forwarded-proto"]!="https") {
		res.writeHead(301, { Location: "https://" + req.headers.host + req.url});
		res.end();
	}
	else {
		// Route to favicon
		if(req.url.indexOf("favicon.png") != -1) {
			res.writeHead(200, {"Content-Type": "image/png"});
			res.end(fs.readFileSync(__dirname + "/favicon.png"));
		}
		// Route to image folder
		else if(req.url.indexOf(".png") != -1) {
			var pathname = url.parse(req.url).pathname;
			res.writeHead(200, {"Content-Type": "image/png"});
			res.end(fs.readFileSync(__dirname + "/img" + pathname));
		}
		// Route to tiles using tile id
		else if(req.url.indexOf(SUFFIX_TILE) != -1) {
			var pathname = url.parse(req.url).pathname;
			var id = pathname.substring(1, pathname.length - SUFFIX_TILE.length);
			var image = game.images[indexById(game.images, id)].image;
			res.writeHead(200, {"Content-Type": "image/png"});
			res.end(fs.readFileSync(__dirname + "/img/tiles/" + image + ".png"));
		}
		// Route to avatars using id
		else if(req.url.indexOf(".avatar") != -1) {
			var pathname = url.parse(req.url).pathname;
			var id = pathname.substring(1, pathname.length - 7);
			res.writeHead(200, {"Content-Type": "image/png"});
			res.end(fs.readFileSync(__dirname + "/img/avatars/" + id + ".png"));
		}
		// Route to client javascript
		else if(req.url.indexOf("flipbattle_client.js") != -1) {
			res.writeHead(200, {"Content-Type": "text/javascript"});
			res.end(fs.readFileSync(__dirname + "/flipbattle_client.js"));
		}
		// Route to stylesheet
		else if(req.url.indexOf("flipbattle.css") != -1) {
			res.writeHead(200, {"Content-Type": "text/css"});
			res.end(fs.readFileSync(__dirname + "/flipbattle.css"));
		}
		// Everything else defaults to html page
		else {
			res.writeHead(200, { "Content-type": "text/html"});
			res.end(fs.readFileSync(__dirname + "/flipbattle.html"));
		}	
	}
}