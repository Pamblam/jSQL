// Load jSQLEverywhere which will load jSQL Server
jSQLe.load({
	role: "client",
	server: "server.html"
});

// Once jSQL is loaded, we can use it
jSQL.load(function(){
	var FileName = window.location.pathname.split("/").pop();
	var now = new Date();

	// create a table on the serverif it does not exist
	jSQL.query("CREATE TABLE IF NOT EXISTS `ServerTest` (`FileName` VARCHAR, `Date` DATE)").execute();

	// insert the current time and file name
	jSQL.query("INSERT INTO `ServerTest` VALUES (?, ?)").execute([FileName, now]);
	jSQL.commit();
	drawTable();
	
	$("#cleartable").click(function(e){
		e.preventDefault();
		jSQL.query("DELETE FROM `ServerTest`").execute();
		jSQL.commit();
		drawTable();
		return false;
	});
});

function drawTable(){
	var ServerCount = document.getElementById("ServerCount");
	setInterval(function(){
		var data = jSQL.query("SELECT * FROM `ServerTest` ORDER BY `Date` DESC").execute().fetchAll("ASSOC");
		var html = ["<table class='table table-striped'><thead><tr><th>#</th><th>File</th><th>Time</th></tr></thead><tbody>"];
		for(var i=0; i<data.length; i++){
			// console.log(data[i]);
			html.push("<tr><td>"+i+"</td><td>"+data[i].FileName+"</td><td>"+data[i].Date.toString()+"</td></tr>");
		}
		ServerCount.innerHTML = html.join("")+"</tbody></table>";
	},1500);
}
