// ==UserScript==
// @name        jSQLMyAdmin
// @namespace   pamblam.com
// @description A debugging tool for jSQL. Adds a button to the top of any webpage with jSQL which overlays a tool similar to mySQL's phpMyAdmin.
// @include     *
// @version     1.6
// @grant       none
// ==/UserScript==
void(function () {
	var jSQLMyAdminVersion = 1.6;
	
	/**
	 * Turn this userscript into a browser button..
	 *  - Change the isBtn variable below to true
	 *  - Minify entire userscript: https://javascript-minifier.com/
	 *  - URL encode the minified userscript: http://meyerweb.com/eric/tools/dencoder/
	 *  - Make HTML page with link like this
	 *		<a href="javascript:(minified, urlencoded userscript here)">jSQLMyAdmin</a>
	 *  - Open HTML page in browser, drag link to bookmarks toolbar
	 */
	var isBtn = false;
	
	var cm;
	var drawnTables = [];
	var resources = [];
	var minJSQLVersion = 2.7;
	
	if (typeof window.jSQL === 'undefined'){
		resources.push({
			// jSQL edge
			js: ['//gitcdn.xyz/repo/Pamblam/jSQL/master/jSQL.min.js'],
			css: []
		});
	}
	if(typeof jQuery === 'undefined') resources.push({
		js: ['//code.jquery.com/jquery-2.2.4.js'],
		css: []
	});
	if(typeof jQuery === 'undefined' || !jQuery.ui) resources.push({
		js: ['//code.jquery.com/ui/1.12.0/jquery-ui.min.js'],
		css: ['//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css'],
	});
	if(typeof jQuery === 'undefined' || !$.fn.dataTableExt) resources.push({
		js: ['//cdn.datatables.net/1.10.13/js/jquery.dataTables.min.js',
			'//cdn.datatables.net/1.10.13/js/dataTables.jqueryui.min.js'],
		css: ['//cdn.datatables.net/1.10.13/css/dataTables.jqueryui.min.css'],
	});
	if(typeof CodeMirror === "undefined") resources.push({
		js: ['//cdnjs.cloudflare.com/ajax/libs/codemirror/5.22.0/codemirror.js',
			'//cdnjs.cloudflare.com/ajax/libs/codemirror/5.22.0/mode/sql/sql.js',
			'//cdnjs.cloudflare.com/ajax/libs/codemirror/5.22.0/addon/hint/show-hint.js',
			'//cdnjs.cloudflare.com/ajax/libs/codemirror/5.22.0/addon/hint/sql-hint.js'],
		css: ['//cdnjs.cloudflare.com/ajax/libs/codemirror/5.22.0/codemirror.css',
			'//cdnjs.cloudflare.com/ajax/libs/codemirror/5.22.0/addon/hint/show-hint.css'],
	});
	
	showjSQLLoader();
	loadresources(resources).then(function(){
		if("undefined" === typeof jSQL.version || jSQL.version < minJSQLVersion){
			var current_version = "undefined" === typeof jSQL.version ? "<1" : jSQL.version;
			if(!confirm("jSQLMyAdmin requires jSQL version >= "+minJSQLVersion+". This page includes jSQL version "+current_version+". Some features will not work. Do you want to open jSQLMyAdmin anyway?"))
				return;
		}
		closejSQL();
		if(isBtn) openjSQL();
	});
	
	function showjSQLLoader(){
		document.getElementsByTagName('body')[0]
			.insertAdjacentHTML('beforeend','<span id=\'jSQLLoadingFlag\' style=\'position:fixed; top:5px; right:5px; z-index:2147483647; opacity:0.7;\'>Loading jSQLMyAdmin...</span>');
	}
	function drawjSQLMyAdmin() {
		jSQL.load(function () {
			// does the saved queries table exist?
			if(undefined === jSQL.tables['Saved Queries']){
				jSQL.query("CREATE TABLE `Saved Queries` (`Name` VARCHAR(20), `Query` LONGTEXT)").execute();
				jSQL.insertInto("Saved Queries").values({Name:"Create", Query: "-- A Create Query Template\nCREATE TABLE IF NOT EXISTS `myTable` \n(\t`String` VARCHAR(20),\n\t`Number` INT\n)"}).execute();
				jSQL.insertInto("Saved Queries").values({Name:"Select", Query: "-- A Select Query Template\nSELECT\n\t*\nFROM\n\t`myTable`\nWHERE\n\t`Number` > 2"}).execute();
				jSQL.insertInto("Saved Queries").values({Name:"Update", Query: "-- An Update Query Template\nUPDATE `myTable`\nSET\n\t`String` = 'Big Number'\nWHERE\n\t`Number` > 2"}).execute();
				jSQL.insertInto("Saved Queries").values({Name:"Insert", Query: "-- An Insert Query Template\nINSERT INTO `myTable`\n\t(`String`, `Number`)\nVALUES\n\t('Some Number', 7)"}).execute();
				jSQL.insertInto("Saved Queries").values({Name:"Drop", Query: "-- A Drop Query Template\nDROP TABLE `myTable`"}).execute();
			}
			var queries = jSQL.query("SELECT * FROM `Saved Queries`").execute().fetchAll("ASSOC");
			var selectMenu = "<select id='queryTypeSelect'><option>Choose...</option>";
			for(var i=queries.length; i--;) selectMenu += "<option value='"+queries[i].Name+"'>"+queries[i].Name+"</option>";
			selectMenu += "</select>";
			var $overlay = $('#jsOverlayContainer').empty();
			$overlay.html('<h5>jSQL Version: ' + jSQL.version + ' | jSQLMyAdmin Version: ' + jSQLMyAdminVersion + '</h5>');
			$overlay.append('<div id="jSQLTableTabs"><ul><li><a href="#jSQLResultsTab">Query</a></li></ul><div id="jSQLResultsTab"><div><div style="float:right;"><small><b>autocomplete</b>: <i>ctrl+space</i></small></div><div style="float:left"><b>Template: </b>'+selectMenu+'</div><div style="clear:both;"></div></div><textarea id="jSQLMyAdminQueryBox"></textarea><div style="text-align:right;"><button id="jSQLExecuteQueryButton">Run Query</button><button id="jSQLMinifyQueryButton">Minify</button><button id="jSQLSaveQueryButton">Save</button><button id="jSQLResetButton">Reset</button><button id="jSQLCommitButton">Commit</button></div><div id="jSQLMAQueryResults"><center><b>No results to show</b><br>Enter a query</center></div></div></div>');
			$("#queryTypeSelect").change(function(){
				var Name = $(this).val();
				if(undefined === Name || Name === "" || Name === null || Name === false) return;
				var query = jSQL.query("SELECT `Query` FROM `Saved Queries` WHERE `Name` = ?")
					.execute([Name]).fetch("ASSOC").Query;
				cm.getDoc().setValue(query);
				$(this).val($(this).find("option:first").val());
			});
			$('#jSQLTableTabs').tabs({
				beforeActivate: function(event, ui) {
					var tableName = $(ui.newPanel).data("tn");
					if(tableName === undefined) return;
					$(ui.newPanel).html("Loading...");
				}, 
				activate: function(event, ui){
					setTimeout(function(){
						var tableName = $(ui.newPanel).data("tn");
						if(tableName === undefined) return;
						var data = jSQL.select('*').from(tableName).execute().fetchAll('array');
						var tableHTML = '<div style="overflow-x:auto; width:100%; margin:0; padding:0;"><table></table></div>';
						$(ui.newPanel).html(tableHTML);
						var cols = [];
						for(var i=0; i<jSQL.tables[tableName].columns.length; i++) 
							cols.push({title: jSQL.tables[tableName].columns[i]});
						$(ui.newPanel).find('table').DataTable({
							data: data,
							columns: cols
						});
					}, 500);
				}
			});
			$('#queryTypeSelect').css({"line-height": "0.9"});
			$("#jSQLExecuteQueryButton").button({icons: { primary: "ui-icon-caret-1-e"}});
			$('#jSQLExecuteQueryButton').css({"line-height": "0.9"});
			$("#jSQLExecuteQueryButton").click(runjSQLQuery);
			$("#jSQLMinifyQueryButton").button({icons: { primary: "ui-icon-minusthick"}});
			$('#jSQLMinifyQueryButton').css({"line-height": "0.9"});
			$("#jSQLMinifyQueryButton").click(minifyjSQLQuery);
			$("#jSQLResetButton").button({icons: { primary: "ui-icon-refresh"}});
			$('#jSQLResetButton').css({"line-height": "0.9"});
			$("#jSQLResetButton").click(function(){
				if(!confirm("Do you want to delete all tables?")) return;
				jSQL.reset();
				jSQL.query("CREATE TABLE `Saved Queries` (`Name` VARCHAR(20), `Query` LONGTEXT)").execute();
				jSQL.insertInto("Saved Queries").values({Name:"Create", Query: "-- A Create Query Template\nCREATE TABLE IF NOT EXISTS `myTable` \n(\t`String` VARCHAR(20),\n\t`Number` INT\n)"}).execute();
				jSQL.insertInto("Saved Queries").values({Name:"Select", Query: "-- A Select Query Template\nSELECT\n\t*\nFROM\n\t`myTable`\nWHERE\n\t`Number` > 2"}).execute();
				jSQL.insertInto("Saved Queries").values({Name:"Update", Query: "-- An Update Query Template\nUPDATE `myTable`\nSET\n\t`String` = 'Big Number'\nWHERE\n\t`Number` > 2"}).execute();
				jSQL.insertInto("Saved Queries").values({Name:"Insert", Query: "-- An Insert Query Template\nINSERT INTO `myTable`\n\t(`String`, `Number`)\nVALUES\n\t('Some Number', 7)"}).execute();
				jSQL.insertInto("Saved Queries").values({Name:"Drop", Query: "-- A Drop Query Template\nDROP TABLE `myTable`"}).execute();
				closejSQL();
				openjSQL();
			});
			$("#jSQLSaveQueryButton").button({icons: { primary: "ui-icon-star"}});
			$('#jSQLSaveQueryButton').css({"line-height": "0.9"});
			$("#jSQLSaveQueryButton").click(function(){
				var name = prompt("Enter a name for this Template:");
				if(!name) return;
				var query = cm.getValue();
				jSQL.query("INSERT INTO `Saved Queries` (`Name`, `Query`) VALUES (?, ?)")
					.execute([name, query]);
				$("#queryTypeSelect").append("<option value='"+name+"'>"+name+"</option>");
			});
			$("#jSQLCommitButton").button({icons: { primary: "ui-icon-check"}});
			$('#jSQLCommitButton').css({"line-height": "0.9"});
			$("#jSQLCommitButton").click(function(){
				jSQL.commit();
				$("#jSQLCommitButton").button("option", "label", "Committed!");
				setTimeout(function(){
					$("#jSQLCommitButton").button("option", "label", "Commit");
				},2000);
			});
			addAllTables();
			$("head").append("<style>.CodeMirror-hints, .CodeMirror-hint, .CodeMirror-hint-active { z-index:2147483647 !important;}</style>");
			var tbls = {}; 
			for (var table in jSQL.tables) tbls[table] = jSQL.tables[table].columns;
			cm = CodeMirror.fromTextArea($("#jSQLMyAdminQueryBox")[0], {
				lineNumbers: true,
				mode: "text/x-mysql",
				indentWithTabs: true,
				smartIndent: true,
				matchBrackets : true,
				autofocus: true,
				extraKeys: {"Ctrl-Space": "autocomplete"},
				hint: CodeMirror.hint.sql,
				hintOptions: {tables: tbls}
			});
			$('#jSQLTableTabs').find(".CodeMirror").css({
				border: "1px solid #eee",
				height: "auto"
			});
		});
	}
	function minifyjSQLQuery(){
		var sql = cm.getValue();
		cm.getDoc().setValue(jSQL.minify(sql));
	}
	function runjSQLQuery(){
		var sql = cm.getValue();
		try{
			var query = jSQL.query(sql).execute();
			var data = [];
			if(query!==undefined){
				data = query.fetchAll("assoc");
				if(query.type === "DROP"){
					closejSQL();
					openjSQL();
					cm.getDoc().setValue(sql);
				}
			}
			var tableHTML = data.length ? '<br><div><small><b>Results</b></small></div><div style="overflow-x:auto; width:100%; margin:0; padding:0;">'+makeTableHTML(data)+'</div>' : '<center><b>No results to show</b><br>Enter a query</center>';
			addAllTables();
			$("#jSQLMAQueryResults").html(tableHTML);
			$('#jSQLMAQueryResults').find('table').DataTable({"order": []});
		}catch(e){
			var msg = e.message ? e.message+"" : e+"";
			alert(msg);
			throw e;
		}
	}
	function addTableTab(tableName){
		if(drawnTables.indexOf(tableName)>-1) return;
		var $ul = $('#jSQLTableTabs').find('ul').eq(0);
		var id = 'jSQLResultsTab-' + $ul.find('li').length;
		$ul.append('<li><a href="#' + id + '">' + tableName + '</a></li>');
		$ul.after('<div id="' + id + '">Loading...</div>');
		$("#"+id).data("tn", tableName);
		$('#jSQLTableTabs').tabs("refresh");
		drawnTables.push(tableName);
	}
	function addAllTables() {
		for (var table in jSQL.tables) {
			if("Saved Queries" === table) continue;
			addTableTab(table);
		}
	}
	function makeTableHTML(data, drawData) {
		if(undefined === drawData) drawData = true;
		var html = [];
		html.push('<table><thead><tr>');
		for (var name in data[0])
			html.push('<th>' + name + '</th>');
		html.push('</tr></thead><tbody>');
		for (var i = 0; i < data.length; i++) {
			if(!drawData) break;
			html.push('<tr>');
			for (var name in data[i]) {
				var type = typeof data[i][name];
				var val = type !== "string" && type !== "number" ? "[" + type + "]" : data[i][name];
				if (val.length > 50)
					val = val.substring(0, 47) + "...";
				html.push('<td>' + val + '</td>');
			}
			html.push('</tr>');
		}
		html.push('</tbody></table>');
		return html.join('');
	}
	function togglejSQLMyAdmin(){
		return $("#jSQLMyAdminOverlay").length>0 ? closejSQL() : openjSQL();
	}
	function openjSQL() {
		$('body').append('<div id=\'jSQLMyAdminOverlay\' style=\'position:fixed; top:0; left:0; height:100%; width:100%; overflow-y:auto; z-index: 2147483646; background: rgba(255,255,255,0.99)\'><div id="jsOverlayContainer" style="padding:5px; margin:0;"><br><br><center><h3>Loading jSQLMyAdmin...</h3></center></div></div>');
		$('#openjSQLMyAdmin').remove();
		$('body').append('<button id=\'closejSQLMyAdmin\' style=\'position:fixed; top:5px; right:5px; z-index:2147483647; opacity:0.7;\'>Close jSQLMyAdmin</button>');
		$('#closejSQLMyAdmin').button({icons: { primary: "ui-icon-closethick"}});
		$('#closejSQLMyAdmin').css({"line-height": "0.9"});
		$('#closejSQLMyAdmin').click(togglejSQLMyAdmin);
		drawjSQLMyAdmin();
	}
	function closejSQL() {
		cm = null; drawnTables = [];
		$("#jSQLLoadingFlag").remove();
		$('#jSQLMyAdminOverlay').remove();
		$('#closejSQLMyAdmin').remove();
		if(isBtn) return;
		$('body').append('<button id=\'openjSQLMyAdmin\' style=\'position:fixed; top:5px; right:5px; z-index:2147483647; opacity:0.7;\'>Open jSQLMyAdmin</button>');
		$('#openjSQLMyAdmin').button({icons: { primary: "ui-icon-newwin"}});
		$('#openjSQLMyAdmin').css({"line-height": "0.9"});
		$('#openjSQLMyAdmin').click(togglejSQLMyAdmin);
	}
	function loadresources(resources) {
		return new Promise(function (callback) {
			(function recurse() {
				if (!resources.length) {
					callback();
					return;
				}
				var resource = resources.shift();
				for(var i=resource.css.length; i--;)
					document.getElementsByTagName('head')[0].insertAdjacentHTML('beforeend', '<link rel=\'stylesheet\' href=\''+resource.css[i]+'\'>');
				(function innerRecurse() {
					if (!resource.js.length) {
						recurse();
						return;
					}
					var src = resource.js.shift();
					var script = document.createElement('script');
					script.type = 'text/javascript';
					if (script.readyState) { //IE
						script.onreadystatechange = function () {
							if (script.readyState == 'loaded' || script.readyState == 'complete') {
								script.onreadystatechange = null;
								setTimeout(innerRecurse, 1000);
							}
						};
					} else { //Others
						script.onload = function () {
							setTimeout(innerRecurse, 1000);
						};
					}
					script.src = src;
					document.getElementsByTagName('head')[0].appendChild(script);
				})();
			})();
		});
	}
	return false;
}());
