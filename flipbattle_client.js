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
		iosocket.on('item.delete', function(id) {
			$("#" + id).fadeToggle(SPEED, "swing").replaceWith("<div class='grid_item_blank'></div>");
		});
	});
	
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
				iosocket.emit("item.delete", $(this).attr("id"));
			});
		});
	});
	
});