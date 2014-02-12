var SPEED = 200;
var DELAY = 500;
var CELLS = 18;

$(function() {
	console.log("Connecting to server");
	var iosocket = io.connect();

	iosocket.on("connect", function () {
		console.log("Connected to server!");
		iosocket.on("disconnect", function() {
			$("#incomingChatMessages").append("<li>Disconnected</li>");
		});
		iosocket.on('state.init', function(gameState) {
			//$("#" + id).fadeToggle(SPEED, "swing").replaceWith("<div class='grid_item_blank'></div>");
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
				//$(this).toggle("clip", { direction: "horizontal" }, SPEED).toggle("clip", { direction: "horizontal" }, SPEED);
				//$(this).toggle("fade", { }, SPEED).toggle("fade", { }, SPEED);
				$(this).fadeToggle(SPEED, "swing", function (){
					$(this).find(".grid_item_q").toggle();
					$(this).find(".grid_item_w").toggle();
					$(this).fadeToggle(SPEED, "swing").delay(DELAY).fadeToggle(SPEED, "swing", function (){
						$(this).replaceWith("<div class='grid_item_blank'></div>");
						iosocket.emit("state.update", $(this).attr("id"));
					});
				});
			});
		});
		console.log("Requesting gameState");
		iosocket.emit("state.init", "clientUniqueId");
	});
	
	/*
	for(var i = 0 ; i < CELLS ; i++) {
		$(".grid").append("<div id='" + i + "' class='grid_item'><img class='grid_item_q' src='q.png'/><img class='grid_item_w' src='w.png' style='display: none;'/></div>");
	}
	
	$(".grid").append("<div class='grid_clear'></div>");
	
	$(".grid_item").click(function (){
		//$(this).toggle("clip", { direction: "horizontal" }, SPEED).toggle("clip", { direction: "horizontal" }, SPEED);
		//$(this).toggle("fade", { }, SPEED).toggle("fade", { }, SPEED);
		$(this).fadeToggle(SPEED, "swing", function (){
			$(this).find(".grid_item_q").toggle();
			$(this).find(".grid_item_w").toggle();
			$(this).fadeToggle(SPEED, "swing").delay(DELAY).fadeToggle(SPEED, "swing", function (){
				$(this).replaceWith("<div class='grid_item_blank'></div>");
				iosocket.emit("state.update", $(this).attr("id"));
			});
		});
	});
	*/
});