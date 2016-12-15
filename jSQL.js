/**
 * jSQL.js v1.3
 * A Javascript Query Language Database Engine
 * @author Robert Parham
 * @website https://github.com/Pamblam/jSQL#jsql
 * @license http://www.apache.org/licenses/LICENSE-2.0
 */

;window.jSQL = (function(){
	"use strict";
	
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
				if(p.shift() !== "jSQLFunct") throw "Corrupted function stored in data";
				p = value.split("-");
				p.shift();
				var f = null;
				try{
					eval("f = "+p.join("-"));
				}catch(e){};
				if("function" === typeof f) return f;
				throw "Corrupted function stored in data";
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
				return value instanceof Date ? value.getTime() : new Date(0).getTime(); 
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
			if(typeof type !== "object") throw "Invalid datatype definition";
			if(undefined === type.type) throw "DataType must have a `type` property.";
			if("function" !== typeof type.serialize) throw "DataType must have a `serialize` function.";
			if("function" !== typeof type.unserialize) throw "DataType must have an `unserialize` function.";
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
			throw type+" is not a supported datatype";
		};
	}
	
	////////////////////////////////////////////////////////////////////////////
	// jSQL Table constructor //////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////
	
	function jSQLTable(name, columns, data, types){
		var self = this;	
		self.name = "";		// Table name
		self.columns = [];	// Array of column names
		self.data = [];		// Array of arrays
		self.colmap = {};	// Colmap
		self.types = [];    // array of data types for each column [{type:"",args:[]}..}
			
		// Create the table and load the data, if there is any
		self.init = function(name, columns, data, types){
			self.name = name;

			// If the types array does not exist, create it
			if(undefined === types) types = [];
			if(!Array.isArray(types)) throw "Invalid table types array";
			
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

			// Fill any missing holes in the types array 
			// with "ambi" which means it can be any type
			for(var i=0; i<columns.length; i++)
				self.types[i] = undefined === types[i] || undefined === types[i].type ? 
					{type:"ambi", args:[]} : types[i];
			
			// Validate & normalize each type
			for(var i=self.types.length; i--;){
				var type = self.types[i].type.toUpperCase();
				if(!jSQL.types.exists(type))
					throw type+" is not a supported data type";
				self.types[i].type = type;
			}
			
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
				throw type.type+" is not a supported data type";
			self.types.push(type);
		};

		// Load the dataset into the table
		self.loadData = function(data){

			// Dataset must be an Array of rows
			if(!Array.isArray(data)) throw "Data must be an array.";

			// Loop columns and insert the data
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
			}else throw "Data not structured properly.";
			
			// validate & cast each row type
			for(var i=row.length; i--;)
				row[i] = self.normalizeColumnStoreValue(self.columns[i], row[i]);
			
			self.data.push(row);
		};

		self.normalizeColumnStoreValue = function(colName, value){
			var type = self.types[self.colmap[colName]];
			var storeVal = jSQL.types.getByType(type.type.toUpperCase()).serialize(value, type.args)
			if((!isNaN(parseFloat(storeVal)) && isFinite(storeVal)) || typeof storeVal === "string")
				return storeVal;
			throw type.type.toUpperCase()+".serialize() must return a number or a string.";
		};
		
		self.normalizeColumnFetchValue = function(colName, value){
			var type = self.types[self.colmap[colName]];
			return jSQL.types.getByType(type.type.toUpperCase()).unserialize(value, type.args);
		};
		
		self.init(name, columns, data, types);
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
		
		self.init = function(){
			switch(self.type){
				case "CREATE": return (new jSQLCreateQuery).init.apply(self, arguments); break;
				case "UPDATE": return (new jSQLUpdateQuery).init.apply(self, arguments); break;
				case "SELECT": return (new jSQLSelectQuery).init.apply(self, arguments); break;
				case "INSERT": return (new jSQLInsertQuery).init.apply(self, arguments); break;
				case "DROP": return (new jSQLDropQuery).init.apply(self, arguments); break;
				case "DELETE": return (new jSQLDeleteQuery).init.apply(self, arguments); break;
			}
		};
		
		self.ifNotExists = function(){
			switch(self.type){
				case "CREATE": return (new jSQLCreateQuery).ifNotExists.apply(self, arguments); break;
				case "UPDATE": return (new jSQLUpdateQuery).ifNotExists.apply(self, arguments); break;
				case "SELECT": return (new jSQLSelectQuery).ifNotExists.apply(self, arguments); break;
				case "INSERT": return (new jSQLInsertQuery).ifNotExists.apply(self, arguments); break;
				case "DROP": return (new jSQLDropQuery).ifNotExists.apply(self, arguments); break;
				case "DELETE": return (new jSQLDeleteQuery).ifNotExists.apply(self, arguments); break;
			}
		};
		
		self.execute = function(){
			switch(self.type){
				case "CREATE": return (new jSQLCreateQuery).execute.apply(self, arguments); break;
				case "UPDATE": return (new jSQLUpdateQuery).execute.apply(self, arguments); break;
				case "SELECT": return (new jSQLSelectQuery).execute.apply(self, arguments); break;
				case "INSERT": return (new jSQLInsertQuery).execute.apply(self, arguments); break;
				case "DROP": return (new jSQLDropQuery).execute.apply(self, arguments); break;
				case "DELETE": return (new jSQLDeleteQuery).execute.apply(self, arguments); break;
			}
		};
		
		self.fetch = function(){
			switch(self.type){
				case "CREATE": return (new jSQLCreateQuery).fetch.apply(self, arguments); break;
				case "UPDATE": return (new jSQLUpdateQuery).fetch.apply(self, arguments); break;
				case "SELECT": return (new jSQLSelectQuery).fetch.apply(self, arguments); break;
				case "INSERT": return (new jSQLInsertQuery).fetch.apply(self, arguments); break;
				case "DROP": return (new jSQLDropQuery).fetch.apply(self, arguments); break;
				case "DELETE": return (new jSQLDeleteQuery).fetch.apply(self, arguments); break;
			}
		};
		
		self.fetchAll = function(){
			switch(self.type){
				case "CREATE": return (new jSQLCreateQuery).fetchAll.apply(self, arguments); break;
				case "UPDATE": return (new jSQLUpdateQuery).fetchAll.apply(self, arguments); break;
				case "SELECT": return (new jSQLSelectQuery).fetchAll.apply(self, arguments); break;
				case "INSERT": return (new jSQLInsertQuery).fetchAll.apply(self, arguments); break;
				case "DROP": return (new jSQLDropQuery).fetchAll.apply(self, arguments); break;
				case "DELETE": return (new jSQLDeleteQuery).fetchAll.apply(self, arguments); break;
			}
		};
		
		self.values = function(){
			switch(self.type){
				case "CREATE": return (new jSQLCreateQuery).values.apply(self, arguments); break;
				case "UPDATE": return (new jSQLUpdateQuery).values.apply(self, arguments); break;
				case "SELECT": return (new jSQLSelectQuery).values.apply(self, arguments); break;
				case "INSERT": return (new jSQLInsertQuery).values.apply(self, arguments); break;
				case "DROP": return (new jSQLDropQuery).values.apply(self, arguments); break;
				case "DELETE": return (new jSQLDeleteQuery).values.apply(self, arguments); break;
			}
		};
		
		self.set = function(){
			switch(self.type){
				case "CREATE": return (new jSQLCreateQuery).set.apply(self, arguments); break;
				case "UPDATE": return (new jSQLUpdateQuery).set.apply(self, arguments); break;
				case "SELECT": return (new jSQLSelectQuery).set.apply(self, arguments); break;
				case "INSERT": return (new jSQLInsertQuery).set.apply(self, arguments); break;
				case "DROP": return (new jSQLDropQuery).set.apply(self, arguments); break;
				case "DELETE": return (new jSQLDeleteQuery).set.apply(self, arguments); break;
			}
		};
		
		self.where = function(){
			switch(self.type){
				case "CREATE": return (new jSQLCreateQuery).where.apply(self, arguments); break;
				case "UPDATE": return (new jSQLUpdateQuery).where.apply(self, arguments); break;
				case "SELECT": return (new jSQLSelectQuery).where.apply(self, arguments); break;
				case "INSERT": return (new jSQLInsertQuery).where.apply(self, arguments); break;
				case "DROP": return (new jSQLDropQuery).where.apply(self, arguments); break;
				case "DELETE": return (new jSQLDeleteQuery).where.apply(self, arguments); break;
			}
		};
		
		self.from = function(){
			switch(self.type){
				case "CREATE": return (new jSQLCreateQuery).from.apply(self, arguments); break;
				case "UPDATE": return (new jSQLUpdateQuery).from.apply(self, arguments); break;
				case "SELECT": return (new jSQLSelectQuery).from.apply(self, arguments); break;
				case "INSERT": return (new jSQLInsertQuery).from.apply(self, arguments); break;
				case "DROP": return (new jSQLDropQuery).from.apply(self, arguments); break;
				case "DELETE": return (new jSQLDeleteQuery).from.apply(self, arguments); break;
			}
		};
	}
	
	////////////////////////////////////////////////////////////////////////////
	// jSQL Query Type constructors ////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////
	
	function jSQLDeleteQuery(){
		this.init = function(tablename){
			if(undefined === jSQL.tables[tablename])
				throw "Table: "+tablename+" doesn't exist.";
			this.table = this.table = jSQL.tables[tablename];
			return this;
		};
		this.execute = function(){ 
			var results = [];
			for(var i=0; i<this.table.data.length; i++){
				if(this.whereClause.LIMIT > 0 && results.length == this.whereClause.LIMIT) break;
				// LOOPING ROWS
				if(this.whereClause.finalConditions.length < 1){
					results.push(i);
				}else{
					var addToResults = false;
					var x = this.whereClause.finalConditions.length;
					while(x--){
						// LOOP THROUGH CONDITION SETS
						var conditions = this.whereClause.finalConditions[x];
						var safeCondition = true;
						var ii = conditions.length;
						while(ii--){
							// LOOP THROUGH EACH CONDITION IN THE SET
							var condition = conditions[ii];
							switch(condition.type){
								case ">": 
									if(isNaN(parseFloat(this.table.data[i][this.table.colmap[condition.col]])) || this.table.data[i][this.table.colmap[condition.col]] < condition.value)
										safeCondition = false;
									break;
								case "<": 
									if(isNaN(parseFloat(this.table.data[i][this.table.colmap[condition.col]])) || this.table.data[i][this.table.colmap[condition.col]] > condition.value)
										safeCondition = false;
									break;
								case "=": 
									if(this.table.data[i][this.table.colmap[condition.col]] != condition.value)
										safeCondition = false;
									break;
								case "!=": break;
									if(this.table.data[i][this.table.colmap[condition.col]] == condition.value)
										safeCondition = false;
									break;
								case "%%": 
									if(this.table.data[i][this.table.colmap[condition.col]].indexOf(condition.value) < 0)
										safeCondition = false;
									break;
								case "%-": 
									if(this.table.data[i][this.table.colmap[condition.col]].indexOf(condition.value) != this.table.data[i][this.table.colmap[condition.col]].length - condition.value.length)
										safeCondition = false;
									break;
								case "-%": 
									if(this.table.data[i][this.table.colmap[condition.col]].indexOf(condition.value) != 0)
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
						results.push(i);
					}
				}
			}
			
			// this.table.data[i]
			var newData = []; var newResults=[];
			for(var r=results.length; r--;){
				var index = results[r];
				for(var i=this.table.data.length; i--;){
					if(i===index) newResults.push(this.table.data[i]);
					else newData.push(this.table.data[i]);
				}
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
		this.values = function(){ throw "values() is not a valid method for a delete query"; };
		this.ifNotExists = function(){ throw "ifNotExists() is not a valid method for a delete query"; };
		this.set = function(){ throw "set() is not a valid method for a delete query"; };
		this.from = function(){ throw "from() is not a valid method for a delete query"; };
	}
	
	function jSQLDropQuery(){
		this.init = function(tablename){
			this.tablename = tablename;
			return this;
		};
		this.execute = function(){ 
			if(undefined === jSQL.tables[this.tablename]) throw "Table "+this.tablename+" does not exist.";
			// Delete the table
			delete jSQL.tables[this.tablename];
			return this; 
		};
		this.fetch = function(){ return null; };
		this.fetchAll = function(){ return []; };
		this.values = function(){ throw "values() is not a valid method for a drop query"; };
		this.ifNotExists = function(){ throw "ifNotExists() is not a valid method for a drop query"; };
		this.set = function(){ throw "set() is not a valid method for a drop query"; };
		this.where = function(){ throw "where() is not a valid method for a drop query"; };
		this.from = function(){ throw "from() is not a valid method for a drop query"; };
	}
	
	function jSQLInsertQuery(){
		
		this.init = function(table){
			this.table = table;
			return this;
		};
		
		this.values = function(data){
			if(undefined === jSQL.tables[this.table])
				throw "Table: "+this.table+" doesn't exist.";
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
			jSQL.tables[this.table].insertRow(this.data);
		};
		this.fetch = function(){ return null; };
		this.fetchAll = function(){ return []; };
		this.ifNotExists = function(){ throw "ifNotExists() is not a valid method for an insert query"; };
		this.set = function(){ throw "set() is not a valid method for an insert query"; };
		this.where = function(){ throw "where() is not a valid method for an insert query"; };
		this.from = function(){ throw "from() is not a valid method for an insert query"; };
	}
	
	function jSQLSelectQuery(){

		this.init = function(columns){
			this.columns = Array.isArray(columns) ? columns : [columns];
			return this;
		};
		
		this.from = function(table){
			if(undefined === jSQL.tables[table])
				throw "Table: "+table+" doesn't exist.";
			this.table = jSQL.tables[table];
			if(this.columns[0] == "*") this.columns = this.table.columns;
			return this;
		};
		
		this.where = function(column){
			return this.whereClause.where(column);
		};
		
		this.execute = function(){
			var results = [];
			for(var i=0; i<this.table.data.length; i++){
				if(this.whereClause.LIMIT > 0 && results.length == this.whereClause.LIMIT) break;
				// LOOPING ROWS
				if(this.whereClause.finalConditions.length < 1){
					// IF THERE ARE NO CONDITIONS, ADD ROW TO RESULT SET
					var row = {};
					for(var n=0; n<this.columns.length; n++){
						row[this.columns[n]] = this.table.data[i][this.table.colmap[this.columns[n]]];
					}
					results.push(row);
				}else{
					var addToResults = false;
					var x = this.whereClause.finalConditions.length;
					while(x--){
						// LOOP THROUGH CONDITION SETS
						var conditions = this.whereClause.finalConditions[x];
						var safeCondition = true;
						var ii = conditions.length;
						while(ii--){
							// LOOP THROUGH EACH CONDITION IN THE SET
							var condition = conditions[ii];
							switch(condition.type){
								case ">": 
									if(isNaN(parseFloat(this.table.data[i][this.table.colmap[condition.col]])) || this.table.data[i][this.table.colmap[condition.col]] < condition.value)
										safeCondition = false;
									break;
								case "<": 
									if(isNaN(parseFloat(this.table.data[i][this.table.colmap[condition.col]])) || this.table.data[i][this.table.colmap[condition.col]] > condition.value)
										safeCondition = false;
									break;
								case "=": 
									if(this.table.data[i][this.table.colmap[condition.col]] != condition.value)
										safeCondition = false;
									break;
								case "!=": break;
									if(this.table.data[i][this.table.colmap[condition.col]] == condition.value)
										safeCondition = false;
									break;
								case "%%": 
									if(this.table.data[i][this.table.colmap[condition.col]].indexOf(condition.value) < 0)
										safeCondition = false;
									break;
								case "%-": 
									if(this.table.data[i][this.table.colmap[condition.col]].indexOf(condition.value) != this.table.data[i][this.table.colmap[condition.col]].length - condition.value.length)
										safeCondition = false;
									break;
								case "-%": 
									if(this.table.data[i][this.table.colmap[condition.col]].indexOf(condition.value) != 0)
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
						for(var n=0; n<this.columns.length; n++){
							row[this.columns[n]] = this.table.data[i][this.table.colmap[this.columns[n]]];
						}
						results.push(row);
					}
				}
			}
			if(this.whereClause.sortColumn.length > 0){
				results.sort(function(a, b){

					return (function srrrrt(i){
						if(undefined === this.whereClause.sortColumn[i]) return 0;
						if(a[this.whereClause.sortColumn[i]] < b[this.whereClause.sortColumn[i]]) return -1;
						if(a[this.whereClause.sortColumn[i]] > b[this.whereClause.sortColumn[i]]) return 1;
						return srrrrt(i+1);
					}(0));

				});
				if(this.whereClause.sortDirection == "DESC") results.reverse();
			}
			this.resultSet = results;
			return this;
		};
		
		this.fetch = function(Mode){
			if(undefined === Mode) Mode = "ASSOC";
			Mode = Mode.toUpperCase();
			if(Mode !== "ASSOC" && Mode !== "ARRAY") throw "Fetch expects paramter one to be 'ASSOC', 'ARRAY', or blank";
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
			if(Mode !== "ASSOC" && Mode !== "ARRAY") throw "Fetch expects paramter one to be 'ASSOC', 'ARRAY', or blank";
			if(!this.resultSet.length) return false;

			var res = [];
			while(this.resultSet.length > 0){
				res.push(this.fetch(Mode));
			}
			return res;
		};
		
		this.values = function(){ throw "values() is not a valid method for a select query"; };
		this.ifNotExists = function(){ throw "ifNotExists() is not a valid method for a select query"; };
		this.set = function(){ throw "set() is not a valid method for a select query"; };
	}
	
	function jSQLUpdateQuery(){
		
		this.init = function(table){
			if(undefined === jSQL.tables[table])
				throw "Table: "+table+" doesn't exist.";
			this.table = this.table = jSQL.tables[table];
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
			
			var results = [];
			for(var i=0; i<this.table.data.length; i++){
				if(this.whereClause.LIMIT > 0 && results.length == this.whereClause.LIMIT) break;
				// LOOPING ROWS
				if(this.whereClause.finalConditions.length < 1){
					// IF THERE ARE NO CONDITIONS, ADD ROW TO RESULT SET
					var row = {};
					for(var n=0; n<this.columns.length; n++){
						this.table.data[i][this.table.colmap[this.columns[n]]] = this.newvals[this.columns[n]];
						row[this.columns[n]] = this.table.data[i][this.table.colmap[this.columns[n]]];
					}
					results.push(row);
				}else{
					var addToResults = false;
					var x = this.whereClause.finalConditions.length;
					while(x--){
						// LOOP THROUGH CONDITION SETS
						var conditions = this.whereClause.finalConditions[x];
						var safeCondition = true;
						var ii = conditions.length;
						while(ii--){
							// LOOP THROUGH EACH CONDITION IN THE SET
							var condition = conditions[ii];
							switch(condition.type){
								case ">": 
									if(isNaN(parseFloat(this.table.data[i][this.table.colmap[condition.col]])) || this.table.data[i][this.table.colmap[condition.col]] < condition.value)
										safeCondition = false;
									break;
								case "<": 
									if(isNaN(parseFloat(this.table.data[i][this.table.colmap[condition.col]])) || this.table.data[i][this.table.colmap[condition.col]] > condition.value)
										safeCondition = false;
									break;
								case "=": 
									if(this.table.data[i][this.table.colmap[condition.col]] != condition.value)
										safeCondition = false;
									break;
								case "!=": break;
									if(this.table.data[i][this.table.colmap[condition.col]] == condition.value)
										safeCondition = false;
									break;
								case "%%": 
									if(this.table.data[i][this.table.colmap[condition.col]].indexOf(condition.value) < 0)
										safeCondition = false;
									break;
								case "%-": 
									if(this.table.data[i][this.table.colmap[condition.col]].indexOf(condition.value) != this.table.data[i][this.table.colmap[condition.col]].length - condition.value.length)
										safeCondition = false;
									break;
								case "-%": 
									if(this.table.data[i][this.table.colmap[condition.col]].indexOf(condition.value) != 0)
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
						for(var n=0; n<this.columns.length; n++){
							this.table.data[i][this.table.colmap[this.columns[n]]] = this.newvals[this.columns[n]];
							row[this.columns[n]] = this.table.data[i][this.table.colmap[this.columns[n]]];
						}
						results.push(row);
					}
				}
			}
			this.resultSet = results;
			return this;
		};
		
		this.fetch = function(){ return null; };
		this.fetchAll = function(){ return []; };
		this.values = function(){ throw "values() is not a valid method for an update query"; };
		this.ifNotExists = function(){ throw "ifNotExists() is not a valid method for an update query"; };
		this.from = function(){ throw "from() is not a valid method for an update query"; };
	}
	
	function jSQLCreateQuery(){
		this.init = function(tablename, columns, types){
			this.tablename = tablename;
			this.columns = columns;
			this.coltypes = types;
			return this;
		};
		this.ifNotExists = function(){ this.INEFlag=true; return this; };
		this.execute = function(data){ 
			if(undefined !== data) this.data = data; 
			if(!(this.INEFlag && jSQL.tables.hasOwnProperty(this.tablename)))
				window.jSQL.tables[this.tablename] = new jSQLTable(this.tablename, this.columns, this.data, this.coltypes);
			return this;
		};
		this.fetch = function(){ return null; };
		this.fetchAll = function(){ return []; };
		this.values = function(){ throw "values() is not a valid method for a create query"; };
		this.set = function(){ throw "set() is not a valid method for a create query"; };
		this.where = function(){ throw "where() is not a valid method for a create query"; };
		this.from = function(){ throw "from() is not a valid method for a create query"; };
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
		var convertToCol = function(c){
			for(var i=0; i<jSQL.tables[table].columns.length; i++)
				if(removeQuotes(c.toUpperCase()) == jSQL.tables[table].columns[i].toUpperCase())
					return jSQL.tables[table].columns[i];
			throw c+" column not found in "+table+" table";
		};
				
		// A helper function that extracts values from a string of
		// quoted, comma separated values, taking into account escaped chars
		var getNextQueryVals = function(str) {
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
				}else if (str[i] !== " " && str[i] !== ",") {
					return vals;
				}
			}
			return vals;
		};
		
		// A helper function that gets column/value pairs from an update query
		var getColValPairs = function(str){
			var parts = str.split(',');

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
										throw 'Expected number or quoted string';
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
				if(val !== '') newVals[removeQuotes(col)] = isNum ? parseFloat(val) : val;
			}
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
							ccc = convertToCol(words.shift());
						}catch(ex){
							return new (function(error){
								this.execute = function(){ throw error; };
								this.fetch = function(){ throw error; };
								this.fetchAll = function(){ throw error; };
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
						var ccc;
						try{
							ccc = convertToCol(words.shift());
						}catch(ex){
							throw ex.message;
						}
						query = query.or(ccc);
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
				}
			}
			return query;
		};

		// Remove excess whitespace, linebreaks
		query = query.replace(/(\r\n|\n|\r)/gm," ").replace(/ +(?= )/g,'').trim();
		
		// Break words into uppercase array
		var words = query.split(" ");
		
		switch(words.shift().toUpperCase()){
			case "DELETE":
				// Next Word should be "TABLE"
				if(words.shift().toUpperCase() !== "FROM") throw "Unintelligible query. Expected 'TABLE'";
				
				// Next word should be the table name
				var table = removeQuotes(words.shift());
				if(undefined === jSQL.tables[table]) throw "Table "+table+" does not exist.";
				
				var query = jSQL.deleteFrom(table);
				query = parseWhereClause(query, words);
				
				return query;
				
				break;
			
			case "DROP":				
				
				// Next Word should be "TABLE"
				if(words.shift().toUpperCase() !== "TABLE") throw "Unintelligible query. Expected 'TABLE'";

				// Next word should be the table name
				var table = removeQuotes(words.shift());
				if(undefined === jSQL.tables[table]) throw "Table "+table+" does not exist.";
				
				return jSQL.dropTable(table);
				
				break;
				
			case "INSERT": 
				
				var table, cols=[], values = [];

				// Next Word should be "INTO"
				if(words.shift().toUpperCase() !== "INTO") throw "Unintelligible query. Expected 'INTO'";

				// Next word should be the table name
				table = removeQuotes(words.shift());
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
				
				var w = words.join(' ');
				values = getNextQueryVals(w);

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

				//jSQL.tables[table].insertRow(data);
				return jSQL.insertInto(table).values(data);
				
				break;
			case "CREATE": 
				var params = {};
				var table, c, cols = [],ine=false;
				// Next Word should be "TABLE"
				if(words.shift().toUpperCase() !== "TABLE") throw "Unintelligible query. Expected 'TABLE'";

				// get the column definition part of the table
				var str = words.join(" ");
				var conlumnDef = "";
				var opencount = (str.match(/\(/g) || []).length;
				var closecount = (str.match(/\)/g) || []).length;
				if(opencount !== closecount) throw "Invalid Column definition.";
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
					if(words.shift().toUpperCase() !== "NOT") throw "Unintelligible query. Expected 'NOT'";
					if(words.shift().toUpperCase() !== "EXISTS") throw "Unintelligible query. Expected 'EXISTS'";
					table = removeQuotes(words.shift());
					ine=true;
				} 

				params[table] = {};

				// Get column definitions
				var parts = conlumnDef.split(",");
				for(var i=0;i<parts.length;i++){
					var str = parts[i];
					while((str.match(/\(/g) || []).length !== (str.match(/\)/g) || []).length){
						str += ","+parts[i+1];
						parts[i+1] = "";
						parts[i] = str;
					}
					if(str.trim()!=="") cols.push(str.trim());
				}

				// loop and apply column definitions to params object
				for(var i=0; i<cols.length; i++){
					var colparts = cols[i].split(" ");
					var colname = colparts.shift();
					params[table][colname] = {type:"AMBI",args:[]};
					if(colparts.length){
						var typename = colparts.shift().toUpperCase();
						if((typename.match(/\(/g) || []).length){ // typename contains opening (
							while(!(typename.match(/\)/g) || []).length){ // make sure it has a closing one
								if(!colparts.length) throw "Invalid query, expected ')'";
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
							if(opencount !== closecount) throw "Invalid Arg definition: "+typename;
							if(opencount > 0)
								argsDef = typename.substring(typename.indexOf("(")+1, typename.lastIndexOf(")"));
						}
						if(argsDef.trim()!==""){  
							var a = argsDef.split(","); 
							for(var d=0;d<a.length; d++)
								if(a[d].trim()!=="")
								  params[table][colname].args.push(a[d].trim());
						}
						params[table][colname].type = typename.split("(")[0].trim().toUpperCase();
					}
				}		
				var query = jSQL.createTable(params);
				if(ine) query.ifNotExists();
				return query;
				
				break;
			case "UPDATE":
				// Do stuff to parse update query
				var table, colValPairs, query, orderColumns = [];
				table = removeQuotes(words.shift());
				
				var set = words.shift().toUpperCase();
				if (set !== "SET")
					throw "Unintelligible query. Expected 'SET.'";
				
				var parts = getColValPairs(words.join(' '));
				query = jSQL.update(table).set(parts.newVals);
				query = parseWhereClause(query, parts.whereClause.split(' '));
				return query;
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
				if(undefined === jSQL.tables[table]) return new (function(error){
					this.execute = function(){ throw error; };
					this.fetch = function(){ throw error; };
					this.fetchAll = function(){ throw error; };
				})("Table: "+table+" does not exist.");

				if(columns.length == 1 && columns[0] == "*") columns = '*';
				else for(var i=0;i<columns.length;i++){
					try{
						columns[i] = convertToCol(columns[i]);
					}catch(ex){
						throw ex.message;
					}
				}

				// Generate the query object
				query = jSQL.select(columns).from(table);
				query = parseWhereClause(query, words);
				
				return query;
				break;
				
			default:
				throw "Unintelligible query. Error near: "+words[0];
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
		self.finalConditions = [];
		self.sortColumn = [];
		self.sortDirection = "ASC";

		self.where = function(column){
			if(self.pendingColumn !== "") throw "Must add a conditional before adding another 'Where' condition.";
			if('string' != typeof column) throw "Column name must be a string.";
			self.pendingColumn = column;
			return self;
		};

		self.equals = function(value){
			if(self.pendingColumn == "") throw "Must add a 'where' clause before the 'equals' call.";
			self.conditions.push({col: self.pendingColumn, type: '=', value: value});
			self.pendingColumn = "";
			return self;
		};
		
		self.preparedLike = function(){
			if(self.pendingColumn == "") throw "Must add a 'where' clause before the 'preparedLike' call.";
			self.conditions.push({col: self.pendingColumn, type: 'pl', value: "?"});
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
				IDBTransaction = window.hasOwnProperty('IDBTransaction') ? window.IDBTransaction : window.webkitIDBTransaction ;
				IDBKeyRange = window.hasOwnProperty('IDBKeyRange') ? window.IDBKeyRange : window.webkitIndexedDB;
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
			var transaction = self.db.transaction([model], undefined === IDBTransaction.READ_WRITE ? 'readwrite' : IDBTransaction.READ_WRITE);
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
			var transaction = self.db.transaction([model], undefined === IDBTransaction.READ_WRITE ? 'readwrite' : IDBTransaction.READ_WRITE), store, request;
			transaction.onerror = function(){ throw "Could not initiate a transaction"; };;
			store = transaction.objectStore(model);
			request = store.clear();
			request.onerror = function(){ throw "Could not initiate a request"; };;
			request.onsuccess = successCallback;
		};

		// Get all data from the datastore
		self.select = function(model, successCallback) {
			if("function" !== typeof successCallback) successCallback = function(){};
			var transaction = self.db.transaction([model], undefined === IDBTransaction.READ_ONLY ? 'readonly' : IDBTransaction.READ_ONLY), store, request, results = [];
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
						row[n] = jSQL.tables[tbl].normalizeColumnStoreValue(n, row[n]);
					}
					rows.push({table: tbl, data:JSON.stringify(row), colTypes: JSON.stringify(jSQL.tables[tbl].types)});
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
			
			// Wait for the schema to be set up
			(function waitForSchema(tries){
				try{
					self.api.select("jSQL_data_schema", function(r){
						jSQL.tables = {};
						if(r.length === 0){
							self.isLoading = false;
							self.loaded = true;
							while(self.loadingCallbacks.length) 
								self.loadingCallbacks.shift()();
							return;
						}
						for(var i=r.length; i--;){
							var tablename = r[i].table;
							var rowdata = JSON.parse(r[i].data);
							var colTypes = JSON.parse(r[i].colTypes);
							// Create the table in memory if it doesn't exist yet
							if(undefined === jSQL.tables[tablename]){
								var cols = [];
								for(var c in rowdata)
									if(rowdata.hasOwnProperty(c))
										cols.push(c);
								jSQL.createTable(tablename, cols, colTypes).execute();
							}
							
							for(var c in rowdata){
								if(!rowdata.hasOwnProperty(c)) continue;
								rowdata[c] = jSQL.tables[tablename].normalizeColumnFetchValue(c, rowdata[c]);
							}
							
							jSQL.tables[tablename].insertRow(rowdata);
						}
						
						self.isLoading = false;
						self.loaded = true;
						while(self.loadingCallbacks.length) 
							self.loadingCallbacks.shift()();
						return;
					});
				
				}catch(e){
					if(tries > 500){
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
	
	////////////////////////////////////////////////////////////////////////////
	// Syntactic sugar /////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////
	
	function createTable(name, columnsOrData, types){
		
		// allow for all params to be passed in a single object
		// jSQL.createTable({myTable: {
		//		ID: { type: "INT", args: [] }, 
		//		Name: { type: "VARCHAR", args: [30] },
		// }})
		if(undefined === columnsOrData && undefined === types && "object" === typeof name){
			columnsOrData = [];
			types = [];
			for(var tblname in name){
				if(!name.hasOwnProperty(tblname))continue;
				var columnDefs = name[tblname];
				name = tblname;
				for(var col in columnDefs){
					if(!columnDefs.hasOwnProperty(col)) continue;
					columnsOrData.push(col);
					types.push({
						type: columnDefs[col].type, 
						args: (undefined===columnDefs[col].args ? []:columnDefs[col].args)
					});
				}
				break;
			}
		}
		
		// if a single column was provided
		if(!Array.isArray(columnsOrData)) columnsOrData=[columnsOrData];
		
		return new jSQLQuery("CREATE").init(name, columnsOrData, types);
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
	// Exposed Methods /////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////
	
	return {
		version: 1.3,
		tables: {},
		query: jSQLParseQuery,
		createTable: createTable,
		dropTable: dropTable,
		select: select,
		update: update,
		deleteFrom: deleteFrom,
		insertInto: insertInto,
		types: new jSQLDataTypeList(),
		persist: persistenceManager.persist,
		load: persistenceManager.load
	};
	
}());
