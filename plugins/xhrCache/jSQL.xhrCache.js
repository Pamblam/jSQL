/**
 * jSQL.xhrCache.js v1.0 (Bundled with XHRCreep.js 0.3)
 * A jSQL plugin that caches non-unique, non expired AJAX requests
 * @author Robert Parham
 * @website https://github.com/Pamblam/jSQL#jsql
 * @website https://github.com/XHRCreep
 */;

window.XHRCreep = (function(){
	
	// save the native XHR method to xhrConstructor;
	var xhrType = XMLHttpRequest ? "XMLHttpRequest" : "ActiveXObject";
	var xhrConstructor = window[xhrType];

	// now override the native method
	window[xhrType] = function(){

		// A new XMLHttpRequest instance,
		// the class wraps this instance
		this._xhr = new (Function.prototype.bind.apply(xhrConstructor, arguments));

		// Mock properties of XHR
		this.response = "";
		this.readyState = 0;
		this.responseText = "";
		this.responseType = 'text';
		this.responseURL = "";
		this.responseXML = null;
		this.status = 0;
		this.statusText = "";
		this.timeout = 0;
		this.withCredentials = false;

		var _this = this;

		// Mock Events of XHR
		this.onreadystatechange = function(){};
		this.onabort = function(){};
		this.onerror = function(){};
		this.onload = function(){};
		this.onloadstart = function(){};
		this.ontimeout = function(){};
		this.onloadend = function(){};

		this._xhr.onreadystatechange = function () {
			_this.getMockProperties();
			if(XHRCreep.events.onreadystatechange.apply(_this._xhr, arguments))
				_this.onreadystatechange.apply(_this._xhr, arguments);
		};

		this._xhr.onabort = function () {
			_this.getMockProperties();
			if(XHRCreep.events.onabort.apply(_this._xhr, arguments))
				_this.onabort.apply(_this._xhr, arguments);
		};

		this._xhr.onerror = function () {
			_this.getMockProperties();
			if(XHRCreep.events.onerror.apply(_this._xhr, arguments))
				_this.onerror.apply(_this._xhr, arguments);
		};

		this._xhr.onload = function () {
			_this.getMockProperties();
			if(XHRCreep.events.onload.apply(_this._xhr, arguments))
				_this.onload.apply(_this._xhr, arguments);
		};

		this._xhr.onloadstart = function () {
			_this.getMockProperties();
			if(XHRCreep.events.onloadstart.apply(_this._xhr, arguments))
				_this.onloadstart.apply(_this._xhr, arguments);
		};

		this._xhr.ontimeout = function () {
			_this.getMockProperties();
			if(XHRCreep.events.ontimeout.apply(_this._xhr, arguments))
				_this.ontimeout.apply(_this._xhr, arguments);
		};

		this._xhr.onloadend = function () {
			_this.getMockProperties();
			if(XHRCreep.events.onloadend.apply(_this._xhr, arguments)) 
				_this.onloadend.apply(_this._xhr, arguments);
		};
	};

	window[xhrType].prototype.UNSENT = 0;
	window[xhrType].prototype.OPENED = 1;
	window[xhrType].prototype.HEADERS_RECEIVED = 2;
	window[xhrType].prototype.LOADING = 3;
	window[xhrType].prototype.DONE = 4;
	window[xhrType].prototype.XHRCreepVersion = 0.3;

	window[xhrType].prototype.getMockProperties = function(){
		try{ this.response = this._xhr.response; }catch(e){}
		try{ this.readyState = this._xhr.readyState; }catch(e){}
		try{ this.responseText = this._xhr.responseText; }catch(e){}
		try{ this.responseURL = this._xhr.responseURL; }catch(e){}
		try{ this.responseXML = this._xhr.responseXML; }catch(e){}
		try{ this.status = this._xhr.status; }catch(e){}
		try{ this.statusText = this._xhr.statusText; }catch(e){}
	};

	window[xhrType].prototype.setMockProperties = function(){
		this._xhr.responseType = this.responseType;
		this._xhr.timeout = this.timeout;
		this._xhr.withCredentials = this.withCredentials;
	};

	window[xhrType].prototype.abort = function(){
		XHRCreep.methods.notify.abort.apply(this, arguments);
		this.setMockProperties();
		var r = typeof XHRCreep.methods.override.abort==="function" ? 
			XHRCreep.methods.override.abort.apply(this, arguments) :
			this._xhr.abort.apply(this._xhr, arguments) ;
		this.getMockProperties();
		return r;
	};

	window[xhrType].prototype.getAllResponseHeaders = function(){
		XHRCreep.methods.notify.getAllResponseHeaders.apply(this, arguments);
		var r = typeof XHRCreep.methods.override.getAllResponseHeaders==="function" ? 
			XHRCreep.methods.override.getAllResponseHeaders.apply(this, arguments) :
			this._xhr.getAllResponseHeaders.apply(this._xhr, arguments);
		this.getMockProperties();
		return r;
	};

	window[xhrType].prototype.getResponseHeader = function(){
		XHRCreep.methods.notify.getResponseHeader.apply(this, arguments);
		var r = typeof XHRCreep.methods.override.getResponseHeader==="function" ? 
			XHRCreep.methods.override.getResponseHeader.apply(this, arguments) :
			this._xhr.getResponseHeader.apply(this._xhr, arguments);
		this.getMockProperties();
		return r;
	};

	window[xhrType].prototype.overrideMimeType = function(){
		XHRCreep.methods.notify.overrideMimeType.apply(this, arguments);
		this.setMockProperties();
		var r = typeof XHRCreep.methods.override.overrideMimeType==="function" ? 
			XHRCreep.methods.override.overrideMimeType.apply(this, arguments) :
			this._xhr.overrideMimeType.apply(this._xhr, arguments) ;
		this.getMockProperties();
		return r;
	};

	window[xhrType].prototype.setRequestHeader = function(){
		XHRCreep.methods.notify.setRequestHeader.apply(this, arguments);
		this.setMockProperties();
		var r = typeof XHRCreep.methods.override.setRequestHeader==="function" ? 
			XHRCreep.methods.override.setRequestHeader.apply(this, arguments) :
			this._xhr.setRequestHeader.apply(this._xhr, arguments);
		this.getMockProperties();
		return r;
	};

	window[xhrType].prototype.send = function(){ 
		XHRCreep.methods.notify.send.apply(this, arguments);
		this.setMockProperties();
		var r = typeof XHRCreep.methods.override.send==="function" ? 
			XHRCreep.methods.override.send.apply(this, arguments) :
			this._xhr.send.apply(this._xhr, arguments) ;
		this.getMockProperties();
		return r;
	};

	window[xhrType].prototype.open = function(){
		XHRCreep.methods.notify.open.apply(this, arguments);
		this.setMockProperties();
		var r = typeof XHRCreep.methods.override.open==="function" ? 
			XHRCreep.methods.override.open.apply(this, arguments) :
			this._xhr.open.apply(this._xhr, arguments) ;
		this.getMockProperties();
		return r;
	};
	
	return {
		methods:{
			notify: {
				open: function(){},
				send: function(){},
				setRequestHeader: function(){},
				overrideMimeType: function(){},
				getResponseHeader: function(){},
				getAllResponseHeaders: function(){},
				abort: function(){}
			},
			override: {
				open: false,
				send: false,
				setRequestHeader: false,
				overrideMimeType: false,
				getResponseHeader: false,
				getAllResponseHeaders: false,
				abort: false
			}
		},
		events:{
			onreadystatechange: function(){ return true; },
			onabort: function(){ return true; },
			onerror: function(){ return true; },
			onload: function(){ return true; },
			onloadstart: function(){ return true; },
			ontimeout: function(){ return true; },
			onloadend: function(){ return true; }
		}
	};
})();


