var SPEED = 200;
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
			//$("#" + id).fadeToggle(SPEED, "swing").replaceWith("<div class='grid_item_blank'></div>");
			initGameGrid(gameState);
		});
		iosocket.on('state.update', function(updateState) {
			//$("#" + id).fadeToggle(SPEED, "swing").replaceWith("<div class='grid_item_blank'></div>");
			updateGameGrid(updateState);
		});
		console.log("Requesting gameState");
		iosocket.emit("state.init", "clientUniqueId");
	});
}

function initGameGrid(gameState) {
	$(".grid").empty();
	
	for(var i = 0 ; i < gameState.length ; i++) {
		var id = gameState[i].id;
		var html = "<div id='" + id + "' class='grid_item'>";
		html += "<img class='grid_item_q' src='q.png'/>";
		html += "<img class='grid_item_w' src='" + id + ".img' style='display: none;'/>";
		html += "</div>";
		$(".grid").append(html);
	}
	
	$(".grid").append("<div class='grid_clear'></div>");
	
	$(".grid_item").click(function (){
		itemClick(this);
	});
}

function itemClick(item){
	var i = selectedItems[0] >= 0 ? 1 : 0;
	selectedItems[i] = $(item).attr("id");
	$(item).fadeToggle(SPEED, "swing", function (){
		$(item).find(".grid_item_q").toggle();
		$(item).find(".grid_item_w").toggle();		
		$(item).fadeToggle(SPEED, "swing", function (){
			if(i == 1){
				iosocket.emit("state.update", selectedItems);
				selectedItems = [ -1, -1 ];
			}
		});
	});	
	
}

function updateGameGrid(updateState){
	if(updateState.action == "delete") {
		$("#" + updateState.items[0]).fadeToggle(SPEED, "swing").replaceWith("<div class='grid_item_blank'></div>");
		$("#" + updateState.items[1]).fadeToggle(SPEED, "swing").replaceWith("<div class='grid_item_blank'></div>");
	}
	else if(updateState.action == "revert") {
		$("#" + updateState.items[0]).fadeToggle(SPEED, "swing", function (){
			$(this).find(".grid_item_q").toggle();
			$(this).find(".grid_item_w").toggle();		
			$(this).fadeToggle(SPEED, "swing");
		});	
		$("#" + updateState.items[1]).fadeToggle(SPEED, "swing", function (){
			$(this).find(".grid_item_q").toggle();
			$(this).find(".grid_item_w").toggle();		
			$(this).fadeToggle(SPEED, "swing");
		});	
	}
}