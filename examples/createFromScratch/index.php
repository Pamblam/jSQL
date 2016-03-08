<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <title>jSQL test</title>
    </head>
    <body>
		<script src="../../jSQL.js"></script>
		<script>
			
			echo("<h1>Building table from scratch</h1>");
			
			jSQL.createTable("myTable", ["Name", "Age", "Favorite Color"]);
			echo("<p>Created 'myTable'</p>");
			
			var names = ["bill", "bob", "ted", "ned", "steve", "bill", "jill"];
			var ages = [1, 2, 3, 4, 5, 6, 7];
			var colors = ["green", "blue", "red", "orange", "yellow", "turquoise", "tan"];
			for(var i=0;  i<7; i++) 
				jSQL.insertInto("myTable").values([names[i], ages[i], colors[i]]);
			echo("<p>Inserted 7 rows</p>");
			echo('<p><code>jSQL.select("*").from("myTable").limit(3);</code></p>');
			
			var query = jSQL.select("*").from("myTable").limit(3);
			var results = query.fetch();
			
			echo("<p>"+results.length+" rows returned.</p>");
			echo(makeTable(results));
			
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
