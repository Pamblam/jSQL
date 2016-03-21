/**
 * jSQL - javaScript Query Language
 * A Javascript based, user hosted database alternative (or accessory)
 * @author Robert Parham
 * @license - WTFPL v2 wtfpl.net
 */

;window.jSQL = (function(){
	"use strict";
	
	// Main table constructor
	function jSQLTable(name, columns, data){
		var self = this;	
		self.name = "";		// Table name
		self.columns = [];	// Array of column names
		self.data = [];		// Array of arrays
		self.colmap = {};	// Colmap

		// Create the table and load the data, if there is any
		self.init = function(name, columns, data){
			self.name = name;

			// If first param is array, no third param
			if(Array.isArray(columns) && undefined === data)
				// Create the data parameter from column param
				{data = columns; columns = [];}

			// If second param is array of objects
			// - Create table from first object
			// - Generate data (3rd) param
			if(Array.isArray(columns) && !Array.isArray(columns[0]) && typeof columns[0]=="object"){
				var cols = [];
				for(var name in columns[0])
					if(columns[0].hasOwnProperty(name))
						cols.push(name);
				data = columns;
				columns = cols;
			}

			// At this point, columns should be an array
			// - Double check and save it to the object
			if(!Array.isArray(columns)) throw "Columns must be an array.";
			self.columns = columns;

			// Create a column map
			for(var i=0; i<columns.length; i++) self.colmap[columns[i]] = i;

			// Load the data, if there is any
			if(data !== undefined) self.loadData(data);
		};
		
		self.renameColumn = function(oldname, newname){
			if(undefined === oldname || "string" != typeof newname) throw "renameColumn expects and old column name and a new one, both must be strings.";
			if(self.columns.indexOf(oldname) < 0) throw "The column "+oldname+" does not exist in this table.";
			self.columns.splice(self.columns.indexOf(oldname), 1, newname);
		};
		
		self.addColumn = function(name, defaultVal){
			if(undefined === defaultVal) defaultVal = null;
			if('string' != typeof name) name = (function r(n){
				for(var i=0; i<self.columns.length; i++)
					if(self.columns[i]=="u"+n) return r(n+1);
				return "u"+n;
			}(0));
			self.columns.push(name);
			var i=self.data.length; while(i--) self.data[i].push(defaultVal);
			self.colmap[name] =  self.columns.length -1;
		};

		// Load the dataset into the table
		self.loadData = function(data){

			// Dataset must be an Array
			if(!Array.isArray(data)) throw "Data must be an array.";

			// Loop columns and inset the data
			var i = data.length;
			var c  = self.columns.length;
			while(i--) self.insertRow(data[i]);
		};

		self.insertRow = function(data){
			var row = [];

			// If the row is an Array
			//	- Insert the data sequentially
			// If the row is an Object
			//	- Insert the rows into the columns specified by the property name
			// Fill in any missing columns in the dataset with null
			if(Array.isArray(data)){
				while(data.length > self.columns.length)
					self.addColumn();
				while(data.length < self.columns.length)
					data.push(null);
				for(var n=0; n<data.length; n++)
					row.push(data[n]);
				while(row.length < self.columns.length) row.push(null);
			}else if(typeof data == 'object'){
				
				// Loop each column of the table
				for(var n=0; n<self.columns.length; n++)
					// If the column doesn't exist in the data row..
					if(data[self.columns[n]] === undefined)
						// ..add an empty value for it in the data row
						data[self.columns[n]] = null;
				
				// Loop each column in the data row
				for(var colname in data)
					// If the data row column doesn't exist in the table..
					if(function(l){ while(l--) if(self.columns[l]==colname) return 0; return 1; }(self.columns.length)){
						// ...and there is already an undefined row title...
						if(self.columns.indexOf("u0") > -1){
							// ...let the undefined row inherit this title,
							self.renameColumn("u0", colname);
							// and shift the unknown column titles
							var i=1; while(self.columns.indexOf("u"+i)>-1)self.renameColumn("u"+i, "u"+(i-1));
						// ..otherwise, just add the column to the table.
						}else self.addColumn(colname);
					}
				
				for(var n=0; n<self.columns.length; n++)
					row.push(data[self.columns[n]]);
			}else throw "Data not structured properly.";
			self.data.push(row);
		};

		self.init(name, columns, data);
	}

	// Parse the query string and return the query object
	function jSQLParseQuery(query){

		// Remove excess whitespace, linebreaks
		query = query.replace(/(\r\n|\n|\r)/gm," ").replace(/ +(?= )/g,'').trim();
		
		// Break words into uppercase array
		var words = query.split(" ");
		
		// Remove surrounding quotes from a string
		var removeQuotes = function(str){
			var quotes = ['"', "'", "`"];
			for (var i = quotes.length; i--; )
				if (str.substr(0, 1) == quotes[i] && str.substr(str.length - 1, 1) == quotes[i])
					return str.substr(1, str.length - 2);
			return str;
		};
		
		switch(words.shift().toUpperCase()){
			case "INSERT": 
				var table, cols=[], values=[];
				
				// Next Word should be "INTO"
				if(words.shift().toUpperCase() !== "INTO") throw "Unintelligible query. Expected 'INTO'";
				
				// Next word should be the table name
				table = words.shift();
				if(undefined === jSQL.tables[table]) throw "Table "+table+" does not exist.";
				
				// Remove a few chars and re-split
				words = words.join(" ")
					.split("(").join(" ")
					.split(")").join(" ")
					.split(",").join(" ")
					.split("  ").join(" ").trim()
					.split(" ");
			
				var next = words.shift();
				while(words.length && next.toUpperCase() !== "VALUES"){
					cols.push(removeQuotes(next));
					next = words.shift();
				}
				
				if(next.toUpperCase() !== "VALUES") 
					throw "Unintelligible query. Expected 'VALUES' near '"+next+"'";
				
				while(words.length) values.push(removeQuotes(words.shift()));
				
				if(!cols.length){
					for(var i=0;  i<values.length; i++){
						if(undefined === jSQL.tables[table].columns[i]) throw "Error: too many values.";
						cols.push(jSQL.tables[table].columns[i]);
					}
				}
				
				if(values.length !== cols.length) throw "Error: Columns mismatch.";
				
				var data = {};
				for(var i=0; i<cols.length; i++){
					data[cols[i]] = values[i];
				}
				
				jSQL.tables[table].insertRow(data);
				
				// To keep things congruent with the other types of queries, 
				// let's return an object with some filler methods
				return new (function(){
					this.execute = function(){ return this; };
					this.fetch = function(){ return null; };
					this.fetchAll = function(){ return []; };
				})();
				
				break;
			case "CREATE": 
				var table, c, cols = [];
				// Next Word should be "TABLE"
				if(words.shift().toUpperCase() !== "TABLE") throw "Unintelligible query. Expected 'TABLE'";
				
				// Remove a few chars and re-split
				words = words.join(" ")
					.split("(").join(" ")
					.split(")").join(" ")
					.split(",").join(" ")
					.split("  ").join(" ").trim()
					.split(" ");
				
				// Check for "IF NOT EXISTS" clause
				table = removeQuotes(words.shift());				
				if(table.toUpperCase() === "IF"){
					if(words.shift().toUpperCase() !== "NOT") throw "Unintelligible query. Expected 'NOT'";
					if(words.shift().toUpperCase() !== "EXISTS") throw "Unintelligible query. Expected 'EXISTS'";
					table = removeQuotes(words.shift());
					if(jSQL.tables.hasOwnProperty(table)) return;
				} 
				
				// Get column names
				while(words.length > 0){
					cols.push(removeQuotes(words.shift()));
				}
				
				jSQL.createTable(table, cols, []);
				
				// To keep things congruent with the other types of queries, 
				// let's return an object with some filler methods
				return new (function(){
					this.execute = function(){ return this; };
					this.fetch = function(){ return null; };
					this.fetchAll = function(){ return []; };
				})();
				
				break;
			case "SELECT":
				var table, columns, query, orderColumns = [];
				var upperWords = query.toUpperCase().split(" "); upperWords.shift();
				var fromIndex = upperWords.indexOf("FROM");
				if(fromIndex < 0) throw "Unintelligible query. Expected 'FROM'";
				columns = words.splice(0, fromIndex);
				for(var i=columns.length; i--;)
					while(columns[i].indexOf(",") == columns[i].length-1)
						columns[i] = columns[i].substr(0, columns[i].length-1);
				words.shift(); // pop the FROM off
				table = words.shift();

				for(var name in jSQL.tables){
					if(!jSQL.tables.hasOwnProperty(name)) continue;
					if(name.toUpperCase() == removeQuotes(table.toUpperCase())){
						table = name;
						break;
					}
				}
				if(undefined === jSQL.tables[table]) 
					throw "Table: "+table+" does not exist.";

				// Predcit the correct casing for column and table names
				var convertToCol = function(c){
					for(var i=0; i<jSQL.tables[table].columns.length; i++)
						if(removeQuotes(c.toUpperCase()) == jSQL.tables[table].columns[i].toUpperCase())
							return jSQL.tables[table].columns[i];
					throw c+" column not found in "+table+" table";
				};

				if(columns.length == 1 && columns[0] == "*") columns = '*';
				else for(var i=0;i<columns.length;i++) columns[i] = convertToCol(columns[i]);

				// Generate the query object
				query = jSQL.select(columns).from(table);
				while(words.length){
					var piece = words.shift();
					switch(piece.toUpperCase()){
						case "WHERE":
						case "AND":
							query = query.where(convertToCol(words.shift()));
							break;
						case "=":
							query = query.equals(removeQuotes(words.shift()));
							break;
						case ">":
							query = query.greaterThan(removeQuotes(words.shift()));
							break;
						case "<":
							query = query.lessThan(removeQuotes(words.shift()));
							break;
						case "!=":
						case "<>":
							query = query.doesNotEqual(removeQuotes(words.shift()));
							break;
						case "LIKE":
							var substr = removeQuotes(words.shift());
							// "%text%" - Contains text
							if(substr.substr(0,1)=="%" && substr.substr(substr.length-1,1)=="%"){
								query = query.contains(substr.substr(1,substr.length-2));
							// "%text" - Ends with text
							}else if(substr.substr(0,1)=="%"){
								query = query.endsWith(substr.substr(1,substr.length-1));
							// "text%" - Begins with text
							}else if(substr.substr(substr.length-1,1)=="%"){
								query = query.beginsWith(substr.substr(0,substr.length-1));
							}else{
								// no "%" on either side. jSQL only supports % when 
								// the string begins or ends with it, so treat it like an equal
								query = query.equals(substr);
							}
							break;
						case "OR":
							query = query.or(convertToCol(words.shift()));
							break;
						case "LIMIT":
							query = query.limit(words.shift());
							break;
						case "ORDER":
							if(words.shift().toUpperCase() != "BY") throw "Expected 'ORDER BY', got something else.";
							while(words.length > 0){
								var nextWord = words.shift();
								try{
									// Remove the comma if there is one
									while(nextWord.indexOf(",") == nextWord.length-1)
										nextWord = nextWord.substr(0, nextWord.length-1);

									nextWord = convertToCol(nextWord);
									orderColumns.push(nextWord);
								}catch(e){
									words.unshift(nextWord); 
									break;
								}
							}
							query = query.orderBy(orderColumns);
							break;
						case "ASC":
							if(!orderColumns.length) throw "Must call ORDER BY before using ASC.";
							query = query.asc();
							break;
						case "DESC":
							if(!orderColumns.length) throw "Must call ORDER BY before using DESC.";
							query = query.desc();
							break;
						default: throw "Unintelligible query. Near: "+piece;
					}
				}
				return query;
				break;
			default:
				throw "Unintelligible query. Error near: "+words[0];
		}
	}

	// Insert data constructor
	function jSQLTableInsert(table){
		var self = this;
		self.table = table;
		self.values = function(data){
			if(undefined === jSQL.tables[table])
				throw "Table: "+self.table+" doesn't exist.";
			jSQL.tables[table].insertRow(data);
			return true;
		};
	}

	// Select query constructor
	function jSQLBuildSelectQuery(columns){
		var self = this;
		self.columns = columns;
		self.from = function(table){
			if(undefined === jSQL.tables[table])
				throw "Table: "+table+" doesn't exist.";
			return new jSQLTableSelect(jSQL.tables[table], self.columns);
		};
	}

	// Builds and executes the select query
	function jSQLTableSelect(table, columns){
		var self = this;
		self.table = null;
		self.columns = [];
		self.pendingColumn = "";
		self.conditions = [];
		self.LIMIT = 0;
		self.finalConditions = [];
		self.sortColumn = [];
		self.sortDirection = "ASC";
		self.resultSet = [];

		self.init = function(table, columns){
			self.table = table;
			if(typeof columns == 'string') columns = [columns];
			if(!Array.isArray(columns)) throw "Select requires a string or an array of column names.";
			if(columns[0] == "*") columns = self.table.columns;
			for(var i=0; i<columns.length; i++){
				if(self.table.columns.indexOf(columns[i]) < 0) throw "There is no "+columns[i]+" column in the "+self.table.name+" table.";
				else self.columns.push(columns[i]);
			}
		};

		self.where = function(column){
			if(self.pendingColumn !== "") throw "Must add a conditional before adding another 'Where' condition.";
			if('string' != typeof column) throw "Column name must be a string.";
			if(self.table.columns.indexOf(column) < 0) throw "There is no "+column+" column in the "+self.table.name+" table.";
			self.pendingColumn = column;
			return self;
		};

		self.equals = function(value){
			if(self.pendingColumn == "") throw "Must add a 'where' clause before the 'equals' call.";
			self.conditions.push({col: self.pendingColumn, type: '=', value: value});
			self.pendingColumn = "";
			return self;
		};

		self.doesNotEqual = function(value){
			if(self.pendingColumn == "") throw "Must add a 'where' clause before the 'doesNotEqual' call.";
			self.conditions.push({col: self.pendingColumn, type: '!=', value: value});
			self.pendingColumn = "";
			return self;
		};

		self.lessThan = function(value){
			if(self.pendingColumn == "") throw "Must add a 'where' clause before the 'lessThan' call.";
			self.conditions.push({col: self.pendingColumn, type: '<', value: value});
			self.pendingColumn = "";
			return self;
		};
		
		self.greaterThan = function(value){
			if(self.pendingColumn == "") throw "Must add a 'where' clause before the 'greaterThan' call.";
			self.conditions.push({col: self.pendingColumn, type: '>', value: value});
			self.pendingColumn = "";
			return self;
		};
		
		self.contains = function(value){
			if(self.pendingColumn == "") throw "Must add a 'where' clause before the 'contains' call.";
			self.conditions.push({col: self.pendingColumn, type: '%%', value: value});
			self.pendingColumn = "";
			return self;
		};
		
		self.endsWith = function(value){
			if(self.pendingColumn == "") throw "Must add a 'where' clause before the 'endsWith' call.";
			self.conditions.push({col: self.pendingColumn, type: '%-', value: value});
			self.pendingColumn = "";
			return self;
		};
		
		self.beginsWith = function(value){
			if(self.pendingColumn == "") throw "Must add a 'where' clause before the 'beginsWith' call.";
			self.conditions.push({col: self.pendingColumn, type: '-%', value: value});
			self.pendingColumn = "";
			return self;
		},
		
		self.and = function(column){ return self.where(column); };

		self.or = function(column){
			self.finalConditions.push(self.conditions);
			self.conditions = [];
			return self.where(column);
		};

		self.limit = function(limit){
			self.LIMIT = parseInt(limit);
			return self;
		};

		self.orderBy = function(columns){
			if(!Array.isArray(columns)) columns = [columns];
			for(var i=columns.length; i--;)
				if(self.table.columns.indexOf(columns[i]) < 0) throw "There is no "+columns[i]+" column in the "+self.table.name+" table.";
			self.sortColumn = columns;
			return self;
		};

		self.asc = function(){
			if('' == self.sortColumn) throw "Must use orderBy clause before using ASC";
			self.sortDirection = "ASC";
			return self;
		};

		self.desc = function(){
			if('' == self.sortColumn) throw "Must use orderBy clause before using DESC";
			self.sortDirection = "DESC";
			return self;
		};

		self.execute = function(){
			var results = [];
			if(self.conditions.length > 0) self.finalConditions.push(self.conditions);
			for(var i=0; i<self.table.data.length; i++){
				if(self.LIMIT > 0 && results.length == self.LIMIT) break;
				// LOOPING ROWS
				if(self.finalConditions.length < 1){
					// IF THERE ARE NO CONDITIONS, ADD ROW TO RESULT SET
					var row = {};
					for(var n=0; n<self.columns.length; n++){
						row[self.columns[n]] = self.table.data[i][n];
					}
					results.push(row);
				}else{
					var addToResults = false;
					var x = self.finalConditions.length;
					while(x--){
						// LOOP THROUGH CONDITION SETS
						var conditions = self.finalConditions[x];
						var safeCondition = true;
						var ii = conditions.length;
						while(ii--){
							// LOOP THROUGH EACH CONDITION IN THE SET
							var condition = conditions[ii];
							switch(condition.type){
								case ">": 
									if(isNaN(parseFloat(self.table.data[i][self.table.colmap[condition.col]])) || self.table.data[i][self.table.colmap[condition.col]] < condition.value)
										safeCondition = false;
									break;
								case "<": 
									if(isNaN(parseFloat(self.table.data[i][self.table.colmap[condition.col]])) || self.table.data[i][self.table.colmap[condition.col]] > condition.value)
										safeCondition = false;
									break;
								case "=": 
									if(self.table.data[i][self.table.colmap[condition.col]] != condition.value)
										safeCondition = false;
									break;
								case "!=": break;
									if(self.table.data[i][self.table.colmap[condition.col]] == condition.value)
										safeCondition = false;
									break;
								case "%%": 
									if(self.table.data[i][self.table.colmap[condition.col]].indexOf(condition.value) < 0)
										safeCondition = false;
									break;
								case "%-": 
									if(self.table.data[i][self.table.colmap[condition.col]].indexOf(condition.value) != self.table.data[i][self.table.colmap[condition.col]].length - condition.value.length)
										safeCondition = false;
									break;
								case "-%": 
									if(self.table.data[i][self.table.colmap[condition.col]].indexOf(condition.value) != 0)
										safeCondition = false;
									break;
							}
							if(!safeCondition) break;
						}
						if(safeCondition){
							addToResults = true;
							break;
						}
					}
					if(addToResults){
						var row = {};
						for(var n=0; n<self.columns.length; n++){
							row[self.columns[n]] = self.table.data[i][n];
						}
						results.push(row);
					}
				}
			}
			if(self.sortColumn.length > 0){
				results.sort(function(a, b){

					return (function srrrrt(i){
						if(undefined === self.sortColumn[i]) return 0;
						if(a[self.sortColumn[i]] < b[self.sortColumn[i]]) return -1;
						if(a[self.sortColumn[i]] > b[self.sortColumn[i]]) return 1;
						return srrrrt(i+1);
					}(0));

				});
				if(self.sortDirection == "DESC") results.reverse();
			}
			self.resultSet = results;
			return self;
		};


		self.fetch = function(Mode){
			if(undefined === Mode) Mode = "ASSOC";
			Mode = Mode.toUpperCase();
			if(Mode !== "ASSOC" && Mode !== "ARRAY") throw "Fetch expects paramter one to be 'ASSOC', 'ARRAY', or blank";
			if(!self.resultSet.length) return false;
			var row = self.resultSet.shift();
			if(Mode == "ARRAY"){
				var r = [];
				for(var name in row) if(row.hasOwnProperty(name)) r.push(row[name]);
				row = r;
			}
			return row;
		};

		self.fetchAll = function(Mode){
			if(undefined === Mode) Mode = "ASSOC";
			Mode = Mode.toUpperCase();
			if(Mode !== "ASSOC" && Mode !== "ARRAY") throw "Fetch expects paramter one to be 'ASSOC', 'ARRAY', or blank";
			if(!self.resultSet.length) return false;

			var res = [];
			while(self.resultSet.length > 0){
				res.push(self.fetch(Mode));
			}

			return res;
		};

		self.init(table, columns);
	}

	function createTable(name, columns, data){
		window.jSQL.tables[name] = new jSQLTable(name, columns, data);
		return true;
	}
	
	function select(cols){
		return new jSQLBuildSelectQuery(cols);
	}
	
	function insertInto(tablename){
		return new jSQLTableInsert(tablename);
	}
	
	function WebSQLAPI() {
		var self = this;
		self.db = null;

		// private function to execute a query
		var __runQuery = function(query, data, successCallback, failureCallback) {
			if(typeof successCallback != "function") successCallback = function(){};
			if(typeof failureCallback != "function") failureCallback = function(){ throw "Could not execute query: "+query; };

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
				}catch(e){ throw "Error creating table"; }
			};

			try {
				var dbname = window.location.href.replace(/\W+/g, ""); // use the current url to keep it unique
				self.db = openDatabase("jSQL_"+dbname, "1.0", "jSQL "+dbname, (5 * 1024 * 1024));
			} catch(e){ throw "Error opening database"; }

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
	
	function indexedDBAPI() {
		var self = this;
		self.db = null;
		var indexedDB, IDBTransaction, IDBKeyRange;

		// Check that datastores exist.
		// If not, create and populate them.
		self.init = function(modelData, successCallback){
			if("function" !== typeof successCallback) successCallback = function(){};

			try {
				indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
				IDBTransaction = window.hasOwnProperty('webkitIndexedDB') ? window.webkitIDBTransaction : window.IDBTransaction;
				IDBKeyRange = window.hasOwnProperty('webkitIndexedDB') ? window.webkitIDBKeyRange : window.IDBKeyRange;
			} catch (e) {
				throw "indexedDB is not supported in this browser";
			}

			if (!indexedDB)
				throw "indexedDB is not supported in this browser";

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
							throw "Could not add data after 10 seconds.";
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
						throw "Error updating datastore version";
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
				throw "Could not connect to the indexedDB datastore.";
			};
		};

		// Insert a group of rows
		self.insert = function(model, data, successCallback) {
			if(typeof successCallback !== "function") successCallback = function(){};
			var transaction = self.db.transaction([model], IDBTransaction.READ_WRITE || 'readwrite');
			var store, i, request;
			var total = data.length;

			var successCallbackInner = function() {
				total = total - 1;
				if (total === 0) successCallback(total);
			};

			transaction.onerror = function(){ throw "Could not initiate a transaction"; };;
			store = transaction.objectStore(model);
			for (i in data) {
				if (data.hasOwnProperty(i)) {
					request = store.add(data[i]);
					request.onsuccess = successCallbackInner;
					request.onerror = function(){ throw "Could not initiate a request"; };;
				}
			}
		};

		// Delete all items from the database
		self.delete = function(model, successCallback) {
			if(typeof successCallback != "function") successCallback = function(){};
			var transaction = self.db.transaction([model], IDBTransaction.READ_WRITE || 'readwrite'), store, request;
			transaction.onerror = function(){ throw "Could not initiate a transaction"; };;
			store = transaction.objectStore(model);
			request = store.clear();
			request.onerror = function(){ throw "Could not initiate a request"; };;
			request.onsuccess = successCallback;
		};

		// Get all data from the datastore
		self.select = function(model, successCallback) {
			if("function" !== typeof successCallback) successCallback = function(){};
			var transaction = self.db.transaction([model], IDBTransaction.READ_ONLY || 'readonly'), store, request, results = [];
			transaction.onerror = function(){ throw "Could not initiate a transaction"; };;
			store = transaction.objectStore(model);
			request = store.openCursor();
			request.onerror = function(){ throw "Could not initiate a request"; };
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
	}
	
	var persistenceManager = new (function(){
		var self = this;
		self.api = null;
		self.error = false;
		
		self.persist = function(callback){
			if("function" === typeof callback) callback = function(){};
			if(self.error!==false) throw self.error;
			var rows = [];
			for(var tbl in jSQL.tables){
				if(!jSQL.tables.hasOwnProperty(tbl)) continue;
				var data = jSQL.select("*").from(tbl).execute().fetchAll();
				for(var i=data.length; i--;){
					var row = data[i];
					for(var n in row){
						if(!row.hasOwnProperty(n)) continue;
						if("function" === typeof row[n])
							row[n] = "#jSQLFunct#"+(row[n].toString());
					}
					rows.push({table: tbl, data:JSON.stringify(row)});
				}
			}
			self.api.delete("jSQL_data_schema", function(){
				self.api.insert("jSQL_data_schema", rows, callback);
			});
		};
		
		self.load = function(LoadCallback){	
			if("function" !== typeof LoadCallback) LoadCallback = function(){};
			// Wait for the schema to be set up
			(function waitForSchema(tries){
				try{
					self.api.select("jSQL_data_schema", function(r){
						jSQL.tables = {};
						if(r.length === 0) return LoadCallback();
						for(var i=r.length; i--;){
							var tablename = r[i].table;
							var rowdata = JSON.parse(r[i].data);
							// Create the table in memory if it doesn't exist yet
							if(undefined === jSQL.tables[tablename]){
								var cols = [];
								for(var c in rowdata)
									if(rowdata.hasOwnProperty(c))
										cols.push(c);
								jSQL.createTable(tablename, cols, []);
							}
							// Check for and parse functions
							for(var c in rowdata){
								if(rowdata.hasOwnProperty(c))
									if("string" == typeof rowdata[c] && rowdata[c].indexOf("#jSQLFunct#")===0)
										rowdata[c] = exec(rowdata[c].substr(11));
							}
							jSQL.tables[tablename].insertRow(rowdata);
						}
						return LoadCallback();
					});
				
				}catch(e){
					if(tries > 500) return LoadCallback();
					else setTimeout(function(){waitForSchema(tries+1);}, 10);
				}
				
			})(0);
		};
		
		// Initialize the database
		(function init(){
			try{
				self.api = new indexedDBAPI();
				self.api.init([{name: "jSQL_data_schema", rows:[]}]);
			}catch(e){
				try{
					self.api = new WebSQLAPI();
					self.api.init([{name: "jSQL_data_schema", rows:[]}]);
				}catch(ex){
					self.error = "Browser doesn't support Web SQL or IndexedDB";
				}
			}
		})();
	})();
	
	return {
		tables: {},
		query: jSQLParseQuery,
		createTable: createTable,
		select: select,
		insertInto: insertInto,
		persist: persistenceManager.persist,
		load: persistenceManager.load
	};
	
}());
