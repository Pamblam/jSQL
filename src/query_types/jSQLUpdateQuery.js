
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