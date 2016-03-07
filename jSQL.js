

;window.jSQL = new (function(){
	var self = this;
	self.tables = {};
	
	self.createTable = function(name, columns, data){
		self.tables[name] = new jSQLTable(name, columns, data);
		return self.tables[name];
	};
	
	self.select = function(columns){
		return new jSQLQueryBuilder(columns);
	};
});

function jSQLTable(name, columns, data){
	var self = this;	
	self.name = "";
	self.columns = [];
	self.data = [];
	self.colmap = {};
	
	self.init = function(name, columns, data){
		self.name = name;
		if(Array.isArray(columns) && Array.isArray(columns[0]) && 'undefined' == typeof data)
			throw "Must pass the column names as an array or pass data as an object with the column names as the title.";
		if( Array.isArray(columns) && 
			!Array.isArray(columns[0]) && 
			typeof columns[0] == "object" && 
			typeof data == 'undefined'
		){
			var cols = [];
			for(var name in columns[0])
				if(columns[0].hasOwnProperty(name))
					cols.push(name);
			data = columns;
			columns = cols;
		}
		if(typeof columns != "object" || !Array.isArray(columns)) throw "Columns must be an array.";
		self.columns = columns;
		for(var i=0; i<columns.length; i++) self.colmap[columns[i]] = i;
		if(typeof data !== 'undefined') self.loadData(data);
	};
	
	self.loadData = function(data){
		if(typeof data != "object" || !Array.isArray(data))
			throw "Data must be an array.";
		var i = data.length;
		var c  = self.columns.length;
		while(i--){
			var row = [];
			if(Array.isArray(data[i])){
				for(var n=0; n<data[i].length; n++)
					if(n<c) row.push(data[i][n]);
				while(row.length < c) row.push(null);
			}else if(typeof data[i] == 'object'){
				for(var n=0; n<c; n++)
					row.push(typeof data[i][self.columns[n]] == 'undefined' ? null : data[i][self.columns[n]]);
			}else throw "Data not structured properly.";
			self.data.push(row);
		}
	};
	
	self.select = function(columns){
		return new jSQLTableSelect(self, columns);
	};
	
	self.init(name, columns, data);
}

function jSQLTableSelect(table, columns){
	var self = this;
	self.table = null;
	self.columns = [];
	self.pendingColumn = "";
	self.conditions = [];
	
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
		if(self.pendingColumn == "") throw "Must add a 'where' clause before the 'equals' call.";
		self.conditions.push({col: self.pendingColumn, type: '!=', value: value});
		self.pendingColumn = "";
		return self;
	};
	
	self.contains = function(value){
		if(self.pendingColumn == "") throw "Must add a 'where' clause before the 'equals' call.";
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
	
	self.fetch = function(){
		var results = [];
		if(self.conditions.length > 0) self.finalConditions.push(self.conditions);
		for(var i=0; i<self.table.data.length; i++){
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

function jSQLQueryBuilder(columns){
	var self = this;
	self.columns = columns;
	self.from = function(table){
		if('undefined' == typeof jSQL.tables[table])
			throw "Table: "+table+" doesn't exist.";
		return jSQL.tables[table].select(self.columns);
	};
}