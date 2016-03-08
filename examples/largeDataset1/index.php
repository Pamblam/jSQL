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
					jSQL.createTable("myTable", data);
					
					clear();
					echo("<h1>Example 1</h1><p>Created `myTable` from JSON via AJAX</p>");
					echo("<p>There are "+jSQL.tables.myTable.data.length+" total rows in `myTable`</p>");
					
					//var query = jSQL.select(['SPONSORID', 'SIC', 'CRRT']).from('myTable').where('SIC').equals('8093-T').and('CRRT').equals('All').limit(50);
					var query = jSQL.query("SELECT `SPONSORID`, `SIC`, `CRRT` FROM `myTable` WHERE `SIC` = '8093-T' AND `CRRT` = 'All' LIMIT 50");
					
					var results = query.fetch();
					
					echo("<p><code>var query = jSQL.query(\"SELECT `SPONSORID`, `SIC`, `CRRT` FROM `myTable` WHERE `SIC` = '8093-T' AND `CRRT` = 'All' LIMIT 50\");</code><hr>");
					echo("<code>var query = jSQL.select(['SPONSORID', 'SIC', 'CRRT']).from('myTable').where('SIC').equals('8093-T').and('CRRT').equals('All').limit(50);</code></p>");
					echo("<p><b>"+results.length+" rows</b></p>");
					echo(makeTable(results));
				}
			};
			xhttp.open("GET", "testdata.json", true);
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