window.jSQL.xhrCache = (function(callback){ 
	jSQL.load(function(){
		
		// Make sure there's a table available
		jSQL.createTable({
			jSQLCache: [
				{name:"method", type: "varchar"},
				{name:"url", type: "varchar"},
				{name:"post_data", type:"varchar"},
				{name:"post_data_type", type: "varchar"},
				{name:"username", type:"varchar"},
				{name:"password", type:"varchar"},
				{name:"cached_time", type:"date"},
				{name:"use_count", type: "int"},
				{name:"response", type:"json"}
			]
		}).ifNotExists().execute();
		
		XHRCreep.methods.notify.open = function(){
			this._METHOD = arguments[0].toUpperCase();
			this._URL = arguments[1];
			this._USERNAME = undefined === arguments[3] ? "" :arguments[3];
			this._PASSWORD = undefined === arguments[4] ? "" :arguments[4];
		};
		
		XHRCreep.methods.override.send = function(){
			this._POST_DATA = "";
			this._POST_DATA_TYPE = "";
			try{
				this._POST_DATA = "JSON";
				this._POST_DATA_TYPE = JSON.stringify(arguments[0]);
			}catch(e){
				this._POST_DATA = "";
				this._POST_DATA_TYPE = "";
			}
			if(undefined === this._POST_DATA_TYPE || null === this._POST_DATA_TYPE) this._POST_DATA_TYPE = "";
			
			// check for an existing equivelent call
			var query = jSQL.query("select * from jSQLCache where method = ? and"+
					" url = ? and post_data = ? and post_data_type = ? and username = ?"+
					" and password = ?");
			var params = [this._METHOD, this._URL, this._POST_DATA, this._POST_DATA_TYPE,
					this._USERNAME, this._PASSWORD];
				
			var results = query.execute(params).fetchAll("ASSOC");

			var proceed = true;
			if(results.length) proceed = false;
			
			// check the timeout before serving the cached response.
			var minutes_old = 0;
			if(!proceed){
				var stored = results[0].cached_time.getTime();
				var now = new Date().getTime();
				minutes_old = Math.floor((now - stored) / 60000);
				if(jSQL.xhrCache.max_age !== false && minutes_old > jSQL.xhrCache.max_age){
					proceed = true;
					if(jSQL.xhrCache.logging)
						console.log("jSQL.xhrCache: Disgarding outdated cache data, fetching fresh response.");
					jSQL.query("delete from jSQLCache where method = ? and"+
					" url = ? and post_data = ? and post_data_type = ? and username = ?"+
					" and password = ?").execute(params);
					jSQL.commit();
				}
			}
			
			var _this = this;
			if(proceed){
				
				this._xhr.onreadystatechange = function(){
					_this.getMockProperties();
					
					if (_this.readyState === 4 && _this.status === 200){
						// ony cache raw text and json responses
						if(['', 'json', 'text'].indexOf(_this._xhr.responseType)>-1){
							var response = _this._xhr.response;
							var respType = _this._xhr.responseType;
							if("object" === typeof response || (_this._xhr.getResponseHeader("content-type") || "").indexOf('json') > -1){
								
								if("object" === typeof response) response = ""+JSON.stringify(_this._xhr.response);
								respType = 'json';
								
							}
							
							var responseText = "";
							try{ responseText = _this._xhr.responseText; }catch(e){};
							
							var responseXML = "";
							try{ responseXML = _this._xhr.responseXML; }catch(e){};
							
							var sreq = {response: response,
							readyState: _this._xhr.readyState,
							responseURL: _this._xhr.responseURL,
							responseXML: responseXML,
							status: _this._xhr.status,
							responseType: respType,
							responseText: responseText,
							statusText: _this._xhr.statusText,
							headers: _this._xhr.getAllResponseHeaders()};
							
							var id = jSQL.query("select * from jSQLCache").execute().fetchAll("ARRAY").length;
							query = jSQL.query("insert into jSQLCache values (?, ?, ?, ?, ?, ?, ?, ?, ?)");
							var params = [_this._METHOD, _this._URL, _this._POST_DATA, _this._POST_DATA_TYPE,
								_this._USERNAME, _this._PASSWORD, new Date(), 0, sreq];
							query.execute(params);
							jSQL.commit();
							
							if(jSQL.xhrCache.logging)
								console.log("jSQL.xhrCache: Caching AJAX response");
						}
					}

					// call the original onreadystatechange
					_this.onreadystatechange.apply(_this._xhr, arguments);
					
				};
				// send the request
				this._xhr.send.apply(this._xhr, arguments) ;
				
			}else{
				
				setTimeout(function (){
					
					_this.response = results[0].response.responseType === 'json' ? 
					JSON.parse(results[0].response.response) : results[0].response.response;
					
					_this.readyState = results[0].response.readyState;
					_this.responseURL = results[0].response.responseURL;
					_this.responseXML = results[0].response.responseXML;
					_this.status = results[0].response.status;
					_this.responseType = results[0].response.responseType;
					_this.responseText = results[0].response.responseText;
					_this.statusText = results[0].response.statusText;
					
					// override the getResponseHeader
					_this.getResponseHeader = function(name){
						name = name.toUpperCase().trim();
						var s = results[0].response.headers.split("\n");
						for(var i=s.length; i--;){
							if(s[i]==="") continue;
							var parts = s[i].split(":"); console.log(parts);
							var n = (parts.shift()+"").toUpperCase().trim();
							if(n === name) return parts.join(":").trim();
						}
						return null;
					};
					
					_this.getAllResponseHeaders = function(){
						return results[0].response.headers;
					};
					
					
					if(jSQL.xhrCache.logging){
						console.groupCollapsed("jSQL.xhrCache: "+_this._METHOD.toUpperCase()+": "+_this._URL);
						console.log("METHOD: ", _this._METHOD);
						console.log("POSTDATA: ", _this._POST_DATA);
						console.log("RESPONSE TYPE: ", _this.responseType);
						console.log("RESPONSE: ", _this.response);
						console.log("Cached about "+minutes_old+" minutes ago.");
						console.groupEnd();
					}
					
					_this.onreadystatechange.apply(_this, arguments);
					_this.onload.apply(_this, arguments);
				}, 50);
				
				
				
			}
		};
	});
		
	return {max_age: 60, logging:true};
})();