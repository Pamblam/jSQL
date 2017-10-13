// ==UserScript==
// @name        jSQLMyAdmin
// @namespace   pamblam.com
// @description A debugging tool for jSQL. Adds a button to the top of any webpage with jSQL which overlays a tool similar to mySQL's phpMyAdmin.
// @include     *
// @version     1.6
// @grant       none
// ==/UserScript==
void(function(){
	const jSQLMyAdminVersion = 1.6;

	/**
	 * Turn this userscript into a browser button..
	 *  - Change the isBtn variable below to true
	 *  - Minify entire userscript: https://javascript-minifier.com/
	 *  - URL encode the minified userscript: http://meyerweb.com/eric/tools/dencoder/
	 *  - Make HTML page with link like this
	 *		<a href="javascript:(minified, urlencoded userscript here)">jSQLMyAdmin</a>
	 *  - Open HTML page in browser, drag link to bookmarks toolbar
	 */
	let isBtn = false;

	let cm;
	let drawnTables = [];
	let resources = [];
	const minJSQLVersion = 2.7;

	if (typeof window.jSQL === 'undefined'){
		resources.push({
			js: ['https://pamblam.github.io/jSQL/scripts/jSQL.min.js'],
			css: []
		});
	}
	if(typeof jQuery === 'undefined') resources.push({
		js: ['https://code.jquery.com/jquery-2.2.4.js'],
		css: []
	});
	if(typeof jQuery === 'undefined' || !jQuery.ui) resources.push({
		js: ['https://code.jquery.com/ui/1.12.0/jquery-ui.min.js'],
		css: ['https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css'],
	});
	if(typeof jQuery === 'undefined' || !$.fn.dataTableExt) resources.push({
		js: ['https://cdn.datatables.net/1.10.13/js/jquery.dataTables.min.js',
			'https://cdn.datatables.net/1.10.13/js/dataTables.jqueryui.min.js'],
		css: ['https://cdn.datatables.net/1.10.13/css/dataTables.jqueryui.min.css'],
	});
	if(typeof CodeMirror === "undefined") resources.push({
		js: ['https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.22.0/codemirror.js',
			'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.22.0/mode/sql/sql.js',
			'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.22.0/addon/hint/show-hint.js',
			'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.22.0/addon/hint/sql-hint.js'],
		css: ['https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.22.0/codemirror.css',
			'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.22.0/addon/hint/show-hint.css'],
	});

	showjSQLLoader();
	loadresources(resources).then(()=>{
		if("undefined" === typeof jSQL.version || jSQL.version < minJSQLVersion){
			let current_version = "undefined" === typeof jSQL.version ? "<1" : jSQL.version;
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
		jSQL.load(()=>{
			// does the saved queries table exist?
			if(undefined === jSQL.tables['Saved Queries']){
				jSQL.query("CREATE TABLE `Saved Queries` (`Name` VARCHAR(20), `Query` LONGTEXT)").execute();
				jSQL.insertInto("Saved Queries").values({Name:"Create", Query: "-- A Create Query Template\nCREATE TABLE IF NOT EXISTS `myTable` \n(\t`String` VARCHAR(20),\n\t`Number` INT\n)"}).execute();
				jSQL.insertInto("Saved Queries").values({Name:"Select", Query: "-- A Select Query Template\nSELECT\n\t*\nFROM\n\t`myTable`\nWHERE\n\t`Number` > 2"}).execute();
				jSQL.insertInto("Saved Queries").values({Name:"Update", Query: "-- An Update Query Template\nUPDATE `myTable`\nSET\n\t`String` = 'Big Number'\nWHERE\n\t`Number` > 2"}).execute();
				jSQL.insertInto("Saved Queries").values({Name:"Insert", Query: "-- An Insert Query Template\nINSERT INTO `myTable`\n\t(`String`, `Number`)\nVALUES\n\t('Some Number', 7)"}).execute();
				jSQL.insertInto("Saved Queries").values({Name:"Drop", Query: "-- A Drop Query Template\nDROP TABLE `myTable`"}).execute();
			}
			let queries = jSQL.query("SELECT * FROM `Saved Queries`").execute().fetchAll("ASSOC");
			let selectMenu = "<select id='queryTypeSelect'><option>Choose...</option>";
			for(let i=queries.length; i--;) selectMenu += "<option value='"+queries[i].Name+"'>"+queries[i].Name+"</option>";
			selectMenu += "</select>";
			let $overlay = $('#jsOverlayContainer').empty();
			$overlay.html('<h5>jSQL Version: ' + jSQL.version + ' | jSQLMyAdmin Version: ' + jSQLMyAdminVersion + '</h5>');
			$overlay.append(`<div id="jSQLTableTabs">
                                 <ul>
                                     <li><a href="#jSQLNewTableTab">New Table</a></li>
                                     <li><a href="#jSQLResultsTab">Query</a></li>
                                 </ul>
                                 <div id="jSQLNewTableTab">
                                     <input type='text' id='tableName' placeholder='Table Name' />
                                     <table>
                                         <thead>
                                             <tr>
                                                 <th>-Name-</th>
                                                 <th>-Type-</th>
                                                 <th>-AI-</th>
                                                 <th>-PK-</th>
                                                 <th>-UN-</th>
                                             </tr>
                                         </thead>
                                         <tbody>
                                             <tr>
                                                 <td><input type=text class=colname-jma placeholder="Column Name" /></td>
                                                 <td>
                                                     <select>
                                                         <option>NUMERIC</option>
                                                         <option>TINYINT</option>
                                                         <option>SMALLINT</option>
                                                         <option>MEDIUMINT</option>
                                                         <option>INT</option>
                                                         <option>BIGINT</option>
                                                     </select>
                                                 </td>
                                                 <td><input type=checkbox class=col-ai-jma /></td>
                                                 <td><input type=checkbox class=col-pk-jma /></td>
                                                 <td><input type=checkbox class=col-un-jma /></td>
                                             </tr>
                                         </tbody>
                                     </table>
                                 </div>
                                 <div id="jSQLResultsTab">
                                     <div>
                                         <div style="float:right;"><small><b>autocomplete</b>: <i>ctrl+space</i></small></div>
                                         <div style="float:left"><b>Template: </b>${selectMenu}</div>
                                         <div style="clear:both;"></div>
                                     </div>
                                     <textarea id="jSQLMyAdminQueryBox"></textarea>
                                     <div style="text-align:right;">
                                         <button id="jSQLExecuteQueryButton">Run Query</button>
                                         <button id="jSQLMinifyQueryButton">Minify</button>
                                         <button id="jSQLSaveQueryButton">Save</button>
                                         <button id="jSQLResetButton">Reset</button>
                                         <button id="jSQLCommitButton">Commit</button>
                                     </div>
                                     <div id="jSQLMAQueryResults"><center><b>No results to show</b><br>Enter a query</center></div>
                                 </div>
                             </div>`);
			$("#queryTypeSelect").change(function(){
				let Name = $(this).val();
				if(undefined === Name || Name === "" || Name === null || Name === false) return;
				let query = jSQL.query("SELECT `Query` FROM `Saved Queries` WHERE `Name` = ?")
					.execute([Name]).fetch("ASSOC").Query;
				cm.getDoc().setValue(query);
				$(this).val($(this).find("option:first").val());
			});
			$('#jSQLTableTabs').tabs({
                active: 1,
				beforeActivate: (event, ui)=>{
					let tableName = $(ui.newPanel).data("tn");
					if(tableName === undefined) return;
					$(ui.newPanel).html("Loading...");
				},
				activate: (event, ui)=>{
					setTimeout(()=>{
						let tableName = $(ui.newPanel).data("tn");
						if(tableName === undefined) return;
						let data = jSQL.select('*').from(tableName).execute().fetchAll('array');
						let tableHTML = '<div style="overflow-x:auto; width:100%; margin:0; padding:0;"><table></table></div>';
						$(ui.newPanel).html(tableHTML);
						let cols = [];
						for(let i=0; i<jSQL.tables[tableName].columns.length; i++)
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
			$("#jSQLResetButton").click(()=>{
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
			$("#jSQLSaveQueryButton").click(()=>{
				let name = prompt("Enter a name for this Template:");
				if(!name) return;
				let query = cm.getValue();
				jSQL.query("INSERT INTO `Saved Queries` (`Name`, `Query`) VALUES (?, ?)")
					.execute([name, query]);
				$("#queryTypeSelect").append("<option value='"+name+"'>"+name+"</option>");
			});
			$("#jSQLCommitButton").button({icons: { primary: "ui-icon-check"}});
			$('#jSQLCommitButton').css({"line-height": "0.9"});
			$("#jSQLCommitButton").click(()=>{
				jSQL.commit();
				$("#jSQLCommitButton").button("option", "label", "Committed!");
				setTimeout(()=>{
					$("#jSQLCommitButton").button("option", "label", "Commit");
				},2000);
			});
			addAllTables();
			$("head").append("<style>.CodeMirror-hints, .CodeMirror-hint, .CodeMirror-hint-active { z-index:2147483647 !important;}</style>");
			let tbls = {};
			for (let table in jSQL.tables) tbls[table] = jSQL.tables[table].columns;
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
		let sql = cm.getValue();
		cm.getDoc().setValue(jSQL.minify(sql));
	}
	function runjSQLQuery(){
		let sql = cm.getValue();
		try{
			let query = jSQL.query(sql).execute();
			let data = [];
			if(query!==undefined){
				data = query.fetchAll("assoc");
				if(query.type === "DROP"){
					closejSQL();
					openjSQL();
					cm.getDoc().setValue(sql);
				}
			}
			let tableHTML = data.length ? '<br><div><small><b>Results</b></small></div><div style="overflow-x:auto; width:100%; margin:0; padding:0;">'+makeTableHTML(data)+'</div>' : '<center><b>No results to show</b><br>Enter a query</center>';
			addAllTables();
			$("#jSQLMAQueryResults").html(tableHTML);
			$('#jSQLMAQueryResults').find('table').DataTable({"order": [], "scrollX": true});
		}catch(e){
			let msg = e.message ? e.message+"" : e+"";
			alert(msg);
			throw e;
		}
	}
	function addTableTab(tableName){
		if(drawnTables.indexOf(tableName)>-1) return;
		let $ul = $('#jSQLTableTabs').find('ul').eq(0);
		let id = 'jSQLResultsTab-' + $ul.find('li').length;
		$ul.append('<li><a href="#' + id + '">' + tableName + '</a></li>');
		$ul.after('<div id="' + id + '">Loading...</div>');
		$("#"+id).data("tn", tableName);
		$('#jSQLTableTabs').tabs("refresh");
		drawnTables.push(tableName);
	}
	function addAllTables() {
		for (let table in jSQL.tables) {
			if("Saved Queries" === table) continue;
			addTableTab(table);
		}
	}
	function makeTableHTML(data, drawData) {
		if(undefined === drawData) drawData = true;
		let html = [];
		html.push('<table><thead><tr>');
		for (let name in data[0])
			html.push('<th>' + name + '</th>');
		html.push('</tr></thead><tbody>');
		for (let i = 0; i < data.length; i++) {
			if(!drawData) break;
			html.push('<tr>');
			for (let name in data[i]) {
				let type = typeof data[i][name];
				let val = type !== "string" && type !== "number" ? "[" + type + "]" : data[i][name];
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
		$('body').append('<div id=\'jSQLMyAdminOverlay\' style=\'text-align: left; position:fixed; top:0; left:0; height:100%; width:100%; overflow-y:auto; z-index: 2147483646; background: rgba(255,255,255,0.99)\'><div id="jsOverlayContainer" style="padding:5px; margin:0;"><br><br><center><h3>Loading jSQLMyAdmin...</h3></center></div></div>');
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
		return new Promise((callback)=>{
			(function recurse() {
				if (!resources.length) {
					callback();
					return;
				}
				let resource = resources.shift();
				for(let i=resource.css.length; i--;)
					document.getElementsByTagName('head')[0].insertAdjacentHTML('beforeend', '<link rel=\'stylesheet\' href=\''+resource.css[i]+'\'>');
				(function innerRecurse() {
					if (!resource.js.length) {
						recurse();
						return;
					}
					let src = resource.js.shift();
					let script = document.createElement('script');
					script.type = 'text/javascript';
					if (script.readyState) { //IE
						script.onreadystatechange = ()=>{
							if (script.readyState == 'loaded' || script.readyState == 'complete') {
								script.onreadystatechange = null;
								setTimeout(innerRecurse, 1000);
							}
						};
					} else { //Others
						script.onload = ()=>{
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
