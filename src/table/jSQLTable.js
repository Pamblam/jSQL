
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

	self.name = name;

	// If the types array does not exist, create it
	if(undefined === types) types = [];

	// If first param is array, no third param
	if(Array.isArray(columns) && undefined === data)
		// Create the data parameter from column param
		{data = columns; columns = [];}

	// If second param is array of objects
	// - Create table from first object
	// - Generate data (3rd) param
	if(Array.isArray(columns) && !Array.isArray(columns[0]) && typeof columns[0]==="object"){
		var cols = [], n;
		for(n in columns[0])
			if(columns[0].hasOwnProperty(n))
				cols.push(n);
		data = columns;
		columns = cols;
	}

	self.initColumns(columns, types);

	self.initKeys(keys, auto_increment);

	self.initAI(auto_increment);

	// Load the data, if there is any
	if(data !== undefined) self.loadData(data);
}

jSQLTable.prototype.initColumns = function(columns, types){
	// At this point, columns should be an array
	this.columns = columns;
	var i;
	
	// Fill any missing holes in the types array 
	// with "ambi" which means it can be any type
	for(i=0; i<columns.length; i++)
		this.types[i] = undefined === types[i] || undefined === types[i].type ? 
			{type:"ambi", args:[], default: undefined, null: true} : types[i];

	// Validate & normalize each type
	for(i=this.types.length; i--;){
		var type = this.types[i].type.toUpperCase();
		if(!jSQL.types.exists(type))
			return _throw(new jSQL_Error("0007"));
		this.types[i].type = type;
	}

	// Create a column map
	for(i=0; i<columns.length; i++) this.colmap[columns[i]] = i;
};

jSQLTable.prototype.initKeys = function(keys){
	// Set up keys if key data is provided
	var key;
	var keyTypes = ["primary", "unique"];
	for(var k=0; k<keys.length; k++){
		key=keys[k];
		if(!key.hasOwnProperty("column") || (!Array.isArray(key.column) && this.columns.indexOf(key.column) === -1)) return _throw(new jSQL_Error("0010"));
		if(Array.isArray(key.column)){
			for(var kk=0; kk<key.column.length; kk++){
				if(this.columns.indexOf(key.column[kk]) === -1) return _throw(new jSQL_Error("0010"));
			}
		}
		var type = key.hasOwnProperty('type') && keyTypes.indexOf(key.type.toLowerCase()) !== -1 ? key.type.toLowerCase() : "unique";
		if(type === "primary" && this.keys.primary.column !== false) return _throw(new jSQL_Error("0011"));
		if(type === "primary") this.keys.primary.column = key.column;
		if(type === "unique") this.keys.unique.push({column:key.column, map:{}});
	}
};

jSQLTable.prototype.initAI = function(auto_increment){
	// if there's an AI column
	if(auto_increment){
		var isInPKArray = Array.isArray(this.keys.primary.column) && this.keys.primary.column.indexOf(auto_increment) > -1;
		var isPK = this.keys.primary.column === auto_increment;
		var isInUKArrayArray = false;
		for(var i=this.keys.unique.length; i--;){
			var isInUKArray = Array.isArray(this.keys.unique[i].column) && this.keys.unique[i].column.indexOf(auto_increment) > -1;
			var isUK = this.keys.unique[i].column === auto_increment;
			if(isInUKArray || isUK) isInUKArrayArray = true;
		}
		if(isInPKArray || isPK || isInUKArrayArray){
			if(this.types[this.colmap[auto_increment]].type !== "INT") return _throw(new jSQL_Error("0066"));
			this.auto_inc_col = auto_increment;
		}else return _throw(new jSQL_Error("0065"));
	}
};

/* istanbul ignore next */
jSQLTable.prototype.renameColumn = function(oldname, newname){
	if(undefined === oldname || "string" !== typeof newname) return _throw(new jSQL_Error("0012"));
	if(this.columns.indexOf(oldname) < 0) return _throw(new jSQL_Error("0013"));
	// Update the columns
	this.columns.splice(this.columns.indexOf(oldname), 1, newname);
	// Update the primary keys
	if(this.keys.primary.column === oldname) this.keys.primary.column = newname;
	if(Array.isArray(this.keys.primary.column))
		for(var i=this.keys.primary.column.length; i--;)
			if(this.keys.primary.column[i] === oldname) this.keys.primary.column[i] = newname;
	// Update the unique keys
	for(var n=this.keys.unique.length; n--;){
		if(this.keys.unique[n].column === oldname) this.keys.unique[n].column = newname;
		if(Array.isArray(this.keys.unique[n].column))
			for(i=this.keys.unique[n].column.length; i--;)
				if(this.keys.unique[n].column[i] === oldname) this.keys.unique[n].column[i] = newname;
	}
	// Update colmap
	var colmap = {};
	for(var col in this.colmap)
		if(this.colmap.hasOwnProperty(col))
			if(col === oldname) colmap[newname] = this.colmap[col];
			else colmap[col] = this.colmap[col];
	this.colmap = colmap;
	// Update the AI column
	if(this.auto_inc_col === oldname) this.auto_inc_col = newname;
};

jSQLTable.prototype.addColumn = function(name, defaultVal, type){
	if(undefined === type || undefined === type.type)
		type = {type:"AMBI",args:[], null:true, default: undefined};
	type.type = type.type.toUpperCase();
	if(undefined === defaultVal) defaultVal = null;
	if('string' !== typeof name){ 
		var self = this;
		name = (function r(n){
			for(var i=0; i<self.columns.length; i++)
				if(self.columns[i]==="u"+n) return r(n+1);
			return "u"+n;
		}(0));
	}
	this.columns.push(name);
	var i=this.data.length; while(i--) this.data[i].push(defaultVal);
	this.colmap[name] = this.columns.length -1;
	if(!jSQL.types.exists(type.type))
		return _throw(new jSQL_Error("0007"));
	this.types.push(type);
};

