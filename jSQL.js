/**
 * jSQL - javaScript Query Language
 * A Javascript based, user hosted database alternative (or accessory)
 * @author Robert Parham
 * @license - WTFPL v2 wtfpl.net
 */

;window.jSQL = new (function(){
	var self = this;
	self.tables = {};
	
	self.query = function(query){
		return jSQLParseQuery(query);
	};
	
	self.createTable = function(name, columns, data){
		self.tables[name] = new jSQLTable(name, columns, data);
		return true;
	};
	
	self.select = function(columns){
		return new jSQLBuildSelectQuery(columns);
	};
	
	self.insertInto = function(tablename){
		return new jSQLTableInsert(tablename);
	};
});

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
		
		// First param is array of arrays, no third param
		//  - Create the table only, no data
		if(Array.isArray(columns) && 'undefined' == typeof data){
			// Some validation
			var i=0; while(i--) if('string' != typeof columns) throw "Column names must be strings.";
		}
		
		// Second param is array of objects
		// - Create table from first object
		// - Generate data (3rd) param
		if(Array.isArray(columns) &&  typeof columns[0] == "object"){
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
		if(typeof data !== 'undefined') self.loadData(data);
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
		//	- Insert the rows into the columns specified by the property names
		// Fill in any missing columns with null
		// Ignore any extra colunmns
		if(Array.isArray(data)){
			for(var n=0; n<data.length; n++)
				if(n<self.columns.length) row.push(data[n]);
			while(row.length < self.columns.length) row.push(null);
		}else if(typeof data == 'object'){
			for(var n=0; n<self.columns.length; n++)
				row.push(typeof data[self.columns[n]] == 'undefined' ? null : data[self.columns[n]]);
		}else throw "Data not structured properly.";
		self.data.push(row);
	};
	
	self.init(name, columns, data);
}

// Parse the query string and return the query object
function jSQLParseQuery(query){
	
	// Remove excess whitespace
	query = query.trim();
	while(query.indexOf("  ") > 0) 
		query.replace("  ", " ");
		
	// Break words into uppercase array
	var words = query.split(" ");
	
	switch(words.shift().toUpperCase()){
		case "INSERT": console.log("@todo parse INSERT statement"); break;
		case "CREATE": console.log("@todo parse CREATE statement"); break;
		case "SELECT":
			var table, columns, query;
			var upperWords = query.toUpperCase().split(" "); upperWords.shift();
			var fromIndex = upperWords.indexOf("FROM");
			if(fromIndex < 0) throw "Unintelligible query. Expected 'FROM'";
			columns = words.splice(0, fromIndex);
			for(var i=columns.length; i--;)
				while(columns[i].indexOf(",") == columns[i].length-1)
					columns[i] = columns[i].substr(0, columns[i].length-1);
			words.shift(); // pop the FROM off
			table = words.shift();
			
			// Remove surrounding quotes from a string
			var removeQuotes = function(str){
				var quotes = ['"', "'", "`"];
				for (var i = quotes.length; i--; )
					if (str.substr(0, 1) == quotes[i] && str.substr(str.length - 1, 1) == quotes[i])
						return str.substr(1, str.length - 2);
				return str;
			};
			
			for(var name in jSQL.tables){
				if(!jSQL.tables.hasOwnProperty(name)) continue;
				if(name.toUpperCase() == removeQuotes(table.toUpperCase())){
					table = name;
					break;
				}
			}
			if('undefined' == typeof jSQL.tables[table]) 
				throw "Table: "+table+" does not exist.";
			
			// Predcit the correct casing for column and table names
			var convertToCol = function(c){
				for(var i=0; i<jSQL.tables[table].columns.length; i++)
					if(removeQuotes(c.toUpperCase()) == jSQL.tables[table].columns[i].toUpperCase())
						return jSQL.tables[table].columns[i];
				throw c+" column not found in "+table+" table";
			};
			
			for(var i=0;i<columns.length;i++)
				columns[i] = convertToCol(columns[i]);
			
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
					case "!=":
					case "<>":
						query = query.doesNotEqual(removeQuotes(words.shift()));
						break;
					case "LIKE":
						var substr = words.shift();
						if(substr.substr(0,1)=="%" && substr.substr(substr.length-1,1)=="%"){
							query = query.contains(removeQuotes(substr.substr(1,substr.length-2)));
						}else alert("to do, other like queries");
						break;
					case "OR":
						query = query.or(convertToCol(words.shift()));
						break;
					case "LIMIT":
						query = query.limit(words.shift());
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
		if('undefined' == typeof jSQL.tables[table])
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
		if('undefined' == typeof jSQL.tables[table])
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
	
	self.contains = function(value){
		if(self.pendingColumn == "") throw "Must add a 'where' clause before the 'contains' call.";
		self.conditions.push({col: self.pendingColumn, type: '%', value: value});
		self.pendingColumn = "";
		return self;
	};
	
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
	
	self.fetch = function(){
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
							case "=": 
								if(self.table.data[i][self.table.colmap[condition.col]] != condition.value)
									safeCondition = false;
								break;
							case "!=": break;
								if(self.table.data[i][self.table.colmap[condition.col]] == condition.value)
									safeCondition = false;
								break;
							case "%": 
								if(self.table.data[i][self.table.colmap[condition.col]].indexOf(condition.value) < 0)
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
		return results;
	};
	
	self.init(table, columns);
}