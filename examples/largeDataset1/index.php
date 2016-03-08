<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <title>jSQL test</title>
    </head>
    <body>
		<script src="../../jSQL.js"></script>
		<script>
			
			echo("<h1>Loading</h1>");

			var xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function() {
				if (xhttp.readyState == 4 && xhttp.status == 200) {
					var data = JSON.parse(xhttp.responseText);
					jSQL.createTable("zips", data);
					
					clear();
					echo("<h1>Example 1</h1><p>Created `zips` from JSON via AJAX</p>");
					echo("<p>There are "+jSQL.tables.zips.data.length+" total rows in `zips`</p>");
					
					//var query = jSQL.select('*').from('zips').where('TERR').equals('FL03').orderBy(['CITY', 'ZIP']).desc().limit(25);
					var query = jSQL.query("SELECT * FROM `zips` WHERE `TERR` = 'FL03' ORDER BY city, zip DESC LIMIT 25");
					
					query.execute();
					
					var results = query.fetchAll();
					echo("<p><code>var query = jSQL.query(\"SELECT * FROM `zips` WHERE `TERR` = 'FL03' ORDER BY city, zip DESC LIMIT 25\");</code><hr>");
					echo("<code>var query = jSQL.select('*').from('zips').where('TERR').equals('FL03').orderBy(['CITY', 'ZIP']).desc().limit(25);</code></p>");
					echo("<p><b>"+results.length+" rows</b></p>");
					echo(makeTable(results));
				}
			};
			xhttp.open("GET", "zips.data.json", true);
			xhttp.send();

			// Some helper functions
			function echo(text){
				document.getElementsByTagName('body')[0].insertAdjacentHTML('beforeend', text);
			}
			
			function clear(){
				document.getElementsByTagName('body')[0].innerHTML = "";
			}
			
			function makeTable(res){
				var html = ["<table><thead><tr>"];
				if('undefined' == typeof res[0]) throw "No table data..";
				for(var name in res[0]){
					if(res[0].hasOwnProperty(name)){
						html.push("<th>"+name+"</th>");
					}
				}
				html.push("</tr></thead><tbody>");
				for(var i=0; i<res.length; i++){
					html.push("<tr>");
					for(var name in res[i]){
						if(res[0].hasOwnProperty(name)){
							html.push("<td>"+res[i][name]+"</td>");
						}
					}
					html.push("</tr>");
				}
				html.push("</tbody></table>");
				return html.join('');
			}
	
		</script>
    </body>
</html>
