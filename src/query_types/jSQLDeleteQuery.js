
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
