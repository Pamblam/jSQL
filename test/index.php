<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <title>jSQL test</title>
    </head>
    <body>
		<script src="../jSQL.js"></script>
		<script>
			
			echo("<h1>Loading</h1>");

			var xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function() {
				if (xhttp.readyState == 4 && xhttp.status == 200) {
					var data = JSON.parse(xhttp.responseText);
					var t = jSQL.createTable("myTable", data);
					
					clear();
					echo("<h2>Dataset</h2>");
					echo(t.data.length+" total rows<br>");
					
					var query = jSQL.
									select(['SPONSORID', 'SIC', 'CRRT']).
									from('myTable').
									where("SIC").equals("8093-T").
									and("CRRT").equals("All");
							
					var results = query.fetch();
					
					echo("<h3>"+results.length+" rows <i>WHERE `SIC` = '8093-T' AND `CRRT` = 'All'</i></h3>");
					var tbl = makeTable(results); console.log(tbl);
					echo(tbl);
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
