/**
 * jSQLe.js v0.1
 * A Plugin that allows use of jSQL anywhere on your domain
 * @author Robert Parham
 * @website https://github.com/Pamblam/jSQL#jsql
 * @license http://www.apache.org/licenses/LICENSE-2.0
 */

;window.jSQLe = (function(){
	"use strict";
	
	var Role = "client";
	var ServerURL = "";
	var callbackStack = [];
	
	// Temporary jSQL placeholder
	function createjSQLTemp(){
		window.jSQL = {load: function(cb){
			callbackStack.push(cb);
		}};
	}
	
	function loadClient(){
		createjSQLTemp();
		var i = document.createElement("iframe");
		i.onload = function(){
			var win = i.contentWindow;
			window.jSQL = win.jSQL;
			for(var n=0; n<callbackStack.length; n++)
				jSQL.load(callbackStack[n]);
		};
		i.setAttribute("style", "visibility:hidden;display:none");
		i.setAttribute("src", ServerURL);
		document.getElementsByTagName("body")[0].appendChild(i);
	}
	
	function load(params){
		if(undefined === params.role) params.role = "client";
		if(params.role == "client" && undefined === params.server) 
			throw "Client side must include server url.";
		Role = params.role.toUpperCase();
		ServerURL = params.server;
		if(Role==="CLIENT") loadClient();
	}
	
	////////////////////////////////////////////////////////////////////////////
	// Exposed Methods /////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////
	
	return {
		version: 0.1,
		load: load
	};
	
}());