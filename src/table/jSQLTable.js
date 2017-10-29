
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
		self.columns = columns;

		// Fill any missing holes in the types array 
		// with "ambi" which means it can be any type
		for(var i=0; i<columns.length; i++)
			self.types[i] = undefined === types[i] || undefined === types[i].type ? 
				{type:"ambi", args:[], default: undefined, null: true} : types[i];

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

	/* istanbul ignore next */
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
			type = {type:"AMBI",args:[], null:true, default: undefined};
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
				if(row[i] >= self.auto_inc_seq) self.auto_inc_seq = parseInt(row[i])+1;
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
		if([false, undefined].indexOf(type.null) >-1 && value === null) return _throw(new jSQL_Error("0072"));
		
		if(null === value && type.default !== undefined) value = type.default;
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
