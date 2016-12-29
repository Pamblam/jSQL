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
  if (typeof window.jSQL === 'object') {
    var scripts = [
    ];
    var uiflag = false;
    var jQueryUISrc = '//code.jquery.com/ui/1.12.0/jquery-ui.min.js';
    if (typeof jQuery === 'undefined') scripts.push('//code.jquery.com/jquery-2.2.4.js');
    if (typeof jQuery === 'undefined' || typeof jQuery.ui === 'undefined') {
      scripts.push(jQueryUISrc);
      uiflag = true;
    }
    loadscripts(scripts).then(function () {
      if (uiflag) $('head').append('<link rel=\'stylesheet\' href=\'//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css\'>');
      $('body').append('<button id=\'openjSQLMyAdmin\' style=\'position:fixed; top:0; right:0; z-index:2147483647; opacity:0.7;\'>Open jSQLMyAdmin</button>');
      $('#openjSQLMyAdmin').text('Open jSQLMyAdmin');
      $('#openjSQLMyAdmin').click(openButtonHandler);
    });
  }
  function drawjSQLMyAdmin() {
    jSQL.load(function () {
      var $overlay = $('#jSQLMyAdminOverlay').empty();
      $overlay.html('<h5>jSQL Version: ' + jSQL.version + ' | jSQLMyAdmin Version: ' + jSQLMyAdminVersion + '</h5>');
      $overlay.append('<div id="jSQLTableTabs"><ul><li><a href="#jSQLResultsTab">Results</a></li></ul><div id="jSQLResultsTab"><center><b>No results to show</b><br>Enter a query</center></div></div>');
      addAllTables();
      $('#jSQLTableTabs').tabs();
    });
  }
  function addAllTables() {
    for (var table in jSQL.tables) {
      var $ul = $('#jSQLTableTabs').find('ul').eq(0);
      var id = 'jSQLResultsTab-' + $ul.find('li').length;
      $ul.append('<li><a href="#' + id + '">' + table + '</a></li>');
      $ul.after('<div id="' + id + '"></div>');
      var data = jSQL.query('select * from zips').execute().fetchAll('assoc');
      if (data.length > 15) data = data.slice(0, 15);
      var tableHTML = data.length ? makeTableHTML(data)  : '<center>No data in this table</center>';
      $("#"+id).append(tableHTML);
    }
  }
  function makeTableHTML(data) {
    var html = [];
    html.push('<table><thead><tr>');
    for(var name in data[0])
      html.push('<th>'+name+'</th>');
    html.push('</tr></thead><tbody>');
    for(var i = 0; i<data.length; i++){
      html.push('<tr>');
      for(var name in data[i]){
        var type = typeof data[i][name];
        var val = type !== "string" && type !== "number" ? "["+type+"]" : data[i][name];
        if(val.length > 50) val = val.substring(0, 47)+"...";
        html.push('<td>'+val+'</td>');
      }   
      html.push('</tr>');
    }
    return html.join('');
  }
  function openButtonHandler() {
    $('body').append('<div id=\'jSQLMyAdminOverlay\' style=\'position:fixed; top:0; left:0; height:100%; width:100%; z-index: 2147483646; background: rgba(255,255,255,0.7)\'><br><br><center><h3>Loading jSQLMyAdmin...</h3></center></div>');
    $('#openjSQLMyAdmin').remove();
    $('body').append('<button id=\'closejSQLMyAdmin\' style=\'position:fixed; top:0; right:0; z-index:2147483647; opacity:0.7;\'>Close jSQLMyAdmin</button>');
    $('#closejSQLMyAdmin').click(closeButtonHandler);
    drawjSQLMyAdmin();
  }
  function closeButtonHandler() {
    $('#jSQLMyAdminOverlay').remove();
    $('#closejSQLMyAdmin').remove();
    $('body').append('<button id=\'openjSQLMyAdmin\' style=\'position:fixed; top:0; right:0; z-index:2147483647; opacity:0.7;\'>Open jSQLMyAdmin</button>');
    $('#openjSQLMyAdmin').click(openButtonHandler);
  }
  function loadscripts(scripts) {
    return new Promise(function (callback) {
      (function recurse() {
        if (!scripts.length) {
          callback();
          return;
        }
        var src = scripts.shift();
        var script = document.createElement('script');
        script.type = 'text/javascript';
        if (script.readyState) { //IE
          script.onreadystatechange = function () {
            if (script.readyState == 'loaded' || script.readyState == 'complete') {
              script.onreadystatechange = null;
              setTimeout(function () {
                callback();
              }, 1000);
            }
          };
        } else { //Others
          script.onload = function () {
            setTimeout(recurse, 1000);
          };
        }
        script.src = src;
        console.log(src);
        document.getElementsByTagName('head') [0].appendChild(script);
      }) ();
    });
  }
}) ();
