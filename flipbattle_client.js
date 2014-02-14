var DURATION = 200;
var DELAY = 500;
var CELLS = 18;

var iosocket;
var selectedItems = [ -1, -1 ];

$(function() {
	initConnections();
});

function initConnections() {
	console.log("Connecting to server");
	iosocket = io.connect();

	iosocket.on("connect", function () {
		console.log("Connected to server!");
		iosocket.on("disconnect", function() {
			$("#incomingChatMessages").append("<li>Disconnected</li>");
		});
		iosocket.on('state.init', function(gameState) {
			initGameGrid(gameState);
		});
		iosocket.on('state.update', function(updateState) {
			updateGameGrid(updateState);
		});
		iosocket.on('players.update', function(clients) {
			updatePlayers(clients);
		});
		console.log("Requesting gameState");
		iosocket.emit("state.init", "clientUniqueId");
	});
}

function initGameGrid(gameState) {
	$("#grid").empty();
	
	for(var i = 0 ; i < gameState.length ; i++) {
		if(gameState[i].state == 'active') {
			var id = gameState[i].id;
			var html = "<div id='" + id + "' class='grid_item'>";
			html += "<img class='grid_item_q' src='u.png'/>";
			html += "<img class='grid_item_w' src='" + id + ".img' style='display: none;'/>";
			html += "</div>";
			$("#grid").append(html);
		}
		else if(gameState[i].state == 'flipped') {
			$("#grid").append("<div class='grid_item_blank'></div>");
		}
	}
	
	$("#grid").append("<div class='grid_clear'></div>");
	
	$(".grid_item").click(function (){
		itemClick(this);
	});
}

function itemClick(item){
	if(!$(item).attr("data-is-flipped") || $(item).attr("data-is-flipped") == "false") {
		var i = selectedItems[0] >= 0 ? 1 : 0;
		var id =  $(item).attr("id");
		if(i == 1 && id == selectedItems[0])
			return;
		selectedItems[i] = id;

		var copy = selectedItems.slice(0);
		if(i == 1){
			selectedItems = [ -1, -1 ];
		}

		$(item).attr("data-is-flipped", true);
		$(item).fadeToggle(DURATION, "swing", function (){
			$(this).find(".grid_item_q").toggle();
			$(this).find(".grid_item_w").toggle();		
			$(this).fadeToggle(DURATION, "swing", function (){
				if(i == 1){
					iosocket.emit("state.update", copy);
				}
			});
		});	
	}
}

function updateGameGrid(updateState){
	if(updateState.action == "delete") {
		$("#" + updateState.items[0]).toggle("puff", null, DURATION, function (){
			$(this).replaceWith("<div class='grid_item_blank'></div>");	
		});	
		$("#" + updateState.items[1]).toggle("puff", null, DURATION, function (){
			$(this).replaceWith("<div class='grid_item_blank'></div>");	
		});
		//$("#" + updateState.items[0]).fadeToggle(DURATION, "swing").replaceWith("<div class='grid_item_blank'></div>");
		//$("#" + updateState.items[1]).fadeToggle(DURATION, "swing").replaceWith("<div class='grid_item_blank'></div>");
	}
	else if(updateState.action == "revert") {
		$("#" + updateState.items[0]).fadeToggle(DURATION, "swing", function (){
			$(this).find(".grid_item_q").toggle();
			$(this).find(".grid_item_w").toggle();		
			$(this).fadeToggle(DURATION, "swing", function (){
				$(this).attr("data-is-flipped", false);
			});
		});	
		$("#" + updateState.items[1]).fadeToggle(DURATION, "swing", function (){
			$(this).find(".grid_item_q").toggle();
			$(this).find(".grid_item_w").toggle();		
			$(this).fadeToggle(DURATION, "swing", function (){
				$(this).attr("data-is-flipped", false);
			});
		});	
	}
}

function updatePlayers(clients) {
	$("#clients").empty();
	
	for(var i = 0 ; i < clients.length ; i++) {
		$("#clients").append("<li>" + clients[i] + "</li>");
	}
}