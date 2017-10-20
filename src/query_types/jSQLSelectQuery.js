
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
