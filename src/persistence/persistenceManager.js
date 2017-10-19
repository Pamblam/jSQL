
		var persistenceManager = new (function(){
			var self = this;
			self.api = null;
			self.error = false;
			self.loaded = false;
			self.isLoading = false;
			self.initiated = false;
			self.loadingCallbacks = [];
			self.api_default_priority = ['indexedDBAPI', 'WebSQLAPI', 'localStorageAPI', 'cookieAPI'];
			self.api_user_priority = [];
			
			self.setApiPriority = function(){
				self.api_user_priority = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));
			};

			self.getApi = function(){ 
				var constructor = false;
				try{
					constructor = self.api.constructor.name;
				}catch(e){
					constructor = false;
				}
				return constructor;
			};

			self.commit = function(callback){
				if("function" === typeof callback) callback = function(){};
				if(self.error!==false) return _throw(self.error);
				var rows = [];
				for(var tbl in jSQL.tables){
					if(!jSQL.tables.hasOwnProperty(tbl)) continue;

					var keys = [];
					for(var i=0; i<jSQL.tables[tbl].keys.unique.length; i++)
						keys.push({column: jSQL.tables[tbl].keys.unique[i].column, type: "unique"});
					if(jSQL.tables[tbl].keys.primary.column)
						keys.push({column: jSQL.tables[tbl].keys.primary.column, type: "primary"});

					var data = jSQL.select("*").from(tbl).execute().fetchAll();
					if(!data.length){
						// Save empty tables				
						rows.push({
							table: tbl, 
							data: JSON.stringify(jSQL.tables[tbl].columns), 
							colTypes: JSON.stringify(jSQL.tables[tbl].types), 
							keys: JSON.stringify(keys),
							ai_col: jSQL.tables[tbl].auto_inc_col
						});
					}
					for(var i=data.length; i--;){
						var row = data[i];
						for(var n in row){
							if(!row.hasOwnProperty(n)) continue;
							row[n] = jSQL.tables[tbl].normalizeColumnStoreValue(n, row[n]);
						}
						rows.push({
							table: tbl, 
							data: JSON.stringify(row), 
							colTypes: JSON.stringify(jSQL.tables[tbl].types), 
							keys: JSON.stringify(keys),
							ai_col: jSQL.tables[tbl].auto_inc_col
						});
					}
				}
				self.api.delete("jSQL_data_schema", function(){
					self.api.insert("jSQL_data_schema", rows, callback);
				});
			};

			self.load = function(LoadCallback){
				if("function" !== typeof LoadCallback) LoadCallback = function(){};
				self.loadingCallbacks.push(LoadCallback);

				if(self.loaded)
					while(self.loadingCallbacks.length) 
						self.loadingCallbacks.shift()();

				if(self.isLoading) return;
				self.isLoading = true;

				if(!self.initiated){
					self.init(function(){
						self.rollback(function(){
							self.isLoading = false;
							self.loaded = true;
							while(self.loadingCallbacks.length) 
								self.loadingCallbacks.shift()();
						});
					});
				}else{
					self.rollback(function(){
						self.isLoading = false;
						self.loaded = true;
						while(self.loadingCallbacks.length) 
							self.loadingCallbacks.shift()();
					});
				}
				
			};

			self.rollback = function(LoadCallback){
				if("function" !== typeof LoadCallback) LoadCallback = function(){};

				// Wait for the schema to be set up
				mute_jsql_errors = true;
				(function waitForSchema(tries){
					try{
						self.api.select("jSQL_data_schema", function(r){
							jSQL.tables = {};
							if(r.length === 0){
								mute_jsql_errors = false;
								LoadCallback();
								return;
							}
							for(var i=r.length; i--;){
								var tablename = r[i].table;
								var rowdata = JSON.parse(r[i].data);
								var colTypes = JSON.parse(r[i].colTypes);
								var keys = JSON.parse(r[i].keys);
								var ai_col = r[i].ai_col;
										
								// Create the table in memory if it doesn't exist yet
								if(undefined === jSQL.tables[tablename]){
									if(Array.isArray(rowdata)){
										cols = rowdata;
										jSQL.createTable(tablename, cols, colTypes, keys, ai_col).execute();
									}else{
										var cols = [];
										for(var c in rowdata)
											if(rowdata.hasOwnProperty(c))
												cols.push(c);
										jSQL.createTable(tablename, cols, colTypes, keys, ai_col).execute();
									}
								}
								
								// If it's an array it's just column names and the table is empty
								// So, only do this if the rowdata is actually a rowdata object
								if(!Array.isArray(rowdata)){
									for(var c in rowdata){
										if(!rowdata.hasOwnProperty(c)) continue;
										rowdata[c] = jSQL.tables[tablename].normalizeColumnFetchValue(c, rowdata[c]);
									}
									jSQL.tables[tablename].insertRow(rowdata);
								}
							}

							mute_jsql_errors = false;
							LoadCallback();
							return;
						});
					}catch(e){
						if(tries > 500){
							mute_jsql_errors = false;
							self.isLoading = false;
							self.loaded = true;
							while(self.loadingCallbacks.length) 
								self.loadingCallbacks.shift()();
							return;
						}
						else setTimeout(function(){waitForSchema(tries+1);}, 10);
					}

				})(0);
			};

			// Initiate the database
			self.init = function(successCallback){
				if("function" !== typeof successCallback) successCallback = function(){};
				self.initiated = true;
				if(isNode){
					self.api = new API.nodeAPI();
					self.api.init([{name: "jSQL_data_schema", rows:[]}], successCallback);
				}else{
					var priority = self.api_user_priority.concat(self.api_default_priority);
					var tried = [], APIIsSet = false;
					
					(function loop(i){
						if(i>=priority.length){
							if(!APIIsSet) return _throw(new jSQL_Error("0063"));
						}
						if(self.api_default_priority.indexOf(priority[i]) === -1) return loop(1+i);
						if(tried.indexOf(priority[i]) > -1) return loop(1+i);
						
						try{
							self.api = new API[priority[i]]();
							self.api.init([{name: "jSQL_data_schema", rows:[]}], successCallback);
							APIIsSet = true;
						}catch(ex){
							APIIsSet = false;
						}
						if(!APIIsSet) loop(1+i);
					})(0);
					
				}
			};

		})();