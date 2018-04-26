
function jSQLSelectQuery(){
	this.init = function(columns){
		var columns = Array.isArray(columns) ? columns : [columns];
		for(var i=columns.length; i--;){
			if("string" == typeof columns[i]) columns[i] = {table:null, name:columns[i], alias:columns[i]};
			if('string' !== typeof columns[i].name) return _throw(new jSQL_Error("0073"));
			if(!columns[i].alias) columns[i].alias = columns[i].name;
			if(!columns[i].table) columns[i].table = null;
		}
		this.columns = columns;
		return this;
	};
	this.from = function(table, alias){
		if(undefined === jSQL.tables[table]) return _throw(new jSQL_Error("0021"));
		this.table = jSQL.tables[table];
		if(alias) this.table.alias = alias;
		return this;
	};
	
	this.innerJoin = function(table, alias){
		if(!alias) alias = table;
		if(undefined === jSQL.tables[table]) return _throw(new jSQL_Error("0021"));
		this.pendingJoin = {table: table, alias: alias, type: 'inner', onTable:null, onColumn:null, matchType: false, matchTable: null, matchColumn: null};
		return this;
	};
	this.join=this.innerJoin;
	
	this.on = function(table, column){
		var tableName;
		// make sure the given table is either pending join or already in the tables list
		if(!this.pendingJoin) return _throw(new jSQL_Error("0074"));
		var joinTableExists = false;
		if(this.table.alias == table){
			tableName = this.table.name;
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
		if(this.table.alias == table){
			tableName = this.table.name;
			joinTableExists = true;
		}
		if(!joinTableExists && this.pendingJoin.alias == table){
			tableName = this.pendingJoin.table;
			joinTableExists = true;
		}
		if(!joinTableExists) return _throw(new jSQL_Error("0075"));
		if(!~jSQL.tables[tableName].columns.indexOf(column)) return _throw(new jSQL_Error("0013"));
		this.pendingJoin.matchTable = table;
		this.pendingJoin.matchColumn = column;
		this.pendingJoin.matchType = 'equals';
		
		return jSQLSelectQuery.processJoin(this);
	};
	this.where = function(column){
		jSQLSelectQuery.processColumns(this);
		return this.whereClause.where(column);
	};
	this.execute = function(){
		jSQLSelectQuery.processColumns(this);
		var resultRowIndexes = this.whereClause.getResultRowIndexes();
		
		var resultRows = [];
		for(var i=0; i<resultRowIndexes.length; i++)
			resultRows.push(this.table.data[resultRowIndexes[i]]);
		var results = []; 
		for(var i=0; i<resultRows.length; i++){
			var row = {};
			for(var n=0; n<this.columns.length; n++){
				row[this.columns[n].name] = resultRows[i][this.table.colmap[this.columns[n].name]]
			}
			results.push(row);
		}
		this.resultSet = results;
		
//		for(var i=0; i<this.tempTables.length; i++){
//			delete jSQL.tables[this.tempTables[i]];
//		}
//		this.tempTables=[];
		
		return this;
	};
	this.fetch = function(Mode){
		
		
		if(undefined === Mode) Mode = "ASSOC";
		Mode = Mode.toUpperCase();
		if(Mode !== "ASSOC" && Mode !== "ARRAY") return _throw(new jSQL_Error("0023"));
		if(!this.resultSet.length) return false;
		
		var row = this.resultSet.shift();
		
		var aliasmap = {};
		for(var i=0; i<this.columns.length; i++) aliasmap[this.columns[i].name] = this.columns[i].alias;

		for(var colName in row){
			if(row.hasOwnProperty(colName)){ 
				var r = this.table.normalizeColumnFetchValue(colName, row[colName]);
				delete row[colName];
				row[aliasmap[colName]] = r;
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

jSQLSelectQuery.processColumns = function(query){
	// check for * in column names
	for(var i=0; i<query.columns.length; i++){
		if(query.columns[i].name == "*"){
			var all_col = query.columns.splice(i, 1)[0];
			
			var tables = [];
			if(all_col.table){
				if(query.table.alias == all_col.table || query.table.name == all_col.table) tables.push(query.table.name);
				else if(query.pendingJoin){
					if(query.pendingJoin.table == all_col.table) tables.push(query.pendingJoin.table);
					else if(query.pendingJoin.alias == all_col.table) tables.push(query.pendingJoin.table);
					else if(query.pendingJoin.matchTable == all_col.matchTable) tables.push(query.pendingJoin.matchTable);
				}
			}else{
				tables.push(query.table.name);
				if(query.pendingJoin){
					if(query.pendingJoin.table && !~tables.indexOf(query.pendingJoin.table)) tables.push(query.pendingJoin.table);
					if(query.pendingJoin.onTable && !~tables.indexOf(query.pendingJoin.onTable)) tables.push(query.pendingJoin.onTable);
					if(query.pendingJoin.matchTable && !~tables.indexOf(query.pendingJoin.matchTable)) tables.push(query.pendingJoin.matchTable);
				}
			}
			
			for(var x=0; x<tables.length; x++){
				for(var n=0; n<jSQL.tables[tables[x]].columns.length; n++){
					query.columns.push({table:jSQL.tables[tables[x]], name:jSQL.tables[tables[x]].columns[n], alias:jSQL.tables[tables[x]].columns[n]});
				}
			}
			
		}
	}
};

jSQLSelectQuery.processJoin = function(query){
	// query.pendingJoin = 
	// {
	//		table: table, 
	//		alias: alias, 
	//		type: 'inner', 
	//		onTable:null, 
	//		onColumn:null, 
	//		matchType: false, 
	//		matchTable: null, 
	//		matchColumn: null
	// };
	// query.columns = [{table:null, name:columns[i], alias:columns[i]}]
	
	var i=0; for(i=0; i++;) if(!jSQL.tables["jt"+i]) break;
	var tname = "jt"+i;
	
	var columns = [];
	for(var i=0; i<query.columns.length; i++){
		var col = query.columns[i];
		col.table = tname;
		columns.push(col);
	}
	
	var tcols = [];
	var tdata = [];
	var types = [];
	var table1 = jSQL.tables[query.pendingJoin.onTable];
	var table2 = jSQL.tables[query.pendingJoin.matchTable];
	
	var matchColIndex1 = table1.colmap[query.pendingJoin.onColumn];
	var matchColIndex2 = table2.colmap[query.pendingJoin.matchColumn];
	
	// data
	for(var i=0; i<table1.data.length; i++){
		var row = [];
		var t1row = table1.data[i];
		var t2row = null;
		
		for(var n=0; !t2row && n<table2.data.length; n++){
			switch(query.pendingJoin.matchType){
				case 'equals':
				default:
					if(t1row[matchColIndex1] == table2.data[n][matchColIndex2]){
						t2row = table2.data[n];
					}
					break;
			}
		}
		
		switch(query.pendingJoin.type){
			case 'inner':
			default:
				if(t2row){
					row = t1row;
					for(var x=0; x<t2row.length; x++) row.push(t2row[x]);
				}
				break;
		}
		
		if(row.length) tdata.push(row);
	}
	 
	// types
	for(var i=0; i<table1.types.length; i++){
		var type = table1.types[i];
		type.null = true;
		types.push(type);
	}
	for(var i=0; i<table2.types.length; i++){
		var type = table2.types[i];
		type.null = true;
		types.push(type);
	}
	
	// columns
	for(var i=0; i<table1.columns.length; i++){
		tcols.push(table1.columns[i]);
	}
	for(var i=0; i<table2.columns.length; i++){
		tcols.push(table2.columns[i]);
	}
	
	jSQL.tables[tname] = new jSQLTable(tname, tcols, tdata, types, []);
	jSQL.tables[tname].isTemp = true;
	
	var q = jSQL.select(columns).from(tname);
	q.tempTables.push(tname);
	return q;
};