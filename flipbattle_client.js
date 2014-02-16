/**
* Parameters
**/
var DURATION = 200;
var DELAY = 500;
var CELLS = 18;
var AVATARS = 12

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

/**
* Variables
**/
var iosocket;
var selectedTiles = [];
var parameters;
var nickname;
var playerId;

/**
* Document load
**/
$(function() {
	tutorial();
	register();
});

/**
* Animate tutorial widgets
**/
function tutorial() {
	// Sample flip
	window.setTimeout(function(){
		$("#sampleA").fadeToggle(DURATION, "swing", function (){
			$(this).find(".grid_item_q").toggle();
			$(this).find(".grid_item_w").toggle();		
			$(this).fadeToggle(DURATION, "swing", function (){
				window.setTimeout(function(){
					$("#sampleB").fadeToggle(DURATION, "swing", function (){
						$(this).find(".grid_item_q").toggle();
						$(this).find(".grid_item_w").toggle();		
						$(this).fadeToggle(DURATION, "swing", function (){
							$("#sampleA,#sampleB").toggle("puff", null, DURATION, function (){
								$(this).replaceWith("<div class='grid_item_blank'></div>");	
							});	
						});
					});		
				}, DELAY);
			});
		});		
	}, DELAY);

	// Sample score
	window.setTimeout(function(){
		var item = $("#targetScore").detach();
		item.insertBefore("#maxScore");
		item.effect("highlight", {color: "darkgray"}, 500);
		$("#targetScore > div > div.score").html("50 pts");
	}, DELAY * 5);
}

function register() {
	$("#txtNickname").val(randomName());
	$("#btnPlay").click(function(){
		nickname = $("#txtNickname").val().trim();
		if(nickname == "")
			nickname = randomName();
		initConnection();
	});
	for(var i = 0; i <= AVATARS; i++ ){
		$("#avatarSelect").append('<img src="' + i + '.avatar" />');
	}
	$("#avatarSelect").append('<div class="grid_clear">&nbsp;</div>');
	$("#avatarSelect img").first().toggleClass("selected");
	$("#avatarSelect img").click(function(){
		$("#avatarSelect img.selected").toggleClass("selected");
		$(this).toggleClass("selected");
	});
}

function initConnection() {
	iosocket = io.connect();
	iosocket.on(EVENT_CONNECT, function () {
		iosocket.on(EVENT_DISCONNECT, function() {
			$("#incomingChatMessages").append("<li>Disconnected</li>");
		});
		iosocket.on(EVENT_STATE_INIT, function(gameData) {
			playerId = gameData.playerId;
			initGameGrid(gameData);
			updatePlayers(gameData.players);
		});
		iosocket.on(EVENT_STATE_UPDATE, function(updateData) {
			updateGameGrid(updateData.tiles);
			updatePlayers(updateData.players);
		});
		iosocket.on(EVENT_PLAYERS_UPDATE, function(players) {
			updatePlayers(players);
		});
		var avatar = $("#avatarSelect img.selected").attr("src");
		var player = {
			name : nickname,
			avatar : avatar.substring(0, avatar.length - 7)
		};
		iosocket.emit(EVENT_STATE_INIT, player);
	});
}

function initGameGrid(game) {
	parameters = game.parameters;
	$("#main").empty();	
	for(var i = 0 ; i < game.tiles.length ; i++) {
		if(game.tiles[i].state == TILE_READY) {
			var id = game.tiles[i].id;
			var html = "<div id='" + id + "' class='grid_item'>";
			html += "<img class='grid_item_q' src='u.png'/>";
			html += "<img class='grid_item_w' src='" + id + game.parameters.suffixTile + "' style='display: none;'/>";
			html += "</div>";
			$("#main").append(html);
		}
		else if(game.tiles[i].state == TILE_FLIPPED) {
			$("#main").append("<div class='grid_item_blank'></div>");
		}
	}
	
	$("#main").append("<div class='grid_clear'></div>");

	$("#info").empty();	
	$("#info").append("<p>Wave " + game.wave + "</p>");
	
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
	players.sort(function(a,b) { return parseFloat(b.score) - parseFloat(a.score) } );
	$("#players").empty();
	for(var i = 0 ; i < players.length ; i++) {
		var name = players[i].id == playerId ? players[i].name + " (you)" : players[i].name;
		$("#players").append('<div class="avatar"><img src="' + players[i].avatar + '.avatar" /><div><div class="player">' + name + '</div><div class="score">' + players[i].score +' pts</div></div></div>');
	}
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

function randomName(){
	var names = ["Sung","Kiley","Sherryl","Michel","Tyrell","Madie","Annika","Katharine","Jess","Thi","Kelvin","Kristina","Danae","Marjory","Elijah","Wilber","Mary","Yen","Stan","Sima","Wendell","Porfirio","Efrain","Carly","Kazuko","King","Homer","Enid","Kum","Royal","Mika","Collette","Louis","Raye","Rhoda","Sal","Marquis","Hershel","Alisa","Wade"];
	return names[Math.floor(Math.random() * names.length)];
}

