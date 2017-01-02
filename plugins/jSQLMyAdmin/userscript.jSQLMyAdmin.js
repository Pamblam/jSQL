// ==UserScript==
// @name        jSQLMyAdmin
// @namespace   pamblam.com
// @description A debugging tool for jSQL. Adds a button to the top of any webpage with jSQL which overlays a tool similar to mySQL's phpMyAdmin.
// @include     *
// @version     1
// @grant       none
// ==/UserScript==
(function () {
	var jSQLMyAdminVersion = 0;
	var cm;
	if (typeof window.jSQL === 'object') {

		var resources = [];
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
		if("undefined" === typeof CodeMirror) resources.push({
			js: ['//cdnjs.cloudflare.com/ajax/libs/codemirror/5.22.0/codemirror.js',
				'//cdnjs.cloudflare.com/ajax/libs/codemirror/5.22.0/mode/sql/sql.js',
				'//cdnjs.cloudflare.com/ajax/libs/codemirror/5.22.0/addon/hint/show-hint.js',
				'//cdnjs.cloudflare.com/ajax/libs/codemirror/5.22.0/addon/hint/sql-hint.js'],
			css: ['//cdnjs.cloudflare.com/ajax/libs/codemirror/5.22.0/codemirror.css',
				'//cdnjs.cloudflare.com/ajax/libs/codemirror/5.22.0/addon/hint/show-hint.css'],
		});
		loadresources(resources).then(function () {
			$('body').append('<button id=\'openjSQLMyAdmin\' style=\'position:fixed; top:0; right:0; z-index:2147483647; opacity:0.7;\'>Open jSQLMyAdmin</button>');
			$('#openjSQLMyAdmin').text('Open jSQLMyAdmin');
			$('#openjSQLMyAdmin').button({icons: { primary: "ui-icon-newwin"}});
			$('#openjSQLMyAdmin').css({"line-height": "0.9"});
			$('#openjSQLMyAdmin').click(openButtonHandler);
		});
	}
	function drawjSQLMyAdmin() {
		jSQL.load(function () {
			var $overlay = $('#jSQLMyAdminOverlay').empty();
			$overlay.html('<h5>jSQL Version: ' + jSQL.version + ' | jSQLMyAdmin Version: ' + jSQLMyAdminVersion + '</h5>');
			$overlay.append('<div id="jSQLTableTabs"><ul><li><a href="#jSQLResultsTab">Results</a></li></ul><div id="jSQLResultsTab"><div><div style="float:right;"><small><b>autocomplete</b>: <i>ctrl+space</i></small></div><div style="float:left"><b>Query:</b></div><div style="clear:both;"></div></div><textarea id="jSQLMyAdminQueryBox"></textarea><div style="text-align:right;"><button id="jSQLExecuteQueryButton">Run Query</button></div><div id="jSQLMAQueryResults"><center><b>No results to show</b><br>Enter a query</center></div></div></div>');
			$("#jSQLExecuteQueryButton").button({icons: { primary: "ui-icon-caret-1-e"}});
			$('#jSQLExecuteQueryButton').css({"line-height": "0.9"});
			$("#jSQLExecuteQueryButton").click(runjSQLQuery);
			addAllTables();
			$("head").append("<style>.CodeMirror-hints, .CodeMirror-hint, .CodeMirror-hint-active { z-index:2147483647 !important;}</style>");
			$('#jSQLTableTabs').tabs();
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
	function runjSQLQuery(){
		var sql = cm.getValue();
		try{
			var data = jSQL.query(sql).execute().fetchAll("assoc");
			var tableHTML = data.length ? '<br><div><small><b>Results</b></small></div><div style="overflow-x:auto; width:100%; margin:0; padding:0;">'+makeTableHTML(data)+'</div>' : '<center><b>No results to show</b><br>Enter a query</center>';
			$("#jSQLMAQueryResults").html(tableHTML);
			$('#jSQLMAQueryResults').find('table').DataTable();
		}catch(e){
			var msg = e.message ? e.message+"" : e+"";
			alert(msg);
		}
	}
	function addAllTables() {
		for (var table in jSQL.tables) {
			var $ul = $('#jSQLTableTabs').find('ul').eq(0);
			var id = 'jSQLResultsTab-' + $ul.find('li').length;
			$ul.append('<li><a href="#' + id + '">' + table + '</a></li>');
			$ul.after('<div id="' + id + '"></div>');
			var data = jSQL.query('select * from zips').execute().fetchAll('assoc');
			var tableHTML = data.length ? '<div style="overflow-x:auto; width:100%; margin:0; padding:0;">'+makeTableHTML(data)+'</div>' : '<center>No data in this table</center>';
			$("#" + id).append(tableHTML);
			$('#'+id).find('table').DataTable();
		}
	}
	function makeTableHTML(data) {
		var html = [];
		html.push('<table><thead><tr>');
		for (var name in data[0])
			html.push('<th>' + name + '</th>');
		html.push('</tr></thead><tbody>');
		for (var i = 0; i < data.length; i++) {
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
		return html.join('');
	}
	function openButtonHandler() {
		$('body').append('<div id=\'jSQLMyAdminOverlay\' style=\'position:fixed; top:0; left:0; height:100%; width:100%; overflow-y:auto; z-index: 2147483646; background: rgba(255,255,255,0.7)\'><br><br><center><h3>Loading jSQLMyAdmin...</h3></center></div>');
		$('#openjSQLMyAdmin').remove();
		$('body').append('<button id=\'closejSQLMyAdmin\' style=\'position:fixed; top:0; right:0; z-index:2147483647; opacity:0.7;\'>Close jSQLMyAdmin</button>');
		$('#closejSQLMyAdmin').button({icons: { primary: "ui-icon-closethick"}});
		$('#closejSQLMyAdmin').css({"line-height": "0.9"});
		$('#closejSQLMyAdmin').click(closeButtonHandler);
		drawjSQLMyAdmin();
	}
	function closeButtonHandler() {
		cm = null;
		$('#jSQLMyAdminOverlay').remove();
		$('#closejSQLMyAdmin').remove();
		$('body').append('<button id=\'openjSQLMyAdmin\' style=\'position:fixed; top:0; right:0; z-index:2147483647; opacity:0.7;\'>Open jSQLMyAdmin</button>');
		$('#openjSQLMyAdmin').button({icons: { primary: "ui-icon-newwin"}});
		$('#openjSQLMyAdmin').css({"line-height": "0.9"});
		$('#openjSQLMyAdmin').click(openButtonHandler);
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
})();
