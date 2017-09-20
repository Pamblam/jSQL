/**
 * jSQL.js v2.81
 * A Javascript Query Language Database Engine
 * @author Robert Parham
 * @website http://pamblam.github.io/jSQL/
 * @license http://www.apache.org/licenses/LICENSE-2.0
 */

;(function(){
	var isNode = !!(typeof module !== 'undefined' && module.exports);
	var jSQL = (function(){
		"use strict";

		////////////////////////////////////////////////////////////////////////////
		// jSQL Error Handling /////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////

		function jSQL_Error(error_no) {
			this.error = error_no;
			this.stack = undefined;
			var e = new Error();
			if(e.stack) this.stack = e.stack;
			switch(error_no){
				case "0001": this.message = "Corrupted function stored in data."; break;
				case "0002": this.message = "Attempted to apply a non-function as an error handler."; break;
				case "0003": this.message = "Invalid datatype definition."; break;
				case "0004": this.message = "DataType must have a `type` property."; break;
				case "0005": this.message = "DataType must have a `serialize` function."; break;
				case "0006": this.message = "DataType must have an `unserialize` function."; break;
				case "0007": this.message = "Unsupported data type."; break;
				case "0008": this.message = "Invalid table types array."; break;
				case "0009": this.message = "Unable to convert columns to array."; break;
				case "0010": this.message = "Invalid constraint."; break;
				case "0011": this.message = "This table already has a primary key."; break;
				case "0012": this.message = "renameColumn expects and old column name and a new one, both must be strings."; break;
				case "0013": this.message = "Column does not exist."; break;
				case "0014": this.message = "Data must be an array."; break;
				case "0015": this.message = "Data not structured properly."; break;
				case "0016": this.message = "Cannot insert a null value in a primary column."; break;
				case "0017": this.message = "Primary Key violated."; break;
				case "0018": this.message = "Cannot insert a null value in a unique column."; break;
				case "0019": this.message = "Unique key violated."; break;
				case "0020": this.message = "Data type's serialize() method did not return a string."; break;
				case "0021": this.message = "Table does not exist."; break;
				case "0022": this.message = "Method does not apply to query type."; break;
				case "0023": this.message = "Fetch expects paramter one to be 'ASSOC', 'ARRAY', or undefined."; break;
				case "0024": this.message = "Expected number or quoted string."; break;
				case "0025": this.message = "Expected 'ORDER BY'."; break;
				case "0026": this.message = "Must call ORDER BY before using ASC."; break;
				case "0027": this.message = "Must call ORDER BY before using DESC."; break;
				case "0028": this.message = "Unintelligible query. Expected 'FROM'."; break;
				case "0029": this.message = "Unintelligible query. Expected 'TABLE'."; break;
				case "0030": this.message = "Unintelligible query. Expected 'INTO'."; break;
				case "0031": this.message = "Unintelligible query. Expected 'VALUES'."; break;
				case "0032": this.message = "Unintelligible query. Too many values."; break;
				case "0033": this.message = "Unintelligible query. Columns mismatch."; break;
				case "0034": this.message = "Invalid Column definition."; break;
				case "0035": this.message = "Unintelligible query. Expected 'NOT'."; break;
				case "0036": this.message = "Unintelligible query. Expected 'EXISTS'."; break;
				case "0037": this.message = "Unintelligible query. expected ')'."; break;
				case "0038": this.message = "Invalid Arg definition."; break;
				case "0039": this.message = "Unintelligible query. Expected 'SET'."; break;
				case "0040": this.message = "Unintelligible query. Expected 'FROM'."; break;
				case "0041": this.message = "Unintelligible query. WTF?"; break;
				case "0042": this.message = "Must add a conditional before adding another 'Where' condition."; break;
				case "0043": this.message = "Column name must be a string."; break;
				case "0044": this.message = "Must add a 'where' clause before the 'equals' call."; break;
				case "0045": this.message = "Must add a 'where' clause before the 'preparedLike' call."; break;
				case "0046": this.message = "Must add a 'where' clause before the 'doesNotEqual' call."; break;
				case "0047": this.message = "Must add a 'where' clause before the 'lessThan' call."; break;
				case "0048": this.message = "Must add a 'where' clause before the 'greaterThan' call."; break;
				case "0049": this.message = "Must add a 'where' clause before the 'contains' call."; break;
				case "0050": this.message = "Must add a 'where' clause before the 'endsWith' call."; break;
				case "0051": this.message = "Must add a 'where' clause before the 'beginsWith' call."; break;
				case "0052": this.message = "Must use orderBy clause before using ASC."; break;
				case "0053": this.message = "Must use orderBy clause before using DESC."; break;
				case "0054": this.message = "Could not execute query."; break;
				case "0055": this.message = "Error creating table."; break;
				case "0056": this.message = "Error opening database."; break;
				case "0057": this.message = "indexedDB is not supported in this browser."; break;
				case "0058": this.message = "Could not add data after 10 seconds."; break;
				case "0059": this.message = "Error updating datastore version."; break;
				case "0060": this.message = "Could not connect to the indexedDB datastore."; break;
				case "0061": this.message = "Could not initiate a transaction."; break;
				case "0062": this.message = "Could not initiate a request."; break;
				case "0063": this.message = "Browser doesn't support Web SQL or IndexedDB."; break;
				case "0064": this.message = "Unable towrite to datastore file."; break;
				case "0065": this.message = "AUTO_INCREMENT column must be a key."; break;
				case "0066": this.message = "AUTO_INCREMENT column must be an INT type."; break;
				default: this.message = "Unknown error."; break;
			}
			this.toString = function () {
				if(undefined === this.error) return "jSQL Error - "+this.message;
				return "jSQL Error #"+this.error+" - "+this.message;
			};
		}

		var error_handler_function = function(){};
		var mute_jsql_errors = false;
		function _throw(e, skip){
			if(skip !== true && mute_jsql_errors !== true) error_handler_function(e);
			throw e;
		};

		function onError(funct){
			if(typeof funct === "function") error_handler_function = funct;
		}

		////////////////////////////////////////////////////////////////////////////
		// jSQLDataTypeList ////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////

		function jSQLDataTypeList(){
			this.list = [{
				type: "NUMERIC",
				aliases: ["NUMBER", "DECIMAL", "FLOAT"],
				serialize: function(value, args){
					return !isNaN(parseFloat(value)) && isFinite(value) ?
						parseFloat(value) : 0;
				},
				unserialize: function(value, args){
					return !isNaN(parseFloat(value)) && isFinite(value) ?
							parseFloat(value) : 0;
				}
			},{
				type: "JSON",
				aliases: ["ARRAY","OBJECT"],
				serialize: function(value, args){
					return JSON.stringify(value);
				},
				unserialize: function(value, args){
					return JSON.parse(value);
				}
			},{
				type: "FUNCTION",
				serialize: function(value, args){
					if(typeof value !== "function") value=function(){};
						return "jSQLFunct-"+value.toString();
				},
				unserialize: function(value, args){
					var p = value.split("-");
					if(p.shift() !== "jSQLFunct") return _throw(new jSQL_Error("0001"));
					p = value.split("-");
					p.shift();
					var f = null;
					try{
						eval("f = "+p.join("-"));
					}catch(e){};
					if("function" === typeof f) return f;
					return _throw(new jSQL_Error("0001"));
				}
			},{
				type: "BOOLEAN",
				aliases: ['BOOL'],
				serialize: function(value, args){ return !!value; },
				unserialize: function(value, args){ return !!value; }
			},{
				type: "INT",
				serialize: function(value, args){ 
					return !isNaN(parseInt(value)) && isFinite(value) ?
						parseInt(value) : 0; 
				},
				unserialize: function(value, args){ 
					return !isNaN(parseInt(value)) && isFinite(value) ?
						parseInt(value) : 0; 
				}
			},{
				type: "CHAR",
				aliases: ["VARCHAR", "LONGTEXT", "MEDIUMTEXT"],
				serialize: function(value, args){ return ""+value; },
				unserialize: function(value, args){ return ""+value; }
			},{
				type: "DATE",
				serialize: function(value, args){ 
					if(!value instanceof Date) return new Date(0).getTime();
					return value.getTime(); 
				},
				unserialize: function(value, args){ 
					return new Date(value);
				}
			},{
				type: "AMBI",
				serialize: function(value, args){ 
					if(value instanceof Date) return value.getTime();
					if(typeof value === "function") return "jSQLFunct-"+value.toString();
					if(!isNaN(parseFloat(value)) && isFinite(value)) return value;
					return ""+value;
				},
				unserialize: function(value, args){ 
					if(typeof value === "string"){ 
						if(value.split("-")[0] === "jSQLFunct"){
							var p = value.split("-");
							p.shift();
							var f = null;
							try{
								eval("f = "+p.join("-"));
							}catch(e){};
							if("function" === typeof f) return f;
						}
					}
					return value;
				}
			}];
			this.add = function(type){
				if(typeof type !== "object") return _throw(new jSQL_Error("0003"));
				if(undefined === type.type) return _throw(new jSQL_Error("0004"));
				if("function" !== typeof type.serialize) return _throw(new jSQL_Error("0005"));
				if("function" !== typeof type.unserialize) return _throw(new jSQL_Error("0006"));
				this.list.push({
					type: type.type.toUpperCase(),
					aliases: Array.isArray(type.aliases) ? type.aliases : [],
					serialize: type.serialize,
					unserialize: type.unserialize
				});
			};
			this.exists = function(type){
				type = type.toUpperCase();
				for(var i=this.list.length;i--;)
					if(this.list[i].type===type || 
						(this.list[i].aliases !== undefined && this.list[i].aliases.indexOf(type) > -1)) 
						return true;
				return false;
			};
			this.getByType = function(type){
				type = type.toUpperCase();
				for(var i=this.list.length;i--;)
					if(this.list[i].type===type || 
						(this.list[i].aliases !== undefined && this.list[i].aliases.indexOf(type) > -1)) 
						return this.list[i];
				return _throw(new jSQL_Error("0007"));
			};
		}

		////////////////////////////////////////////////////////////////////////////
		// jSQL Table constructor //////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////

		function jSQLTable(name, columns, data, types, keys, auto_increment){
			var self = this;	
			self.name = "";				// Table name
			self.columns = [];			// Array of column names
			self.data = [];				// Array of arrays
			self.colmap = {};			// Colmap
			self.types = [];			// array of data types for each column [{type:"",args:[]}..]
			self.auto_inc_col = false;	// If there's an auto_increment column, it's name
			self.auto_inc_seq = 0;		// The next value in the auto increment sequence

			// List of column keys on the table
			self.keys = {
				primary: {column: false, map: {}},
				unique: []
			};

			// Create the table and load the data, if there is any
			self.init = function(name, columns, data, types, keys, auto_increment){
				self.name = name;

				// If the types array does not exist, create it
				if(undefined === types) types = [];
				if(!Array.isArray(types)) return _throw(new jSQL_Error("0008"));

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
				if(!Array.isArray(columns)) return _throw(new jSQL_Error("0009"));
				self.columns = columns;

				// Fill any missing holes in the types array 
				// with "ambi" which means it can be any type
				for(var i=0; i<columns.length; i++)
					self.types[i] = undefined === types[i] || undefined === types[i].type ? 
						{type:"ambi", args:[]} : types[i];

				// Validate & normalize each type
				for(var i=self.types.length; i--;){
					var type = self.types[i].type.toUpperCase();
					if(!jSQL.types.exists(type))
						return _throw(new jSQL_Error("0007"));
					self.types[i].type = type;
				}

				// Create a column map
				for(var i=0; i<columns.length; i++) self.colmap[columns[i]] = i;

				// Set up keys if key data is provided
				var key;
				var keyTypes = ["primary", "unique"];
				for(var k=0; key=keys[k]; k++){
					if(!key.hasOwnProperty("column") || (!Array.isArray(key.column) && self.columns.indexOf(key.column) === -1)) return _throw(new jSQL_Error("0010"));
					if(Array.isArray(key.column)){
						for(var kk=0; kk<key.column.length; kk++){
							if(self.columns.indexOf(key.column[kk]) === -1) return _throw(new jSQL_Error("0010"));
						}
					}
					var type = key.hasOwnProperty('type') && keyTypes.indexOf(key.type.toLowerCase()) !== -1 ? key.type.toLowerCase() : "unique";
					if(type == "primary" && self.keys.primary.column !== false) return _throw(new jSQL_Error("0011"));
					if(type == "primary") self.keys.primary.column = key.column;
					if(type == "unique") self.keys.unique.push({column:key.column, map:{}});
				}

				// if there's an AI column
				if(auto_increment){
					var isInPKArray = Array.isArray(self.keys.primary.column) && self.keys.primary.column.indexOf(auto_increment) > -1;
					var isPK = self.keys.primary.column === auto_increment;
					var isInUKArrayArray = false;
					for(var i=self.keys.unique.length; i--;){
						var isInUKArray = Array.isArray(self.keys.unique[i].column) && self.keys.unique[i].column.indexOf(auto_increment) > -1;
						var isUK = self.keys.unique[i].column === auto_increment;
						if(isInUKArray || isUK) isInUKArrayArray = true;
					}
					if(isInPKArray || isPK || isInUKArrayArray){
						if(self.types[self.colmap[auto_increment]].type !== "INT") return _throw(new jSQL_Error("0066"));
						self.auto_inc_col = auto_increment;
					}else return _throw(new jSQL_Error("0065"));
				}

				// Load the data, if there is any
				if(data !== undefined) self.loadData(data);
			};

			self.renameColumn = function(oldname, newname){
				if(undefined === oldname || "string" != typeof newname) return _throw(new jSQL_Error("0012"));
				if(self.columns.indexOf(oldname) < 0) return _throw(new jSQL_Error("0013"));
				// Update the columns
				self.columns.splice(self.columns.indexOf(oldname), 1, newname);
				// Update the primary keys
				if(self.keys.primary.column === oldname) self.keys.primary.column = newname;
				if(Array.isArray(self.keys.primary.column))
					for(var i=self.keys.primary.column.length; i--;)
						if(self.keys.primary.column[i] === oldname) self.keys.primary.column[i] = newname;
				// Update the unique keys
				for(var n=self.keys.unique.length; n--;){
					if(self.keys.unique[n].column === oldname) self.keys.unique[n].column = newname;
					if(Array.isArray(self.keys.unique[n].column))
						for(var i=self.keys.unique[n].column.length; i--;)
							if(self.keys.unique[n].column[i] === oldname) self.keys.unique[n].column[i] = newname;
				}
				// Update colmap
				var colmap = {};
				for(var col in self.colmap)
					if(self.colmap.hasOwnProperty(col))
						if(col === oldname) colmap[newname] = self.colmap[col];
						else colmap[col] = self.colmap[col];
				self.colmap = colmap;
				// Update the AI column
				if(self.auto_inc_col === oldname) self.auto_inc_col = newname;
			};

			self.addColumn = function(name, defaultVal, type){
				if(undefined === type || undefined === type.type)
					type = {type:"AMBI",args:[]};
				type.type = type.type.toUpperCase();
				if(undefined === defaultVal) defaultVal = null;
				if('string' != typeof name) name = (function r(n){
					for(var i=0; i<self.columns.length; i++)
						if(self.columns[i]=="u"+n) return r(n+1);
					return "u"+n;
				}(0));
				self.columns.push(name);
				var i=self.data.length; while(i--) self.data[i].push(defaultVal);
				self.colmap[name] = self.columns.length -1;
				if(!jSQL.types.exists(type.type))
					return _throw(new jSQL_Error("0007"));
				self.types.push(type);
			};

			// Load the dataset into the table
			self.loadData = function(data){

				// Dataset must be an Array of rows
				if(!Array.isArray(data)) return _throw(new jSQL_Error("0014"));

				// Loop columns and insert the data
				var i = data.length;
				while(i--) self.insertRow(data[i]);
			};

			self.insertRow = function(data, ignore){
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
						if(!data.hasOwnProperty(colname)) continue;

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
				}else return _throw(new jSQL_Error("0015"));

				// validate & cast each row type
				for(var i=row.length; i--;){
					// If it's the auto increment column and it's zero or undefined, update it
					if(self.columns[i] === self.auto_inc_col){
						if(!row[i]){
							row[i] = self.auto_inc_seq;
							self.auto_inc_seq++;
						}
						if(row[i] >= self.auto_inc_seq) self.auto_inc_seq = row[i]+1;
					}
					row[i] = self.normalizeColumnStoreValue(self.columns[i], row[i]);
				}
				
				// Make sure the primary key(s) is/are not violated
				// There can only be one primary key, but if it's an array it
				// is treated as a compound key
				if(self.keys.primary.column){ 
					var primary_key_columns = Array.isArray(self.keys.primary.column) ? self.keys.primary.column : [self.keys.primary.column];
					var pk_col, pk_vals = [];
					for(var pk=0; pk_col=primary_key_columns[pk]; pk++){
						var primary_index = self.colmap[pk_col];
						if(null === row[primary_index]){
							if(ignore === true) return;
							return _throw(new jSQL_Error("0016"));
						}
						pk_vals.push(row[primary_index]);
					}
					pk_vals = JSON.stringify(pk_vals);
					if(self.keys.primary.map.hasOwnProperty(pk_vals)){
						if(ignore === true) return;
						return _throw(new jSQL_Error("0017"));
					}
					self.keys.primary.map[pk_vals] = self.data.length;
				}

				// Check the unique keys, There may be multiple and they may be compound
				for(var k=0, ukey; ukey=self.keys.unique[k]; k++){
					var key_columns = Array.isArray(ukey.column) ? ukey.column : [ukey.column];
					var col, vals = [];
					for(var uk=0; col=key_columns[uk]; uk++){
						var index = self.colmap[col];
						if(null === row[index]){
							if(ignore === true) return;
							return _throw(new jSQL_Error("0018"));
						}
						vals.push(row[index]);
					}
					vals = JSON.stringify(vals);
					if(ukey.map.hasOwnProperty(vals)){
						if(ignore === true) return;
						return _throw(new jSQL_Error("0019"));
					}
					self.keys.unique[k].map[vals] = self.data.length;
				}

				self.data.push(row);
			};

			self.normalizeColumnStoreValue = function(colName, value){
				var type = self.types[self.colmap[colName]];
				var storeVal = jSQL.types.getByType(type.type.toUpperCase()).serialize(value, type.args);
				if((!isNaN(parseFloat(storeVal)) && isFinite(storeVal)) || typeof storeVal === "string")
					return storeVal;
				return _throw(new jSQL_Error("0020"));
			};

			self.normalizeColumnFetchValue = function(colName, value){
				var type = self.types[self.colmap[colName]];
				return jSQL.types.getByType(type.type.toUpperCase()).unserialize(value, type.args);
			};

			self.init(name, columns, data, types, keys, auto_increment);
		}

		////////////////////////////////////////////////////////////////////////////
		// jSQL Query constructor //////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////

		function jSQLQuery(type){
			var self = this;
			self.type = type.toUpperCase();
			self.tablename = null;
			self.columns = [];
			self.data = [];
			self.INEFlag= false;
			self.coltypes = [];
			self.table = null;
			self.newvals = {};
			self.whereClause = new jSQLWhereClause(self);
			self.resultSet = [];
			
			// Methods that every query class should implement
			var methods = ['init', 'ifNotExists', 'execute', 'fetch', 'ignore', 
				'fetchAll', 'values', 'set', 'where', 'from', 'orderBy', 'asc',
				'desc', 'limit', 'distinct'];
			var queryTypeConstructors = {
				CREATE: jSQLCreateQuery,
				UPDATE: jSQLUpdateQuery,
				SELECT: jSQLSelectQuery,
				INSERT: jSQLInsertQuery,
				DROP: jSQLDropQuery,
				DELETE: jSQLDeleteQuery
			};
			for(var i=0; i<methods.length; i++)(function(i){
				self[methods[i]] = function(){
					var q = new queryTypeConstructors[self.type];
					if(typeof q[methods[i]] == "function") return q[methods[i]].apply(self, arguments);
					else return _throw(new jSQL_Error("0022"));
				};
			})(i);
		}

		////////////////////////////////////////////////////////////////////////////
		// jSQL Query Type constructors ////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////

		function jSQLDeleteQuery(){
			this.init = function(tablename){
				if(undefined === jSQL.tables[tablename])
					return _throw(new jSQL_Error("0021"));
				this.table = jSQL.tables[tablename];
				return this;
			};
			this.execute = function(){
				var resultRowIndexes = this.whereClause.getResultRowIndexes();
				var results = [], newData = []; 
				for(var i=0; i<this.table.data.length; i++){
					var row = this.table.data[i];
					
					// If there are any primary keys on this row, remove them...
					var primary_key_columns = this.table.keys.primary.column;
					var pk_vals = false;
					if (primary_key_columns !== false) {
						if (!Array.isArray(primary_key_columns)) primary_key_columns = [primary_key_columns];
						var pk_col;
						pk_vals = [];
						for (var pk = 0; pk_col = primary_key_columns[pk]; pk++) {
							var primary_index = this.table.colmap[pk_col];
							if (null === row[primary_index]) return _throw(new jSQL_Error("0016"));
							pk_vals.push(row[primary_index]);
						}
						pk_vals = JSON.stringify(pk_vals);
						if (this.table.keys.primary.map.hasOwnProperty(pk_vals) && this.table.keys.primary.map[pk_vals] == i) {
							if(resultRowIndexes.indexOf(i)>-1) delete this.table.keys.primary.map[pk_vals];
							else this.table.keys.primary.map[pk_vals] = newData.length;;
						}
					}

					// If there are any unique columns in this row, delete them
					var ukey;
					for(var k=0; ukey=this.table.keys.unique[k]; k++){
						var key_columns = Array.isArray(ukey.column) ? ukey.column : [ukey.column];
						var col, vals = [];
						for(var uk=0; col=key_columns[uk]; uk++){
							var index = this.table.colmap[col];
							if(null === row[index]) return _throw(new jSQL_Error("0018"));
							vals.push(row[index]);
						}
						vals = JSON.stringify(vals);
						if(ukey.map.hasOwnProperty(vals) && ukey.map[vals] == i){
							if(this.ignoreFlag === true) return this;
							if(resultRowIndexes.indexOf(i)>-1) delete this.table.keys.unique[k].map[vals];
							else this.table.keys.unique[k].map[vals] = newData.length;
						}
					}
					
					if(resultRowIndexes.indexOf(i)>-1) results.push(row);
					else newData.push(this.table.data[i]);
				}
				this.table.data = newData;
				this.resultSet = results;
				return this;
			};
			this.where = function(column){
				return this.whereClause.where(column);
			};
			this.fetch = function(){ return null; };
			this.fetchAll = function(){ return []; };
			this.orderBy = function(columns){
				return this.whereClause.orderBy(columns);
			};
			this.asc = function(){
				return this.whereClause.asc();
			};
			this.desc = function(){
				return this.whereClause.desc();
			};
			this.limit = function(){
				return this.whereClause.limit();
			};
			this.distinct = function(){
				this.whereClause.isDistinct = true;
				return this;
			};
		}

		function jSQLDropQuery(){
			this.init = function(tablename){
				this.tablename = tablename;
				return this;
			};
			this.execute = function(){ 
				if(undefined === jSQL.tables[this.tablename]) return _throw(new jSQL_Error("0021"));
				// Delete the table
				delete jSQL.tables[this.tablename];
				return this; 
			};
			this.fetch = function(){ return null; };
			this.fetchAll = function(){ return []; };
		}

		function jSQLInsertQuery(){
			this.init = function(table){
				this.table = table;
				this.ignoreFlag = false;
				return this;
			};
			this.values = function(data){
				if(undefined === jSQL.tables[this.table])
					return _throw(new jSQL_Error("0021"));
				this.data = data;
				return this;
			};
			this.execute = function(preparedVals){
				if(preparedVals !== undefined && Array.isArray(preparedVals) && preparedVals.length>0){
					if(Array.isArray(this.data)){
						for(var i=this.data.length; i-- && preparedVals.length;)
							if(this.data[i]=="?") this.data[i]=preparedVals.shift();
					}else{
						for(var i in this.data)
							if(this.data.hasOwnProperty(i) && preparedVals.length && this.data[i] == "?")
								this.data[i] = preparedVals.shift();
					}
				}
				jSQL.tables[this.table].insertRow(this.data, this.ignoreFlag);
				return this;
			};
			this.ignore = function(){ this.ignoreFlag=true; return this; };
			this.fetch = function(){ return null; };
			this.fetchAll = function(){ return []; };
		}

		function jSQLSelectQuery(){
			this.init = function(columns){
				this.columns = Array.isArray(columns) ? columns : [columns];
				return this;
			};
			this.from = function(table){
				if(undefined === jSQL.tables[table])
					return _throw(new jSQL_Error("0021"));
				this.table = jSQL.tables[table];
				if(this.columns[0] == "*") this.columns = this.table.columns;
				return this;
			};
			this.where = function(column){
				return this.whereClause.where(column);
			};
			this.execute = function(){
				var resultRowIndexes = this.whereClause.getResultRowIndexes();

				var resultRows = [];
				for(var i=0; i<resultRowIndexes.length; i++)
					resultRows.push(this.table.data[resultRowIndexes[i]]);

				var results = []; 
				for(var i=0; i<resultRows.length; i++){
					var row = {};
					for(var n=0; n<this.columns.length; n++){
						row[this.columns[n]] = resultRows[i][this.table.colmap[this.columns[n]]]
					}
					results.push(row);
				}
				this.resultSet = results;
				return this;
			};
			this.fetch = function(Mode){
				if(undefined === Mode) Mode = "ASSOC";
				Mode = Mode.toUpperCase();
				if(Mode !== "ASSOC" && Mode !== "ARRAY") return _throw(new jSQL_Error("0023"));
				if(!this.resultSet.length) return false;
				var row = this.resultSet.shift();

				for(var colName in row){
					if(row.hasOwnProperty(colName)){ 
						var r = this.table.normalizeColumnFetchValue(colName, row[colName]);
						row[colName] = r;
					}
				}

				if(Mode == "ARRAY"){
					var r = [];
					for(var name in row) if(row.hasOwnProperty(name)) r.push(row[name]);
					row = r;
				}
				return row;
			};
			this.fetchAll = function(Mode){
				if(undefined === Mode) Mode = "ASSOC";
				Mode = Mode.toUpperCase();
				if(Mode !== "ASSOC" && Mode !== "ARRAY") return _throw(new jSQL_Error("0023"));
				if(!this.resultSet.length) return false;

				var res = [];
				while(this.resultSet.length > 0){
					res.push(this.fetch(Mode));
				}
				return res;
			};
			this.orderBy = function(columns){
				return this.whereClause.orderBy(columns);
			};
			this.asc = function(){
				return this.whereClause.asc();
			};
			this.desc = function(){
				return this.whereClause.desc();
			};
			this.limit = function(){
				return this.whereClause.limit();
			};
			this.distinct = function(){
				this.whereClause.isDistinct = true;
				return this;
			};
		}

		function jSQLUpdateQuery(){
			this.init = function(table){
				if(undefined === jSQL.tables[table])
					return _throw(new jSQL_Error("0021"));
				this.table = this.table = jSQL.tables[table];
				this.ignoreFlag = false;
				return this;
			};
			this.set = function(newvals){
				this.newvals = newvals;
				for(var c in newvals) if(newvals.hasOwnProperty(c)) this.columns.push(c);
				return this;
			};
			this.where = function(column){
				return this.whereClause.where(column);
			};
			this.execute = function(preparedVals){

				if(undefined !== preparedVals && Array.isArray(preparedVals))
					for(var i in this.newvals)
						if(this.newvals.hasOwnProperty(i) && this.newvals[i] == '?' && preparedVals.length)
							this.newvals[i] = preparedVals.shift();

				var resultRowIndexes = this.whereClause.getResultRowIndexes();

				var results = [], new_rows = []; 
				for(var i=0; i<resultRowIndexes.length; i++){
					var rowIndex = resultRowIndexes[i]; 
					var row = this.table.data[rowIndex].slice(0);

					for(var n=0; n<this.columns.length; n++){
						if(this.columns[n] === this.table.auto_inc_col){
							if(!this.newvals[this.columns[n]]){
								this.newvals[this.columns[n]] = this.table.auto_inc_seq;
								this.table.auto_inc_seq++;
							}
							if(this.newvals[this.columns[n]] >= this.table.auto_inc_seq) this.table.auto_inc_seq = this.newvals[this.columns[n]]+1;
						}
						row[this.table.colmap[this.columns[n]]] = this.table.normalizeColumnStoreValue(this.columns[n], this.newvals[this.columns[n]]);
					}

					var primary_key_columns = this.table.keys.primary.column;
					var pk_vals = false;
					if(primary_key_columns !== false){
						if(!Array.isArray(primary_key_columns)) primary_key_columns = [primary_key_columns];
						var pk_col; pk_vals = [];
						for(var pk=0; pk_col=primary_key_columns[pk]; pk++){
							var primary_index = this.table.colmap[pk_col];
							if(null === row[primary_index]){
								if(this.ignoreFlag === true) return this;
								return _throw(new jSQL_Error("0016"));
							}
							pk_vals.push(row[primary_index]);
						}
						pk_vals = JSON.stringify(pk_vals);
						if(this.table.keys.primary.map.hasOwnProperty(pk_vals) && this.table.keys.primary.map[pk_vals] !== rowIndex){
							if(this.ignoreFlag === true) return this;
							return _throw(new jSQL_Error("0017"));
						}
					}

					// Check the unique keys, There may be multiple and they may be compound
					var ukey, uni_vals = [];
					for(var k=0; ukey=this.table.keys.unique[k]; k++){
						var key_columns = Array.isArray(ukey.column) ? ukey.column : [ukey.column];
						var col, vals = [];
						for(var uk=0; col=key_columns[uk]; uk++){
							var index = this.table.colmap[col];
							if(null === row[index]){
								if(this.ignoreFlag === true) return this;
								return _throw(new jSQL_Error("0018"));
							}
							vals.push(row[index]);
						}
						vals = JSON.stringify(vals);
						if(ukey.map.hasOwnProperty(vals) && ukey.map[vals] !== rowIndex){
							if(this.ignoreFlag === true) return this;
							return _throw(new jSQL_Error("0019"));
						}
						uni_vals.push(vals);
					}

					new_rows.push({
						rowIndex: rowIndex,
						row: row,
						pk_vals: pk_vals,
						uni_vals: uni_vals
					});
				}

				for(var i=0; i<new_rows.length; i++){
					results.push(new_rows[i].row);
					this.table.data[new_rows[i].rowIndex] = new_rows[i].row;
					for(var col in this.table.keys.primary.map){
						if(!this.table.keys.primary.map.hasOwnProperty(col) || 
							this.table.keys.primary.map[col] != new_rows[i].rowIndex) continue;
						delete this.table.keys.primary.map[col];
						this.table.keys.primary.map[new_rows[i].pk_vals] = rowIndex;
						break;
					}
					for(var k=0; ukey=this.table.keys.unique[k]; k++){
						for(var col in this.table.keys.unique[k].map){
							if(!this.table.keys.unique[k].map.hasOwnProperty(col) || 
								this.table.keys.unique[k].map[col] != new_rows[i].rowIndex) continue;
							delete this.table.keys.unique[k].map[col];
							this.table.keys.unique[k].map[new_rows[i].uni_vals[k]] = rowIndex;
							break;
						}
					}
				}

				this.resultSet = results;
				return this;
			};
			this.fetch = function(){ return null; };
			this.fetchAll = function(){ return []; };
			this.ignore = function(){ this.ignoreFlag=true; return this; };
			this.orderBy = function(columns){
				return this.whereClause.orderBy(columns);
			};
			this.asc = function(){
				return this.whereClause.asc();
			};
			this.desc = function(){
				return this.whereClause.desc();
			};
			this.limit = function(){
				return this.whereClause.limit();
			};
			this.distinct = function(){
				this.whereClause.isDistinct = true;
				return this;
			};
		}

		function jSQLCreateQuery(){
			this.init = function(tablename, columns, types, keys, auto_increment){
				this.tablename = tablename;
				this.columns = columns;
				this.coltypes = types;
				this.keys = keys;
				this.ai_col = auto_increment;
				return this;
			};
			this.ifNotExists = function(){ this.INEFlag=true; return this; };
			this.execute = function(data){ 
				if(undefined !== data) this.data = data; 
				if(!(this.INEFlag && jSQL.tables.hasOwnProperty(this.tablename))){
					jSQL.tables[this.tablename] = new jSQLTable(this.tablename, this.columns, this.data, this.coltypes, this.keys, this.ai_col);
				}
				return this;
			};
			this.fetch = function(){ return null; };
			this.fetchAll = function(){ return []; };
		}

		////////////////////////////////////////////////////////////////////////////
		// Parse String Query //////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////

		function jSQLParseQuery(query){

			// Remove surrounding quotes from a string
			var removeQuotes = function(str){
				var quotes = ['"', "'", "`"];
				for (var i = quotes.length; i--; )
					if (str.substr(0, 1) == quotes[i] && str.substr(str.length - 1, 1) == quotes[i])
						return str.substr(1, str.length - 2);
				return str;
			};

			// Predcit the correct casing for column and table names
			var convertToCol = function(c, skipErrors){
				for(var i=0; i<jSQL.tables[table].columns.length; i++)
					if(removeQuotes(c.toUpperCase()) == jSQL.tables[table].columns[i].toUpperCase())
						return jSQL.tables[table].columns[i];
				return _throw(new jSQL_Error("0013"), skipErrors);
			};

			// A helper function that extracts values from a string of
			// quoted, comma separated values, taking into account escaped chars
			var getNextQueryVals = function(str) {
				var numbers = "+,-,0,1,2,3,4,5,6,7,8,9,0,.".split(",");
				var vals = [];
				var inQuote = false;
				var currentVal = [];
				var quoteType;
				for (var i = 0; i < str.length; i++) {
					if (str[i] === "'" || str[i] === '"') {
						if (!inQuote) {
							quoteType = str[i];
							inQuote = true;
						} else if (str[i] !== quoteType) {
							currentVal.push(str[i]);
						} else {
							if (i > 0 && str[i - 1] === "\\") {
								if (i > 1 && str[i - 2] === "\\") {
									inQuote = false;
									vals.push(currentVal.join(''));
									var currentVal = [];
								} else {
									currentVal[currentVal.length - 1] = str[i];
								}
							} else {
								inQuote = false;
								vals.push(currentVal.join(''));
								var currentVal = [];
							}

						}
					} else if (inQuote) {
						if (str[i] === "\\" && i > 0 && str[i - 1] === "\\")
							continue;
						currentVal.push(str[i]);
					} else if(str[i] === "?"){
						vals.push('?');
					}else if(numbers.indexOf(str[i])>-1){
						var v = "";
						while(numbers.indexOf(str[i])>-1&&i < str.length){
							v += str[i];
							i++;
						}
						vals.push(parseFloat(v));
					}else if (str[i] !== " " && str[i] !== ",") {
						return vals;
					}
				}
				return vals;
			};

			// A helper function that gets column/value pairs from an update query
			var getColValPairs = function(str){

				// break parts up only on commas that do not occur inside quoted text
				// see Issue #3
				var parts = [];
				var currentPart = "";
				var quotes = ["'",'"',"`"];
				var inQuote = false;
				var quoteType = "";
				for(var i=0; i<str.length; i++){
					if(!inQuote && quotes.indexOf(str[i])>-1){
						inQuote = true;
						quoteType = str[i];
						currentPart += str[i];
						continue;
					}
					if(inQuote && str[i] === quoteType){
						inQuote = false;
						quoteType = "";
						currentPart += str[i];
						continue;
					}
					if(inQuote || str[i]!==","){
						currentPart += str[i];
						continue;
					}
					parts.push(currentPart);
					currentPart = "";
				}
				parts.push(currentPart);
				currentPart = "";

				var newVals = {};
				var whereClause = "";

				var state = 0;
				for(var i=0; i<parts.length; i++){
					var keyvals = parts[i].trim();
					var col = '', val = '', quoteType=null, isNum = false;
					var chars = keyvals.split('');
					if(state !== 4) state = 0; 
								// 0 = looking for col, 
								// 1 = looking for val in quote, 
								// 2 = looking for numeric val
								// 3 = checking for string after end of value
								// 4 = found string at end of value
					for(var n=0; n<chars.length; n++){
						var char = chars[n];
						switch(state){
							case 0:
									if(char !== '=' && char !== ' ') col += char;
									else if(char === '='){
										// check for a space
										if(chars[n+1] == ' '){ n++; char=chars[n];}
										// expect next char either a quote or a number
										if(!isNaN(chars[n+1])){
											state = 2;
											isNum = true;
										}else if(chars[n+1]=='"' || chars[n+1]=="'"){
											quoteType = chars[n+1];
											state = 1;
											n++; // skip the first quote
										}else if(chars[n+1]=='?'){
											n++; char=chars[n];
											newVals[removeQuotes(col)] = '?';
											state = 3;
										}else{
											return _throw(new jSQL_Error("0024"));
										}
									}
								break;
							case 1:
								if(char === quoteType){
									// is it escaped?
									if(chars[n-1]=="\\") val += char;
									else{
										newVals[removeQuotes(col)] = val;
										state = 3;
									}
								}else val += char;
								break;
							case 2:
								if(char == ' '){n++; char = chars[n];}
								if(!isNaN(char) || char == '.') val += "" + char;
								else{
									newVals[removeQuotes(col)] = parseFloat(val);
									whereClause += char; 
									state = 3;
								}
								break;
							case 3:
								if(char == ' '){ n++; char = chars[n]; }
								if(undefined === char) break;
								state = 4;
								whereClause += char; 
								break;
							case 4:
								whereClause += char;
						}
					}
					whereClause += ",";
					if(val !== '') newVals[removeQuotes(col)] = isNum ? parseFloat(val) : val;
				}

				//  trim off triling comma
				if(whereClause.substring(whereClause.length-1)===",") 
					whereClause = whereClause.substring(0,whereClause.length-1);

				return {
					newVals: newVals,
					whereClause: whereClause
				};
			};

			var parseWhereClause = function(query, words){
				while(words.length){
					var piece = words.shift();
					switch(piece.toUpperCase()){
						case "WHERE":
						case "AND":
							var ccc;
							try{
								ccc = convertToCol(words.shift(), true);
							}catch(ex){
								return new (function(error){
									this.execute = function(){ return _throw(error); };
									this.fetch = function(){ return _throw(error); };
									this.fetchAll = function(){ return _throw(error); };
								})(ex.message);
							}
							query = query.where(ccc);
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
							}else if(substr === "?"){
								// Is a pepared statement, no value available at this time
								query = query.preparedLike();
							}else{
								// no "%" on either side. jSQL only supports % when 
								// the string begins or ends with it, so treat it like an equal
								query = query.equals(substr);
							}
							break;
						case "OR":
							var ccc = convertToCol(words.shift());
							query = query.or(ccc);
							break;
						case "LIMIT":
							var limit = words.shift(), offset, commaFound=false;
							// if the last char is comma, trim it off
							if(limit[limit.length-1]===","){
								limit = limit.substring(0,limit.length-1);
								commaFound = true;
							}
							if(!commaFound && limit.indexOf(",")>0){
								var p = limit.split(",");
								limit = p[0];
								words.unshift(p[1]);
								commaFound = true;
							}
							if(!commaFound && words.length){
								var nextWord = words.shift();
								if(nextWord[0]===","){
									commaFound = true;
									if(nextWord.length>1){
										nextWord = nextWord.substring(1,limit.length);
										words.unshift(nextWord)
									}
								}else words.unshift(nextWord);
							}
							if(commaFound){
								offset = limit;
								limit = words.shift();
							}
							if(words.length && !commaFound){
								var nextWord = words.shift();
								if(nextWord.toUpperCase()==="OFFSET"){
									offset = words.shift();
								}else words.unshift(nextWord);
							}
							query = query.limit(limit, offset);
							break;
						case "ORDER":
							if(words.shift().toUpperCase() != "BY") return _throw(new jSQL_Error("0025"));
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
							if(!orderColumns.length) return _throw(new jSQL_Error("0026"));
							query = query.asc();
							break;
						case "DESC":
							if(!orderColumns.length) return _throw(new jSQL_Error("0027"));
							query = query.desc();
							break;
					}
				}
				return query;
			};

			// Remove excess whitespace, linebreaks, tabs, comments
			query = jSQL.minify(query);

			// Break words into uppercase array
			var words = query.split(" ");

			switch(words.shift().toUpperCase()){
				case "DELETE":
					var orderColumns = [];
					// Next Word should be "FROM"
					if(words.shift().toUpperCase() !== "FROM") return _throw(new jSQL_Error("0028"));

					// Next word should be the table name
					var table = removeQuotes(words.shift());
					if(undefined === jSQL.tables[table]) return _throw(new jSQL_Error("0021"));

					var query = jSQL.deleteFrom(table);
					query = parseWhereClause(query, words);

					return query;
					break;

				case "DROP":				

					// Next Word should be "TABLE"
					if(words.shift().toUpperCase() !== "TABLE") return _throw(new jSQL_Error("0029"));

					// Next word should be the table name
					var table = removeQuotes(words.shift());
					// If table is quoted, mean there may be spaces in table name,
					// look for next quote to get full table name
					if(table.indexOf("`") === 0){
						table = table.substring(1);
						var restOfQuery = " "+words.join(" ");
						for(var i=0; table.indexOf("`")<0&&i<restOfQuery.length;i++){
							var char = restOfQuery[i];
							if(char === " ") words.shift();
							table += char;
						}
						table = removeQuotes("`"+table);
					}

					if(undefined === jSQL.tables[table]) return _throw(new jSQL_Error("0021"));

					return jSQL.dropTable(table);
					break;

				case "INSERT": 
					var table, cols=[], values = [], ignore = false;

					var into = words.shift().toUpperCase();
					if(into === "IGNORE"){
						ignore = true;
						into = words.shift().toUpperCase();
					}

					// Next Word should be "INTO"
					if(into !== "INTO") return _throw(new jSQL_Error("0030"));

					// Next word should be the table name
					table = removeQuotes(words.shift());

					// If table is quoted, mean there may be spaces in table name,
					// look for next quote to get full table name
					if(table.indexOf("`") === 0){
						table = table.substring(1);
						var restOfQuery = " "+words.join(" ");
						for(var i=0; table.indexOf("`")<0&&i<restOfQuery.length;i++){
							var char = restOfQuery[i];
							if(char === " ") words.shift();
							table += char;
						}
						table = removeQuotes("`"+table);
					}
					if(undefined === jSQL.tables[table]) return _throw(new jSQL_Error("0021"));

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
						return _throw(new jSQL_Error("0031"));

					var w = words.join(' ');
					values = getNextQueryVals(w);

					if(!cols.length){
						for(var i=0;  i<values.length; i++){
							if(undefined === jSQL.tables[table].columns[i]) return _throw(new jSQL_Error("0032"));
							cols.push(jSQL.tables[table].columns[i]);
						}
					}

					if(values.length !== cols.length) return _throw(new jSQL_Error("0033"));

					var data = {};
					for(var i=0; i<cols.length; i++){
						data[cols[i]] = values[i];
					}

					var q = jSQL.insertInto(table).values(data);
					return ignore ? q.ignore() : q;
					break;
					
				case "CREATE": 
					var params = {};
					var table, c, cols = [],ine=false;
					// Next Word should be "TABLE"
					if(words.shift().toUpperCase() !== "TABLE") return _throw(new jSQL_Error("0029"));

					// get the column definition part of the table
					var str = words.join(" ");
					var conlumnDef = "";
					var opencount = (str.match(/\(/g) || []).length;
					var closecount = (str.match(/\)/g) || []).length;
					if(opencount !== closecount) return _throw(new jSQL_Error("0034"));
					if(opencount > 0)
						conlumnDef = str.substring(str.indexOf("(")+1, str.lastIndexOf(")"));

					// Remove a few chars and re-split
					words = str
						.split("(").join(" ")
						.split(")").join(" ")
						.split(",").join(" ")
						.split("  ").join(" ").trim()
						.split(" ");

					// Check for "IF NOT EXISTS" clause
					table = removeQuotes(words.shift());

					if(table.toUpperCase() === "IF"){
						if(words.shift().toUpperCase() !== "NOT") return _throw(new jSQL_Error("0035"));
						if(words.shift().toUpperCase() !== "EXISTS") return _throw(new jSQL_Error("0036"));
						table = removeQuotes(words.shift());
						ine=true;
					} 

					// If table is quoted, mean there may be spaces in table name,
					// look for next quote to get full table name
					if(table.indexOf("`") === 0){
						table = table.substring(1);
						var restOfQuery = " "+words.join(" ");
						for(var i=0; table.indexOf("`")<0&&i<restOfQuery.length;i++){
							var char = restOfQuery[i];
							if(char === " ") words.shift();
							table += char;
						}
						table = removeQuotes("`"+table);
					}

					params[table] = [];

					// Get column definitions
					var parts = conlumnDef.split(",");
					for(var i=0;i<parts.length;i++){
						var str = parts[i];
						while((str.match(/\(/g) || []).length !== (str.match(/\)/g) || []).length && i<parts.length){
							str += ","+parts[i+1];
							parts[i+1] = "";
							parts[i] = str;
							i++;
						}
						if(str.trim()!=="") cols.push(str.trim());
					}

					// keys param as passed to the table constructor
					var keys = [];

					// loop and apply column definitions to params object
					for(var i=0; i<cols.length; i++){
						var colparts = cols[i].split(" ");
						var colname = removeQuotes(colparts.shift());
						var is_ai = false; // is this column an auto_increment column
						
						// If this line is actually a key definition rather tahn a column defintion
						if(colname.toUpperCase() == "PRIMARY" || colname.toUpperCase() == "UNIQUE"){
							var char, def_started = false, in_quote = false, key_cols = [], curr_col = "";
							for(var c=0; char=cols[i][c]; c++){
								if(char === "("){
									def_started = true;
									continue;
								}
								if(!def_started) continue;
								if(['"', '`', "'"].indexOf(char) !== -1){
									if(in_quote === false){
										in_quote = char;
									}else if(in_quote === char){
										in_quote = false;
										key_cols.push(curr_col);
										curr_col = "";
									}else{
										curr_col += char;
									}
									continue;
								}
								if(char === " " && !in_quote){
									if(curr_col !== "") key_cols.push(curr_col);
									curr_col = "";
									continue;
								}
								if(def_started === true && char === ")"){
									if(curr_col !== "") key_cols.push(curr_col);
									curr_col = "";
									break;
								}
								if(char == "," && !in_quote) continue;
								curr_col += char;
							}
							keys.push({column: key_cols, type: colname.toLowerCase()});

							// This isn't a column so continue the loop here...
							continue;
						}

						params[table][i] = {name: colname, type:"AMBI",args:[]};
						if(colparts.length){

							// If the column definition includes "primary [key]" or "unique [key]" or "auto_increment" remove those words now
							var colparts_new = [], colparts_primary_index = false, colparts_unique_index = false;
							for(var n = 0; n<colparts.length; n++){
								if(colparts[n].toUpperCase() === "PRIMARY") colparts_primary_index = n;
								else if(colparts[n].toUpperCase() === "UNIQUE") colparts_unique_index = n;
								else if(colparts[n].toUpperCase() === "KEY" && colparts_primary_index!==false && n === (1+colparts_primary_index)){ /* do nothing */ }
								else if(colparts[n].toUpperCase() === "KEY" && colparts_unique_index!==false && n === (1+colparts_unique_index)){ /* do nothing */ }
								else if(colparts[n].toUpperCase() === "AUTO_INCREMENT") is_ai = true;
								else colparts_new.push(colparts[n]);
							}
							colparts = colparts_new;
							if(false !== colparts_primary_index) keys.push({column: colname, type: "primary"});
							if(false !== colparts_unique_index) keys.push({column: colname, type: "unique"});
							if(!colparts.length) continue;

							// Parse column definition if one is included
							var typename = colparts.shift().toUpperCase();
							if((typename.match(/\(/g) || []).length){ // typename contains opening (
								while(!(typename.match(/\)/g) || []).length){ // make sure it has a closing one
									if(!colparts.length) return _throw(new jSQL_Error("0037"));
									typename += " "+colparts.shift();
								}
								// check if there is anything after the last ) and shift it back on to colparts array
								if(typename.substring(typename.lastIndexOf(")")+1)!==""){
									colparts.unshift(typename.substring(typename.lastIndexOf(")")+1));
									typename.substring(0,typename.lastIndexOf(")"))
								}
							}

							// if typename still does not include args,
							// check for them at the begining of the next colpart
							if(!(typename.match(/\(/g) || []).length && colparts.length && colparts[0].charAt(0)==="("){
								typename += colparts[0].substring(0, colparts[0].indexOf(")")+1);
								colparts[0] = colparts[0].substring(colparts[0].indexOf(")")+1);
							}

							// if a args were given for this column type 
							// they should now be concatted to the typename
							var argsDef = "";
							if(typename.indexOf("(") > -1){ 
								var opencount = (typename.match(/\(/g) || []).length;
								var closecount = (typename.match(/\)/g) || []).length;
								if(opencount !== closecount) return _throw(new jSQL_Error("0038"));
								if(opencount > 0)
									argsDef = typename.substring(typename.indexOf("(")+1, typename.lastIndexOf(")"));
							}
							if(argsDef.trim()!==""){  
								var a = argsDef.split(","); 
								for(var d=0;d<a.length; d++)
									if(a[d].trim()!=="")
									  params[table][i].args.push(a[d].trim());
							}
							params[table][i].type = typename.split("(")[0].trim().toUpperCase();
							if(is_ai) params[table][i].auto_increment = true;
						}
					}		
					
					var query = jSQL.createTable(params, keys);
					if(ine) query.ifNotExists();
					return query;
					break;
					
				case "UPDATE":
					// Do stuff to parse update query
					var table, colValPairs, query, orderColumns = [];
					table = removeQuotes(words.shift());

					// If table is quoted, mean there may be spaces in table name,
					// look for next quote to get full table name
					if(table.indexOf("`") === 0){
						table = table.substring(1);
						var restOfQuery = " "+words.join(" ");
						for(var i=0; table.indexOf("`")<0&&i<restOfQuery.length;i++){
							var char = restOfQuery[i];
							if(char === " ") words.shift();
							table += char;
						}
						table = removeQuotes("`"+table);
					}

					for(var name in jSQL.tables){
						if(!jSQL.tables.hasOwnProperty(name)) continue;
						if(name.toUpperCase() == removeQuotes(table.toUpperCase())){
							table = name;
							break;
						}
					}

					var set = words.shift().toUpperCase();
					if (set !== "SET")
						return _throw(new jSQL_Error("0039"));

					var parts = getColValPairs(words.join(' '));
					query = jSQL.update(table).set(parts.newVals);

					query = parseWhereClause(query, parts.whereClause.split(' '));
					return query;
					break;

				case "SELECT":
					var table, columns, query, orderColumns = [], isDistinct = false;;
					var upperWords = query.toUpperCase().split(" "); upperWords.shift();
					var fromIndex = upperWords.indexOf("FROM");

					if(fromIndex < 0) return _throw(new jSQL_Error("0040"));

					columns = words.splice(0, fromIndex);

					if(columns[0].toUpperCase()==="ALL") columns.shift();
					if(columns[0].toUpperCase()==="DISTINCT" || columns[0].toUpperCase()==="DISTINCTROW"){
						columns.shift();
						isDistinct = true;
					}

					for(var i=columns.length; i--;)
						while(columns[i].indexOf(",") == columns[i].length-1)
							columns[i] = columns[i].substr(0, columns[i].length-1);
					words.shift(); // pop the FROM off
					table = words.shift();

					// If table is quoted, mean there may be spaces in table name,
					// look for next quote to get full table name
					if(table.indexOf("`") === 0){
						table = table.substring(1);
						var restOfQuery = " "+words.join(" ");
						for(var i=0; table.indexOf("`")<0&&i<restOfQuery.length;i++){
							var char = restOfQuery[i];
							if(char === " ") words.shift();
							table += char;
						}
						table = removeQuotes("`"+table);
					}

					for(var name in jSQL.tables){
						if(!jSQL.tables.hasOwnProperty(name)) continue;
						if(name.toUpperCase() == removeQuotes(table.toUpperCase())){
							table = name;
							break;
						}
					}
					if(undefined === jSQL.tables[table]) return new (function(error){
						this.execute = function(){ return _throw(error); };
						this.fetch = function(){ return _throw(error); };
						this.fetchAll = function(){ return _throw(error); };
					})(new jSQL_Error("0021"));

					if(columns.length == 1 && columns[0] == "*") columns = '*';
					else for(var i=0;i<columns.length;i++){
						columns[i] = convertToCol(columns[i]);
					}

					// Generate the query object
					query = jSQL.select(columns).from(table);
					if(isDistinct) query = query.distinct();
					query = parseWhereClause(query, words);


					return query;
					break;

				default:
					return _throw(new jSQL_Error("0041"));
			}
		}

		////////////////////////////////////////////////////////////////////////////
		// Where caluse ////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////

		function jSQLWhereClause(context){
			var self = this;
			self.context = context;
			self.pendingColumn = "";
			self.conditions = [];
			self.LIMIT = 0;
			self.OFFSET = 0;
			self.finalConditions = [];
			self.sortColumn = [];
			self.sortDirection = "ASC";
			self.isDistinct = false;

			self.where = function(column){
				if(self.pendingColumn !== "") return _throw(new jSQL_Error("0042"));
				if('string' != typeof column) return _throw(new jSQL_Error("0043"));
				self.pendingColumn = column;
				return self;
			};

			self.equals = function(value){
				if(self.pendingColumn == "") return _throw(new jSQL_Error("0044"));
				self.conditions.push({col: self.pendingColumn, type: '=', value: value});
				self.pendingColumn = "";
				return self;
			};

			self.preparedLike = function(){
				if(self.pendingColumn == "") return _throw(new jSQL_Error("0045"));
				self.conditions.push({col: self.pendingColumn, type: 'pl', value: "?"});
				self.pendingColumn = "";
				return self;
			};

			self.doesNotEqual = function(value){
				if(self.pendingColumn == "") return _throw(new jSQL_Error("0046"));
				self.conditions.push({col: self.pendingColumn, type: '!=', value: value});
				self.pendingColumn = "";
				return self;
			};

			self.lessThan = function(value){
				if(self.pendingColumn == "") return _throw(new jSQL_Error("0047"));
				self.conditions.push({col: self.pendingColumn, type: '<', value: value});
				self.pendingColumn = "";
				return self;
			};

			self.greaterThan = function(value){
				if(self.pendingColumn == "") return _throw(new jSQL_Error("0048"));
				self.conditions.push({col: self.pendingColumn, type: '>', value: value});
				self.pendingColumn = "";
				return self;
			};

			self.contains = function(value){
				if(self.pendingColumn == "") return _throw(new jSQL_Error("0049"));
				self.conditions.push({col: self.pendingColumn, type: '%%', value: value});
				self.pendingColumn = "";
				return self;
			};

			self.endsWith = function(value){
				if(self.pendingColumn == "") return _throw(new jSQL_Error("0050"));
				self.conditions.push({col: self.pendingColumn, type: '%-', value: value});
				self.pendingColumn = "";
				return self;
			};

			self.beginsWith = function(value){
				if(self.pendingColumn == "") return _throw(new jSQL_Error("0051"));
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

			self.limit = function(limit, offset){
				self.LIMIT = parseInt(limit);
				if(undefined !== offset) 
					self.OFFSET = parseInt(offset);
				return self;
			};

			self.orderBy = function(columns){
				if(!Array.isArray(columns)) columns = [columns];
				self.sortColumn = columns;
				return self;
			};

			self.asc = function(){
				if('' == self.sortColumn) return _throw(new jSQL_Error("0052"));
				self.sortDirection = "ASC";
				return self;
			};

			self.desc = function(){
				if('' == self.sortColumn) return _throw(new jSQL_Error("0053"));
				self.sortDirection = "DESC";
				return self;
			};

			self.execute = function(preparedVals){
				if(undefined === preparedVals) preparedVals = [];
				if(self.conditions.length > 0) self.finalConditions.push(self.conditions);

				if(preparedVals.length > 0){
					for(var i = self.finalConditions.length; i--;){
						for(var n = self.finalConditions[i].length; n--;){
							if(self.finalConditions[i][n].value === "?" && self.finalConditions[i][n].type === "pl"){
								var substr = preparedVals.pop();
								// "%text%" - Contains text
								if(substr.substr(0,1)=="%" && substr.substr(substr.length-1,1)=="%"){
									self.finalConditions[i][n].value = substr.substr(1,substr.length-2);
									self.finalConditions[i][n].type = "%%";
								// "%text" - Ends with text
								}else if(substr.substr(0,1)=="%"){
									self.finalConditions[i][n].value = substr.substr(1,substr.length-1);
									self.finalConditions[i][n].type = "%-";
								// "text%" - Begins with text
								}else if(substr.substr(substr.length-1,1)=="%"){
									self.finalConditions[i][n].value = substr.substr(0,substr.length-1);
									self.finalConditions[i][n].type = "-%";
								}else{
									// no "%" on either side. jSQL only supports % when 
									// the string begins or ends with it, so treat it like an equal
									self.finalConditions[i][n].value = substr;
									self.finalConditions[i][n].type = "=";
								}

							}else if(self.finalConditions[i][n].value === "?" && preparedVals.length > 0){
								self.finalConditions[i][n].value = preparedVals.pop();
							}
						}
					}
				}
				return self.context.execute(preparedVals);
			};

			self.fetch = function(Mode){
				return self.context.fetch(Mode);
			};

			self.fetchAll = function(Mode){
				return self.context.fetchAll(Mode);
			};

			self.getResultRowIndexes = function(){
				var resultRowIndexes = [];
				for(var i=0; i<self.context.table.data.length; i++){
					// LOOPING ROWS
					if(self.finalConditions.length < 1){
						// IF THERE ARE NO CONDITIONS, ADD ROW TO RESULT SET
						resultRowIndexes.push(i);
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
										if(isNaN(parseFloat(self.context.table.data[i][self.context.table.colmap[condition.col]])) || self.context.table.data[i][self.context.table.colmap[condition.col]] < condition.value)
											safeCondition = false;
										break;
									case "<": 
										if(isNaN(parseFloat(self.context.table.data[i][self.context.table.colmap[condition.col]])) || self.context.table.data[i][self.context.table.colmap[condition.col]] > condition.value)
											safeCondition = false;
										break;
									case "=": 
										if(self.context.table.data[i][self.context.table.colmap[condition.col]] != condition.value)
											safeCondition = false;
										break;
									case "!=": break;
										if(self.context.table.data[i][self.context.table.colmap[condition.col]] == condition.value)
											safeCondition = false;
										break;
									case "%%": 
										if(self.context.table.data[i][self.context.table.colmap[condition.col]].indexOf(condition.value) < 0)
											safeCondition = false;
										break;
									case "%-": 
										if(self.context.table.data[i][self.context.table.colmap[condition.col]].indexOf(condition.value) != self.context.table.data[i][self.context.table.colmap[condition.col]].length - condition.value.length)
											safeCondition = false;
										break;
									case "-%": 
										if(self.context.table.data[i][self.context.table.colmap[condition.col]].indexOf(condition.value) != 0)
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
							resultRowIndexes.push(i);
						}
					}
				}

				if(self.sortColumn.length > 0){
					resultRowIndexes.sort(function(a, b){
						a=self.context.table.data[a]; 
						b=self.context.table.data[b];					
						return (function srrrrt(i){					
							if(undefined === self.sortColumn[i]) return 0;
							var sortColumn = self.sortColumn[i];
							var sortColumnIndex = self.context.table.colmap[sortColumn];						
							if(a[sortColumnIndex] < b[sortColumnIndex]) return -1;
							if(a[sortColumnIndex] > b[sortColumnIndex]) return 1;
							return srrrrt(i+1);
						}(0));
					});	
					if(self.sortDirection == "DESC") resultRowIndexes.reverse();
				}

				if(self.isDistinct){
					var resultRows = [];
					for(var i=0; i<resultRowIndexes.length; i++)
						resultRows.push(self.context.table.data[resultRowIndexes[i]]);
					var distinctRows = [], newResultRows = []; 
					for(var i=0; i<resultRows.length; i++){
						var row = {};
						for(var n=0; n<self.context.columns.length; n++){
							row[self.context.columns[n]] = resultRows[i][self.context.table.colmap[self.context.columns[n]]]
						}

						// is this row unique?
						var testRow = JSON.stringify(row);
						if(distinctRows.indexOf(testRow)>-1) continue;
						newResultRows.push(resultRowIndexes[i]);
						distinctRows.push(testRow);
					}
					resultRowIndexes = newResultRows;
				}

				if(self.LIMIT > 0 && resultRowIndexes.length > self.LIMIT){
					if(self.OFFSET > resultRowIndexes.length){
						resultRowIndexes = [];
					}
					if(self.LIMIT > resultRowIndexes.length) self.LIMIT = resultRowIndexes.length;
					if(resultRowIndexes.length){
						resultRowIndexes = resultRowIndexes.slice(self.OFFSET, self.OFFSET+self.LIMIT);
					}
				}

				return resultRowIndexes;
			};
		}

		////////////////////////////////////////////////////////////////////////////
		// Data Storage APIs ///////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////

		function WebSQLAPI() {
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
		}

		function nodeAPI(){
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
				if("function" !== typeof successCallback) successCallback = function(){};
				var data = JSON.parse(fs.readFileSync(".jsqldatastore", {encoding: "utf8"}));
				for(var i=data.length; i--;){
					if(!data[i].name === model) continue;
					successCallback(data[i].rows);
					return;
				}
			};
		}

		////////////////////////////////////////////////////////////////////////////
		// Persistence Manager /////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////

		var persistenceManager = new (function(){
			var self = this;
			self.api = null;
			self.error = false;
			self.loaded = false;
			self.isLoading = false;
			self.loadingCallbacks = [];

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

				self.rollback(function(){
					self.isLoading = false;
					self.loaded = true;
					while(self.loadingCallbacks.length) 
						self.loadingCallbacks.shift()();
				});
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

			// Initialize the database
			(function init(){
				if(isNode){
					self.api = new nodeAPI();
					self.api.init([{name: "jSQL_data_schema", rows:[]}]);
				}else{
					try{
						self.api = new indexedDBAPI();
						self.api.init([{name: "jSQL_data_schema", rows:[]}]);
					}catch(e){
						try{
							self.api = new WebSQLAPI();
							self.api.init([{name: "jSQL_data_schema", rows:[]}]);
						}catch(ex){
							return _throw(new jSQL_Error("0063"));
						}
					}
				}
			})();
		})();

		////////////////////////////////////////////////////////////////////////////
		// Syntactic sugar /////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////

		function createTable(name, columnsOrData, types, keys, auto_increment){

			// allow for all params to be passed in a single object
			// jSQL.createTable({myTable: [
			//		{ name: "ID", type: "INT", args: [] }, 
			//		{ name: "Name", type: "VARCHAR", args: [30] }
			// ]})
			// 
			// OR, for compund keys
			// 
			// jSQL.createTable({myTable: [
			//		{ name: "ID", type: "INT", args: [] }, 
			//		{ name: "Name", type: "VARCHAR", args: [30] }
			// ]}, [
			//		{ column: ["ID", "Name"], type: "primary" }	
			// ])
			// 
			// OR, for single-column keys
			//
			// jSQL.createTable({myTable: [
			//		{ name: "ID", type: "INT", args: [], key: "primary", auto_increment: true }, 
			//		{ name: "Name", type: "VARCHAR", args: [30] }
			// ]})
			var dataObjNoKeys = undefined === columnsOrData && undefined === types && "object" === typeof name && undefined === keys;
			var dataObjWithKeys = Array.isArray(columnsOrData) && undefined === types && "object" === typeof name && undefined === keys;
			if(dataObjNoKeys || dataObjWithKeys){
				if(dataObjWithKeys) keys = undefined === columnsOrData ? [] : columnsOrData; 
				if(undefined === keys) keys = [];
				columnsOrData = [];
				types = [];
				for(var tblname in name){
					if(!name.hasOwnProperty(tblname))continue;
					var columnDefs = name[tblname];
					name = tblname;
					for(var n=0; n<columnDefs.length; n++){ 
						var col = columnDefs[n].name;
						columnsOrData.push(col);
						types.push({
							type: columnDefs[n].type, 
							args: (undefined===columnDefs[n].args ? []:columnDefs[n].args)
						});
						// if a key is defined in the row column (only for single column keys)
						if(columnDefs[n].hasOwnProperty("key") && Array.isArray(keys)){
							keys.push({column: columnDefs[n].name, type: columnDefs[n].key});
						}
						// If auto_incerment is defined in the column definitions
						if(columnDefs[n].hasOwnProperty("auto_increment") && columnDefs[n].auto_increment === true){
							auto_increment = columnDefs[n].name;
						}
					}
					break;
				}
			}
			
			// if a single column was provided
			if(!Array.isArray(columnsOrData)) columnsOrData=[columnsOrData];
			if(undefined === keys) keys = [];
			if(!Array.isArray(keys)) keys=[keys];
			return new jSQLQuery("CREATE").init(name, columnsOrData, types, keys, auto_increment);
		}

		function select(cols){
			if(!Array.isArray(cols)) cols=[cols];
			return new jSQLQuery("SELECT").init(cols);
		}

		function update(table){
			return new jSQLQuery("UPDATE").init(table);
		}

		function insertInto(tablename){
			return new jSQLQuery("INSERT").init(tablename);
		}

		function dropTable(tablename){
			return new jSQLQuery("DROP").init(tablename);
		}

		function deleteFrom(tablename){
			return new jSQLQuery("DELETE").init(tablename);
		}

		////////////////////////////////////////////////////////////////////////////
		// Helper/Misc Methods /////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////

		function jSQLReset(){ 
			jSQL.tables = {};
			jSQL.commit(); 
		}

		function jSQLMinifier(sql){
			var cleanSQL = "";
			var lines = sql.split("\n");
			var inQuote = false;
			var quoteType = "";
			var quotes = ["'", "`", '"'];
			var inMultiLineComment = false;
			for (var i = 0; i < lines.length; i++) {
				for (var n = 0; n < lines[i].length; n++) {
					var char = lines[i][n];
					if (!inQuote && quotes.indexOf(char) > -1) {
						inQuote = true;
						quoteType = char;
						cleanSQL += char;
						continue;
					} else if (inQuote && quoteType === char) {
						inQuote = false;
						quoteType = "";
						cleanSQL += char;
						continue;
					} else if (inQuote) {
						cleanSQL += char;
						continue;
					}
					// not in a quote
					var isCommentStart =
							char === "/" &&
							lines[i].length > n &&
							lines[i][n + 1] == "*"
					var isCommentEnd =
							char === "*" &&
							lines[i].length > n &&
							lines[i][n + 1] == "/"
					if (!inMultiLineComment && isCommentStart) {
						inMultiLineComment = true;
						continue;
					} else if (isCommentEnd && inMultiLineComment) {
						n++;
						inMultiLineComment = false;
						continue;
					}
					if (inMultiLineComment)
						continue;
					// not in multiline comment
					var isSLCommentStart =
							char === "#" ||
							(char === "-" &&
									lines[i].length > n &&
									lines[i][n + 1] == "-");
					if (isSLCommentStart)
						break;
					else
						cleanSQL += char;
				}
				cleanSQL += "\n";
			}
			return cleanSQL
				.replace(/\t/g,' ')
				.replace(/(\r\n|\n|\r)/gm," ")
				.replace(/ +(?= )/g,'')
				.trim();
		}

		////////////////////////////////////////////////////////////////////////////
		// Exposed Methods /////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////

		return {
			version: 2.81,
			tables: {},
			query: jSQLParseQuery,
			createTable: createTable,
			dropTable: dropTable,
			select: select,
			update: update,
			deleteFrom: deleteFrom,
			insertInto: insertInto,
			types: new jSQLDataTypeList(),
			load: persistenceManager.load,
			onError: onError,
			reset: jSQLReset,
			minify: jSQLMinifier,
			commit: persistenceManager.commit,
			rollback: persistenceManager.rollback,
			// legacy, to be removed at a later date
			persist: persistenceManager.commit
		};

	})();
	
	// Determine if we're running Node or browser
	if (isNode) {
		module.exports = jSQL;
	} else {
		window.jSQL = jSQL;
	}
	
})();