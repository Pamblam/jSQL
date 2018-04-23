
function jSQLSelectQuery(){
	this.init = function(columns){
		var columns = Array.isArray(columns) ? columns : [columns];
		for(var i=columns.length; i--;){
			if("string" == typeof columns[i]) columns[i] = {name: columns[i], alias:columns[i]};
			if(string !== typeof columns[i].name) return _throw(new jSQL_Error("0073"));
			if(!columns[i].alias) columns[i].alias = columns[i].name;
		}
		this.columns = columns;
		return this;
	};
	this.from = function(table, alias){
		if(undefined === jSQL.tables[table]) return _throw(new jSQL_Error("0021"));
		this.selectTable = {name:table, alias:alias};
		
		// this.table = jSQL.tables[table];
		// account for this in the execute function
		// if(this.columns[0] == "*") this.columns = this.table.columns;
		return this;
	};
	this.join=function(table, alias){return this.innerJoin(table, alias);};
	this.innerJoin = function(table, alias){
		if(!alias) alias = table;
		if(undefined === jSQL.tables[table]) return _throw(new jSQL_Error("0021"));
		this.pendingJoin = {table: table, alias: alias, type: 'inner', onTable:null, onColumn:null, matchType: false, matchTable: null, matchColumn: null};
		return this;
	};
	this.on = function(table, column){
		var tableName;
		// make sure the given table is either pending join or already in the tables list
		if(!this.pendingJoin) return _throw(new jSQL_Error("0074"));
		var joinTableExists = false;
		if(this.selectTable.alias == table){
			tableName = this.selectTable.name;
			joinTableExists = true;
		}
		if(!joinTableExists && this.pendingJoin.alias == table){
			tableName = this.pendingJoin.table;
			joinTableExists = true;
		}
		if(!joinTableExists) return _throw(new jSQL_Error("0075"));
		if(!~jSQL.tables[tableName].columns.indexOf(column)) return _throw(new jSQL_Error("0013"));
		this.pendingJoin.onTable = table;
		this.pendingJoin.onColumn = column;
		return this;
	};
	this.equals = function(table, column){
		if(!this.pendingJoin) return _throw(new jSQL_Error("0076"));
		if(!this.pendingJoin.onTable) return _throw(new jSQL_Error("0077"));
		var joinTableExists = false;
		var tableName = false;
		if(this.selectTable.alias == table){
			tableName = this.selectTable.name;
			joinTableExists = true;
		}
		if(!joinTableExists && this.pendingJoin.alias == table){
			tableName = this.pendingJoin.table;
			joinTableExists = true;
		}
		if(!joinTableExists) return _throw(new jSQL_Error("0075"));
		if(!~jSQL.tables[tableName].columns.indexOf(column)) return _throw(new jSQL_Error("0013"));
		this.pendingJoin.matchTable = 'table';
		this.pendingJoin.matchcolumn = 'column';
		this.pendingJoin.matchType = 'equals';
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
