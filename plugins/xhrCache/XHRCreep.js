/**
 * XHRCreep.js v0.2
 * A Wrapper for native XHR and Active X objects 
 * @author Robert Parham
 * @website https://github.com/Pamblam/XHRCreep
 * @license http://www.apache.org/licenses/LICENSE-2.0
 */
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
		XHRCreep.methods.notify.abort.apply(this, arguments);
		this.setMockProperties();
		var r = XHRCreep.methods.override.abort(this._xhr, arguments) ?
			XHRCreep.methods.override.abort.apply(this._xhr, arguments) :
			this._xhr.abort.apply(this._xhr, arguments) ;
		this.getMockProperties();
		return r;
	};

	window[xhrType].prototype.getAllResponseHeaders = function(){
		XHRCreep.methods.notify.getAllResponseHeaders.apply(this, arguments);
		var r = typeof XHRCreep.methods.override.getAllResponseHeaders==="function" ? 
			XHRCreep.methods.override.getAllResponseHeaders.apply(this._xhr, arguments) :
			this._xhr.getAllResponseHeaders.apply(this._xhr, arguments);
		this.getMockProperties();
		return r;
	};

	window[xhrType].prototype.getResponseHeader = function(){
		XHRCreep.methods.notify.getResponseHeader.apply(this, arguments);
		var r = typeof XHRCreep.methods.override.getResponseHeader==="function" ? 
			XHRCreep.methods.override.getResponseHeader.apply(this._xhr, arguments) :
			this._xhr.getResponseHeader.apply(this._xhr, arguments);
		this.getMockProperties();
		return r;
	};

	window[xhrType].prototype.overrideMimeType = function(){
		XHRCreep.methods.notify.overrideMimeType.apply(this, arguments);
		this.setMockProperties();
		var r = typeof XHRCreep.methods.override.overrideMimeType==="function" ? 
			XHRCreep.methods.override.overrideMimeType.apply(this._xhr, arguments) :
			this._xhr.overrideMimeType.apply(this._xhr, arguments) ;
		this.getMockProperties();
		return r;
	};

	window[xhrType].prototype.setRequestHeader = function(){
		XHRCreep.methods.notify.setRequestHeader.apply(this, arguments);
		this.setMockProperties();
		var r = typeof XHRCreep.methods.override.setRequestHeader==="function" ? 
			XHRCreep.methods.override.setRequestHeader.apply(this._xhr, arguments) :
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


