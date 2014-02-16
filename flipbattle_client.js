/**
* Parameters
**/
var DURATION = 200;
var DELAY = 500;
var CELLS = 18;

/**
* Socket events
**/
var EVENT_CONNECT = "connect";
var EVENT_DISCONNECT = "disconnect";
var EVENT_PLAYERS_UPDATE = "players.update";
var EVENT_STATE_INIT = "state.init";
var EVENT_STATE_UPDATE = "state.update";

/**
* Tile states
**/
var TILE_FLIPPED = "flipped";
var TILE_READY = "ready";

var iosocket;
var selectedTiles = [];
var parameters;

$(function() {
	initConnections();
});

function initConnections() {
	iosocket = io.connect();
	iosocket.on(EVENT_CONNECT, function () {
		iosocket.on(EVENT_DISCONNECT, function() {
			$("#incomingChatMessages").append("<li>Disconnected</li>");
		});
		iosocket.on(EVENT_STATE_INIT, function(game) {
			initGameGrid(game);
		});
		iosocket.on(EVENT_STATE_UPDATE, function(updateState) {
			updateGameGrid(updateState);
		});
		iosocket.on(EVENT_PLAYERS_UPDATE, function(clients) {
			updatePlayers(clients);
		});
		iosocket.emit(EVENT_STATE_INIT, "Anonymus");
	});
}

function initGameGrid(game) {
	parameters = game.parameters;
	$("#grid").empty();	
	for(var i = 0 ; i < game.tiles.length ; i++) {
		if(game.tiles[i].state == TILE_READY) {
			var id = game.tiles[i].id;
			var html = "<div id='" + id + "' class='grid_item'>";
			html += "<img class='grid_item_q' src='u.png'/>";
			html += "<img class='grid_item_w' src='" + id + game.parameters.suffixTile + "' style='display: none;'/>";
			html += "</div>";
			$("#grid").append(html);
		}
		else if(game.tiles[i].state == TILE_FLIPPED) {
			$("#grid").append("<div class='grid_item_blank'></div>");
		}
	}
	
	$("#grid").append("<div class='grid_clear'></div>");
	
	$(".grid_item").click(function (){
		itemClick(this);
	});
}

function itemClick(item){
	if(!$(item).attr("data-flipped") || $(item).attr("data-flipped") == "false") {

		var last = selectedTiles.length == parameters.matchTiles - 1;
		var id = $(item).attr("id");
		if(selectedTiles.indexOf(id) >= 0)
			return;

		selectedTiles.push(id);

		var selectedTilesCopy = selectedTiles.slice(0);
		if(last){
			selectedTiles = [];
		}

		$(item).attr("data-flipped", true);
		$(item).fadeToggle(DURATION, "swing", function (){
			$(this).find(".grid_item_q").toggle();
			$(this).find(".grid_item_w").toggle();		
			$(this).fadeToggle(DURATION, "swing", function (){
				if(last){
					iosocket.emit(EVENT_STATE_UPDATE, selectedTilesCopy);
				}
			});
		});	
	}
}

function updateGameGrid(tiles){
	for(var i = 0; i < tiles.length; i++) {
		if(tiles[i].state == TILE_FLIPPED) {
			$("#" + tiles[i].id).toggle("puff", null, DURATION, function (){
				$(this).replaceWith("<div class='grid_item_blank'></div>");	
			});	
		}
		else if(tiles[i].state == TILE_READY) {
			$("#" + tiles[i].id).fadeToggle(DURATION, "swing", function (){
				$(this).find(".grid_item_q").toggle();
				$(this).find(".grid_item_w").toggle();		
				$(this).fadeToggle(DURATION, "swing", function (){
					$(this).attr("data-flipped", false);
				});
			});
		}
	}
}

function updatePlayers(players) {
	$("#players").empty();	
	for(var i = 0 ; i < players.length ; i++) {
		$("#players").append("<li>" + players[i].name + "</li>");
	}
}