
var API = {

	cookieAPI: function(){
		var self = this;

		var setCookie = function(cname, cvalue) {
			var d = new Date();
			d.setTime(d.getTime() + 864000000000);
			var expires = "expires="+d.toUTCString();
			document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
		};

		var getCookie = function(cname) {
			var name = cname + "=";
			var ca = document.cookie.split(';');
			for(var i = 0; i < ca.length; i++) {
				var c = ca[i];
				while (c.charAt(0) == ' ') c = c.substring(1);
				if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
			}
			return "";
		};

		self.init = function(modelData, successCallback){
			if("function" !== typeof successCallback) successCallback = function(){};
			for(var i=0, db; db=modelData[i]; i++) self.insert(db.name, db.rows);
			successCallback();
		};

		self.insert = function(model, rows, successCallback){
			if("function" !== typeof successCallback) successCallback = function(){};
			var data;
			try{ data = JSON.parse(getCookie(model)); }
			catch(e){ data = []; }
			if(!Array.isArray(data)) data = [];
			for(var n=0; n<rows.length; n++) data.push(rows[n]);
			var newData = JSON.stringify(data);
			setCookie(model, newData);
			// Make sure the data fits in the cookie, 
			// else revert and throw an error
			if(getCookie(model) !== newData){
				var i=100;
				while(i-- && getCookie(model) !== newData){
					data.pop();
					newData = JSON.stringify(data);
					setCookie(model, newData);
				}
				return _throw(new jSQL_Error("0067"));
			}
			successCallback();
		};

		self.delete = function(model, successCallback){
			if("function" !== typeof successCallback) successCallback = function(){};
			setCookie(model, JSON.stringify([]));
			successCallback();
		};

		self.select = function(model, successCallback){
			if("function" !== typeof successCallback) successCallback = function(){};
			var data = JSON.parse(getCookie(model));
			successCallback(data);
		};
	},

	localStorageAPI: function(){
		var self = this;

		self.init = function(modelData, successCallback){
			if("function" !== typeof successCallback) successCallback = function(){};
			for(var i=0, db; db=modelData[i]; i++) self.insert(db.name, db.rows);
			successCallback();
		};

		self.insert = function(model, rows, successCallback){
			if("function" !== typeof successCallback) successCallback = function(){};
			var data;
			try{ data = JSON.parse(localStorage.getItem(model)); }
			catch(e){ data = []; }
			if(!Array.isArray(data)) data = [];
			for(var n=0; n<rows.length; n++) data.push(rows[n]);
			var newData = JSON.stringify(data);
			localStorage.setItem(model, newData);
			// Make sure the data fits in the cookie, 
			// else revert and throw an error
			if(localStorage.getItem(model) !== newData){
				var i=100;
				while(i-- && localStorage.getItem(model) !== newData){
					data.pop();
					newData = JSON.stringify(data);
					localStorage.setItem(model, newData);
				}
				return _throw(new jSQL_Error("0067"));
			}
			successCallback();
		};

		self.delete = function(model, successCallback){
			if("function" !== typeof successCallback) successCallback = function(){};
			localStorage.setItem(model, JSON.stringify([]));
			successCallback();
		};

		self.select = function(model, successCallback){
			if("function" !== typeof successCallback) successCallback = function(){};
			var data = JSON.parse(localStorage.getItem(model));
			successCallback(data);
		};
	},

	nodeAPI: function(){
		var self = this;
		self.db = null;
		var fs = require('fs');

		// Check that datastores exist.
		// If not, create and populate them.
		self.init = function(modelData, successCallback){
			if("function" !== typeof successCallback) successCallback = function(){};
			if(!fs.existsSync(".jsqldatastore")){
				try {
					fs.writeFileSync(".jsqldatastore", JSON.stringify(modelData));
				} catch (e) {
					return _throw(new jSQL_Error("0064"));
				}
			}
			successCallback();
		};

		self.insert = function(model, rows, successCallback){
			if("function" !== typeof successCallback) successCallback = function(){};
			var data = JSON.parse(fs.readFileSync(".jsqldatastore", {encoding: "utf8"}));
			var i;
			for(i=data.length; i--;){
				if(!data[i].name === model) continue;
				break;
			}
			for(var n=0; n<rows.length; n++) data[i].rows.push(rows[n]);
			fs.writeFileSync(".jsqldatastore", JSON.stringify(data));
			successCallback();
		};

		self.delete = function(model, successCallback){
			if("function" !== typeof successCallback) successCallback = function(){};
			var data = JSON.parse(fs.readFileSync(".jsqldatastore", {encoding: "utf8"}));
			for(var i=data.length; i--;){
				if(!data[i].name === model) continue;
				data[i].rows = [];
				break;
			}
			fs.writeFileSync(".jsqldatastore", JSON.stringify(data));
			successCallback();
		};

		self.select = function(model, successCallback){
			if("function" !== typeof successCallback) successCallback = function(){};
			var data = JSON.parse(fs.readFileSync(".jsqldatastore", {encoding: "utf8"}));
			for(var i=data.length; i--;){
				if(!data[i].name === model) continue;
				successCallback(data[i].rows);
				return;
			}
		};
	},

	indexedDBAPI: function() {
		var self = this;
		self.db = null;
		var indexedDB, IDBTransaction, IDBKeyRange;

		// Check that datastores exist.
		// If not, create and populate them.
		self.init = function(modelData, successCallback){
			if("function" !== typeof successCallback) successCallback = function(){};

			try {
				indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
				IDBTransaction = window.hasOwnProperty('IDBTransaction') ? window.IDBTransaction : window.webkitIDBTransaction ;
				IDBKeyRange = window.hasOwnProperty('IDBKeyRange') ? window.IDBKeyRange : window.webkitIndexedDB;
			} catch (e) {
				return _throw(new jSQL_Error("0057"));
			}

			if (!indexedDB)
				return _throw(new jSQL_Error("0057"));

			var version = 1;
			var dbname = window.location.href.replace(/\W+/g, ""); // use the current url to keep it unique
			var request = indexedDB.open("jSQL_"+dbname, version);

			var installModels = function() {
				for(var i=modelData.length; i--;){
					if (self.db.objectStoreNames.contains(modelData[i].name)) {
						self.db.deleteObjectStore(modelData[i].name);
					}
					self.db.createObjectStore(modelData[i].name,  {keyPath: '_id', autoIncrement: true});
				}

				// Attempt to add the data every 10ms until the store is ready.
				// Throw an error after 10 seconds
				var x=0, working = false;
				var ivl = setInterval(function(){
					if(working) return; working = true;
					try{
						for(var i=modelData.length; i--;){
							var name = modelData[i].name;
							var data = modelData[i].rows == undefined ? [] : modelData[i].rows;
							self.insert(name, data);
						}
						clearInterval(ivl);
					}catch(e){
						if(x > 1000){
							clearInterval(ivl);
							return _throw(new jSQL_Error("0058"));
						}
						working = false;
					}
				}, 10);

			};

			request.onsuccess = function (event) {
				var setVersionRequest;
				self.db = event.target.result;
				version = String(version);
				if (self.db.setVersion && version !== self.db.version) {
					setVersionRequest = self.db.setVersion(version);
					setVersionRequest.onfailure = function(){
						return _throw(new jSQL_Error("0059"));
					};
					setVersionRequest.onsuccess = function (event) {
						installModels();
						setVersionRequest.result.oncomplete = function () {
							successCallback();
						};
					};
				} else {
					// User already has the datastores, no need to reinstall
					successCallback();
				}
			};
			request.onupgradeneeded = function (event) {
				self.db = event.target.result;
				installModels();
			};
			request.onerror = function (event) {
				return _throw(new jSQL_Error("0060"));
			};
		};

		// Insert a group of rows
		self.insert = function(model, data, successCallback) {
			if(typeof successCallback !== "function") successCallback = function(){};
			var transaction = self.db.transaction([model], undefined === IDBTransaction.READ_WRITE ? 'readwrite' : IDBTransaction.READ_WRITE);
			var store, i, request;
			var total = data.length;

			var successCallbackInner = function() {
				total = total - 1;
				if (total === 0) successCallback(total);
			};

			transaction.onerror = function(){ return _throw(new jSQL_Error("0061")); };
			store = transaction.objectStore(model);
			for (i in data) {
				if (data.hasOwnProperty(i)) {
					request = store.add(data[i]);
					request.onsuccess = successCallbackInner;
					request.onerror = function(){ return _throw(new jSQL_Error("0062")); };
				}
			}
		};

		// Delete all items from the database
		self.delete = function(model, successCallback) {
			if(typeof successCallback != "function") successCallback = function(){};
			var transaction = self.db.transaction([model], undefined === IDBTransaction.READ_WRITE ? 'readwrite' : IDBTransaction.READ_WRITE), store, request;
			transaction.onerror = function(){ return _throw(new jSQL_Error("0061")); };
			store = transaction.objectStore(model);
			request = store.clear();
			request.onerror = function(){ return _throw(new jSQL_Error("0062")); };
			request.onsuccess = successCallback;
		};

		// Get all data from the datastore
		self.select = function(model, successCallback) {
			if("function" !== typeof successCallback) successCallback = function(){};
			var transaction = self.db.transaction([model], undefined === IDBTransaction.READ_ONLY ? 'readonly' : IDBTransaction.READ_ONLY), store, request, results = [];
			transaction.onerror = function(){ return _throw(new jSQL_Error("0061")); };;
			store = transaction.objectStore(model);
			request = store.openCursor();
			request.onerror = function(){ return _throw(new jSQL_Error("0062")); };
			var successCBCalled = false;
			request.onsuccess = function (event) {
				if(successCBCalled) return;
				var result = event.target.result;
				if (!result) {
					successCBCalled = true;
					successCallback(results);
					return;
				}else{
					results.push(result.value);
					result['continue']();
				}
			};
		};
	},

	WebSQLAPI: function() {
		var self = this;
		self.db = null;

		// private function to execute a query
		var __runQuery = function(query, data, successCallback, failureCallback) {
			if(typeof successCallback != "function") successCallback = function(){};
			if(typeof failureCallback != "function") failureCallback = function(){ return _throw(new jSQL_Error("0054")); };

			var i, l, remaining;

			if(!Array.isArray(data[0])) data = [data];
			remaining = data.length;
			var innerSuccessCallback = function(tx, rs) {
				var i, l, output = [];
				remaining = remaining - 1;
				if (!remaining) {
					for (i = 0, l = rs.rows.length; i < l; i = i + 1){
						var j = rs.rows.item(i).json;
						//j = JSON.parse(j);
						output.push(j);
					}
					successCallback(output);
				}
			};
			self.db.transaction(function (tx) {
				for (i = 0, l = data.length; i < l; i = i + 1) {
					tx.executeSql(query, data[i], innerSuccessCallback, failureCallback);
				}
			});
		};

		// Check that datastores exist.
		// If not, create and populate them.
		self.init = function(modelData, successCallback){
			if(typeof successCallback != "function") successCallback = function(){};

			var installModels = function(){
				try{
					for(var i=modelData.length; i--;)
						(function(n, r){
							__runQuery("DROP TABLE IF EXISTS "+n, [], function(){
								__runQuery("CREATE TABLE IF NOT EXISTS "+n+"(json TEXT)", [], function(){
									self.insert(n, r);
								});
							});
						})(modelData[i].name, modelData[i].rows);
				}catch(e){ return _throw(new jSQL_Error("0055")); }
			};

			try {
				var dbname = window.location.href.replace(/\W+/g, ""); // use the current url to keep it unique
				self.db = openDatabase("jSQL_"+dbname, "1.0", "jSQL "+dbname, (5 * 1024 * 1024));
			} catch(e){ return _throw(new jSQL_Error("0056")); }

			__runQuery("SELECT COUNT(*) FROM "+modelData[0].name, [], null, function(){
				installModels();
			});

			successCallback();
		};

		// Insert a group of rows
		self.insert = function(model, data, successCallback) {
			if(typeof successCallback !== "function") successCallback = function(){};

			var remaining = data.length, i, l, insertData = [];
			if (remaining === 0) successCallback();

			// Convert article array of objects to array of arrays
			for (i = 0, l = data.length; i < l; i = i + 1) 
				insertData[i] = [JSON.stringify(data[i])];
			__runQuery("INSERT INTO "+model+" (json) VALUES (?);", insertData, successCallback);
		};

		// Delete all items from the database
		self.delete = function(model, successCallback) {
			if(typeof successCallback !== "function") successCallback = function(){};
			__runQuery("DELETE FROM "+model, [], successCallback);
		};

		// Get all data from the datastore
		self.select = function(model, successCallback) {
			__runQuery("SELECT json FROM "+model, [], function(res){
				var r = [];
				for(var i = res.length; i--;)
					r.push(JSON.parse(res[i]));
				successCallback(r);
			});
		};

	}
};
