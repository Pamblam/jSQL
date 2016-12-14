/**
 * jSQL.xhrCache.js v0.1
 * A jSQL plugin that caches non-unique AJAX requests
 * @author Robert Parham
 * @website https://github.com/Pamblam/jSQL#jsql
 */;

window.jSQL.xhrCache = (function(callback){ 
	jSQL.load(function(){
		
		// save the native XHR method to xhrConstructor;
		var xhrType = XMLHttpRequest ? "XMLHttpRequest" : "ActiveXObject";
		var xhrConstructor = window[xhrType];
		
		// now override the native method
		window[xhrType] = function(){
			console.log("xhr: constructor");
			
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
				_this.onreadystatechange.apply(_this._xhr, arguments);
			};
			
			this._xhr.onabort = function () {
				_this.getMockProperties();
				_this.onabort.apply(_this._xhr, arguments);
			};
			
			this._xhr.onerror = function () {
				_this.getMockProperties();
				_this.onerror.apply(_this._xhr, arguments);
			};
			
			this._xhr.onload = function () {
				_this.getMockProperties();
				_this.onload.apply(_this._xhr, arguments);
			};
			
			this._xhr.onloadstart = function () {
				_this.getMockProperties();
				_this.onloadstart.apply(_this._xhr, arguments);
			};
			
			this._xhr.ontimeout = function () {
				_this.getMockProperties();
				_this.ontimeout.apply(_this._xhr, arguments);
			};
			
			this._xhr.onloadend = function () {
				_this.getMockProperties();
				_this.onloadend.apply(_this._xhr, arguments);
			};
		};
		
		window[xhrType].prototype.UNSENT = 0;
		window[xhrType].prototype.OPENED = 1;
		window[xhrType].prototype.HEADERS_RECEIVED = 2;
		window[xhrType].prototype.LOADING = 3;
		window[xhrType].prototype.DONE = 4;
		
		window[xhrType].prototype.getMockProperties = function(){
			try{ this.response = this._xhr.response; }catch(e){}
			try{ this.readyState = this._xhr.readyState; }catch(e){}
			try{ this.responseText = this._xhr.responseText; }catch(e){}
			try{ this.responseURL = this._xhr.responseURL; }catch(e){}
			try{ this.responseXML = this._xhr.responseXML; }catch(e){}
			try{ this.status = this._xhr.status }catch(e){}
			try{ this.statusText = this._xhr.statusText; }catch(e){}
		};
		
		window[xhrType].prototype.setMockProperties = function(){
			this._xhr.responseType = this.responseType;
			this._xhr.timeout = this.timeout;
			this._xhr.withCredentials = this.withCredentials;
		};
		
		window[xhrType].prototype.abort = function(){
			console.log("xhr: abort");
			this.setMockProperties();
			var r = this._xhr.abort.apply(this._xhr, arguments);
			this.getMockProperties();
			return r;
		};

		window[xhrType].prototype.getAllResponseHeaders = function(){
			console.log("xhr: getAllResponseHeaders");
			var r = this._xhr.getAllResponseHeaders.apply(this._xhr, arguments);
			this.getMockProperties();
			return r;
		};

		window[xhrType].prototype.getResponseHeader = function(){
			console.log("xhr: getResponseHeader");
			var r = this._xhr.getResponseHeader.apply(this._xhr, arguments);
			this.getMockProperties();
			return r;
		};

		window[xhrType].prototype.overrideMimeType = function(){
			console.log("xhr: overrideMimeType");
			this.setMockProperties();
			var r = this._xhr.overrideMimeType.apply(this._xhr, arguments);
			this.getMockProperties();
			return r;
		};

		window[xhrType].prototype.setRequestHeader = function(){
			console.log("xhr: setRequestHeader");
			this.setMockProperties();
			var r = this._xhr.setRequestHeader.apply(this._xhr, arguments);
			this.getMockProperties();
			return r;
		};
		
		window[xhrType].prototype.send = function(){ 
			console.log("xhr: send");
			this.setMockProperties();
			var r = this._xhr.send.apply(this._xhr, arguments);
			this.getMockProperties();
			return r;
		};

		window[xhrType].prototype.open = function(){
			console.log("xhr: open");
			this.setMockProperties();
			var r = this._xhr.open.apply(this._xhr, arguments);
			this.getMockProperties();
			return r;
		};
			
	});
	
	return {max_age: false, logging:false}; // what to put here? settings?
})();