// Load the dataset into the table
jSQLTable.prototype.loadData = function(data){

	// Dataset must be an Array of rows
	if(!Array.isArray(data)) return _throw(new jSQL_Error("0014"));

	// Loop columns and insert the data
	var i = data.length;
	while(i--) this.insertRow(data[i]);
};

jSQLTable.prototype.normalizeInsertRowData = function(data){
	var row = [], n;

	// If the row is an Array
	//	- Insert the data sequentially
	// If the row is an Object
	//	- Insert the rows into the columns specified by the property name
	// Fill in any missing columns in the dataset with null
	if(Array.isArray(data)){
		while(data.length > this.columns.length)
			this.addColumn();
		while(data.length < this.columns.length)
			data.push(null);
		for(n=0; n<data.length; n++)
			row.push(data[n]);
		while(row.length < this.columns.length) row.push(null);
	}else if(typeof data === 'object'){

		// Loop each column of the table
		for(n=0; n<this.columns.length; n++)
			// If the column doesn't exist in the data row..
			if(data[this.columns[n]] === undefined)
				// ..add an empty value for it in the data row
				data[this.columns[n]] = null;

		// Loop each column in the data row
		var self = this;
		for(var colname in data)
			if(!data.hasOwnProperty(colname)) continue;

			// If the data row column doesn't exist in the table..
			if(function(l){ while(l--) if(self.columns[l]===colname) return 0; return 1; }(this.columns.length)){
				// ...and there is already an undefined row title...
				if(this.columns.indexOf("u0") > -1){
					// ...let the undefined row inherit this title,
					this.renameColumn("u0", colname);
					// and shift the unknown column titles
					var i=1; while(this.columns.indexOf("u"+i)>-1)this.renameColumn("u"+i, "u"+(i-1));
				// ..otherwise, just add the column to the table.
				}else this.addColumn(colname);
			}

		for(n=0; n<this.columns.length; n++)
			row.push(data[this.columns[n]]);
	}else return _throw(new jSQL_Error("0015"));
	return row;
};

jSQLTable.prototype.insertRow = function(data, ignore){

	var row = this.normalizeInsertRowData(data);

	// validate & cast each row type
	for(var i=row.length; i--;){
		// If it's the auto increment column and it's zero or undefined, update it
		if(this.columns[i] === this.auto_inc_col){
			if(!row[i]){
				row[i] = this.auto_inc_seq;
				this.auto_inc_seq++;
			} 
			if(row[i] >= this.auto_inc_seq) this.auto_inc_seq = parseInt(row[i], 10)+1;
		}
		row[i] = this.normalizeColumnStoreValue(this.columns[i], row[i]);
	}
	if(false === this.updateKeysOnInsert(row, ignore)) return false;
	this.data.push(row);
};

jSQLTable.prototype.updateKeysOnInsert = function(row, ignore){
	// Make sure the primary key(s) is/are not violated
	// There can only be one primary key, but if it's an array it
	// is treated as a compound key
	if(this.keys.primary.column){ 
		var primary_key_columns = Array.isArray(this.keys.primary.column) ? this.keys.primary.column : [this.keys.primary.column];
		var pk_col, pk_vals = [];
		for(var pk=0; pk<primary_key_columns.length; pk++){
			pk_col=primary_key_columns[pk];
			var primary_index = this.colmap[pk_col];
			if(null === row[primary_index]){
				if(ignore === true) return false;
				return _throw(new jSQL_Error("0016"));
			}
			pk_vals.push(row[primary_index]);
		}
		pk_vals = JSON.stringify(pk_vals);
		if(this.keys.primary.map.hasOwnProperty(pk_vals)){
			if(ignore === true) return false;
			return _throw(new jSQL_Error("0017"));
		}
		this.keys.primary.map[pk_vals] = this.data.length;
	}

	// Check the unique keys, There may be multiple and they may be compound
	for(var k=0, ukey; k<this.keys.unique.length; k++){
		ukey=this.keys.unique[k];
		var key_columns = Array.isArray(ukey.column) ? ukey.column : [ukey.column];
		var col, vals = [];
		for(var uk=0; uk<key_columns.length; uk++){
			col=key_columns[uk];
			var index = this.colmap[col];
			if(null === row[index]){
				if(ignore === true) return false;
				return _throw(new jSQL_Error("0018"));
			}
			vals.push(row[index]);
		}
		vals = JSON.stringify(vals);
		if(ukey.map.hasOwnProperty(vals)){
			if(ignore === true) return false;
			return _throw(new jSQL_Error("0019"));
		}
		this.keys.unique[k].map[vals] = this.data.length;
	}
};

jSQLTable.prototype.normalizeColumnStoreValue = function(colName, value){
	var type = this.types[this.colmap[colName]];
	if([false, undefined].indexOf(type.null) >-1 && value === null) return _throw(new jSQL_Error("0072"));

	if(null === value && type.default !== undefined) value = type.default;
	var storeVal = jSQL.types.getByType(type.type.toUpperCase()).serialize(value, type.args);
	if((!isNaN(parseFloat(storeVal)) && isFinite(storeVal)) || typeof storeVal === "string")
		return storeVal;
	return _throw(new jSQL_Error("0020"));
};

jSQLTable.prototype.normalizeColumnFetchValue = function(colName, value){
	var type = this.types[this.colmap[colName]];
	return jSQL.types.getByType(type.type.toUpperCase()).unserialize(value, type.args);
};