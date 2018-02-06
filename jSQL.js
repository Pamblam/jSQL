/**
 * jsql-official - v3.2.9
 * A persistent SQL database.
 * @author Rob Parham
 * @website http://pamblam.github.io/jSQL/
 * @license Apache-2.0
 */

;(function(){
var isNode = !!(typeof module !== 'undefined' && module.exports);
var jSQL = (function(){
"use strict";

function jSQL_Error(error_no) {
	this.error = error_no;
	this.stack = undefined;
	var e = new Error();
	if(e.stack) this.stack = e.stack;
	if(jSQL_Error.message_codes[error_no]) this.message = jSQL_Error.message_codes[error_no];
	else this.message = "Unknown error.";
	this.toString = function () {
		if(undefined === this.error) return "jSQL Error - "+this.message;
		return "jSQL Error #"+this.error+" - "+this.message;
	};
}

jSQL_Error.message_codes = {
	"0001": "Corrupted function stored in data.",
	"0003": "Invalid datatype definition.",
	"0004": "DataType must have a `type` property.",
	"0005": "DataType must have a `serialize` function.",
	"0006": "DataType must have an `unserialize` function.",
	"0007": "Unsupported data type.",
	"0010": "Invalid constraint.",
	"0011": "This table already has a primary key.",
	"0012": "renameColumn expects and old column name and a new one, both must be strings.",
	"0013": "Column does not exist.",
	"0014": "Data must be an array.",
	"0015": "Data not structured properly.",
	"0016": "Cannot insert a null value in a primary column.",
	"0017": "Primary Key violated.",
	"0018": "Cannot insert a null value in a unique column.",
	"0019": "Unique key violated.",
	"0020": "Data type's serialize() method did not return a string.",
	"0021": "Table does not exist.",
	"0022": "Method does not apply to query type.",
	"0023": "Fetch expects paramter one to be 'ASSOC', 'ARRAY', or undefined.",
	"0024": "Expected number or quoted string.",
	"0025": "Expected 'ORDER BY'.",
	"0026": "Must call ORDER BY before using ASC.",
	"0027": "Must call ORDER BY before using DESC.",
	"0028": "Unintelligible query. Expected 'FROM'.",
	"0029": "Unintelligible query. Expected 'TABLE'.",
	"0030": "Unintelligible query. Expected 'INTO'.",
	"0031": "Unintelligible query. Expected 'VALUES'.",
	"0032": "Unintelligible query. Too many values.",
	"0033": "Unintelligible query. Columns mismatch.",
	"0034": "Invalid Column definition.",
	"0035": "Unintelligible query. Expected 'NOT'.",
	"0036": "Unintelligible query. Expected 'EXISTS'.",
	"0037": "Unintelligible query. expected ')'.",
	"0038": "Invalid Arg definition.",
	"0039": "Unintelligible query. Expected 'SET'.",
	"0040": "Unintelligible query. Expected 'FROM'.",
	"0041": "Unintelligible query. WTF?",
	"0042": "Must add a conditional before adding another 'Where' condition.",
	"0043": "Column name must be a string.",
	"0044": "Must add a 'where' clause before the 'equals' call.",
	"0045": "Must add a 'where' clause before the 'preparedLike' call.",
	"0046": "Must add a 'where' clause before the 'doesNotEqual' call.",
	"0047": "Must add a 'where' clause before the 'lessThan' call.",
	"0048": "Must add a 'where' clause before the 'greaterThan' call.",
	"0049": "Must add a 'where' clause before the 'contains' call.",
	"0050": "Must add a 'where' clause before the 'endsWith' call.",
	"0051": "Must add a 'where' clause before the 'beginsWith' call.",
	"0052": "Must use orderBy clause before using ASC.",
	"0053": "Must use orderBy clause before using DESC.",
	"0054": "Could not execute query.",
	"0055": "Error creating table.",
	"0056": "Error opening database.",
	"0057": "indexedDB is not supported in this browser.",
	"0058": "Could not add data after 10 seconds.",
	"0059": "Error updating datastore version.",
	"0060": "Could not connect to the indexedDB datastore.",
	"0061": "Could not initiate a transaction.",
	"0062": "Could not initiate a request.",
	"0063": "Browser doesn't support Web SQL or IndexedDB.",
	"0064": "Unable towrite to datastore file.",
	"0065": "AUTO_INCREMENT column must be a key.",
	"0066": "AUTO_INCREMENT column must be an INT type.",
	"0067": "API is out of memory, cannot store more data.",
	"0068": "Invalid ENUM value.",
	"0069": "NUMERIC or INT type invalid or out of range.",
	"0070": "Unknown Lexer Error.",
	"0071": "Unknown Parser Error.",
	"0072": "Inserting null into a non-null column."
};

function jSQL_Lexer_Error(pos, context) {
	var max_ellipse_len = 25;
	var ellipse_len = context.length > pos + max_ellipse_len ? max_ellipse_len :
		context.length - pos;
	var preview = context.substr(pos, ellipse_len);
	this.error = "0070";
	this.message = "Unknown token near char "+pos+" of "+context.length+" \""+preview+"\".";
	this.stack = undefined;
	var e = new Error();
	if(e.stack) this.stack = e.stack;
	this.toString = function () {
		return "jSQL Lexer Error #"+this.error+" - "+this.message;
	};
}


function jSQL_Parse_Error(tok, exp) {
	this.error = "0071";
	this.message = "Unexpected "+tok.type+" ("+tok.name+") at character "+tok.input_pos+".";
	if(exp) this.message += " Expected "+exp+".";
	this.stack = undefined;
	var e = new Error();
	if(e.stack) this.stack = e.stack;
	this.toString = function () {
		return "jSQL Parse Error #"+this.error+" - "+this.message;
	};
}


var error_handler_function = function(){};
var mute_jsql_errors = false;
function _throw(e, skip){
	if(skip !== true && mute_jsql_errors !== true) error_handler_function(e);
	throw e;
};

function onError(funct){
	if(typeof funct === "function") error_handler_function = funct;
}


function jSQLDataTypeList(){
	this.list = [{
		type: "NUMERIC",
		aliases: ["NUMBER", "DECIMAL", "FLOAT"],
		serialize: function(value, args){
			if(value === null) value = 0;
			return !isNaN(parseFloat(value)) && isFinite(value) ?
				parseFloat(value) : 
				_throw(new jSQL_Error("0069")) ;
		},
		unserialize: function(value, args){
			if(!value) value = 0;
			return !isNaN(parseFloat(value)) && isFinite(value) ?
				parseFloat(value) : 
				_throw(new jSQL_Error("0069")) ;
		}
	},{
		type: "ENUM",
		serialize: function(value, args){ 
			if(value === null) return "jsqlNull";
			for(var i=args.length; i--;)
				if(value === removeQuotes(args[i])) return value;
			return _throw(new jSQL_Error("0068"));
		},
		unserialize: function(value, args){ 
			if(value === "jsqlNull") return null;
			for(var i=args.length; i--;)
				if(value === removeQuotes(args[i])) return value;
			return _throw(new jSQL_Error("0068"));
		}
	},{
		type: "TINYINT",
		serialize: function(value, args){ 
			if(value === null) value = 0;
			return !isNaN(parseInt(value)) && isFinite(value) &&
				value >= -128 && value <= 127 ?
				parseInt(value) : 0; 
		},
		unserialize: function(value, args){ 
			if(!value) value = 0;
			return !isNaN(parseInt(value)) && isFinite(value) ?
				parseInt(value) : 0; 
		}
	},{
		type: "SMALLINT",
		serialize: function(value, args){ 
			if(value === null) value = 0;
			return !isNaN(parseInt(value)) && isFinite(value) &&
				value >= -32768 && value <= 32767 ?
				parseInt(value) : 
				_throw(new jSQL_Error("0069")) ; 
		},
		unserialize: function(value, args){ 
			if(!value) value = 0;
			return !isNaN(parseInt(value)) && isFinite(value) ?
				parseInt(value) : 
				_throw(new jSQL_Error("0069")) ; 
		}
	},{
		type: "MEDIUMINT",
		serialize: function(value, args){ 
			if(value === null) value = 0;
			return !isNaN(parseInt(value)) && isFinite(value) &&
				value >= -8388608 && value <= 8388607 ?
				parseInt(value) : 
				_throw(new jSQL_Error("0069")) ; 
		},
		unserialize: function(value, args){ 
			if(!value) value = 0;
			return !isNaN(parseInt(value)) && isFinite(value) ?
				parseInt(value) : 
				_throw(new jSQL_Error("0069")) ; 
		}
	},{
		type: "INT",
		serialize: function(value, args){ 
			if(value === null) value = 0;
			return !isNaN(parseInt(value)) && isFinite(value) &&
				value >= -2147483648 && value <= 2147483647 ?
				parseInt(value) : _throw(new jSQL_Error("0069")); 
		},
		unserialize: function(value, args){ 
			if(!value) value = 0;
			return !isNaN(parseInt(value)) && isFinite(value) ?
				parseInt(value) : _throw(new jSQL_Error("0069")); 
		}
	},{
		type: "BIGINT",
		serialize: function(value, args){ 
			if(value === null) value = 0;
			return !isNaN(parseInt(value)) && isFinite(value) &&
				value >= -9007199254740991 && value <= 9007199254740991 ?
				parseInt(value) : _throw(new jSQL_Error("0069")); 
		},
		unserialize: function(value, args){ 
			if(!value) value = 0;
			return !isNaN(parseInt(value)) && isFinite(value) ?
				parseInt(value) : _throw(new jSQL_Error("0069")); 
		}
	},{
		type: "JSON",
		aliases: ["ARRAY", "OBJECT"],
		serialize: function(value){
			if(value === null) return "jsqlNull";
			if(typeof value === "string") return value;
			return JSON.stringify(value);
		},
		unserialize: function(value){
			if(value === "jsqlNull") return null;
			return JSON.parse(value);
		}
	},{
		type: "FUNCTION",
		serialize: function(value){
			if(value === null) return "jsqlNull";
			if(typeof value !== "function"){
				var f = null;
				try{
					eval("f = "+value);
				}catch(e){};
				if("function" === typeof f) value = f;
				else _throw(new jSQL_Error("0001"));
			}
			return "jSQLFunct-"+value.toString();
		},
		unserialize: function(value){
			if(value === "jsqlNull") return null;
			var p = value.split("-");
			if(p.shift() !== "jSQLFunct") return _throw(new jSQL_Error("0001"));
			p = value.split("-");
			p.shift();
			var f = null;
			try{
				eval("f = "+p.join("-"));
			}catch(e){};
			if("function" === typeof f) return f;
			return _throw(new jSQL_Error("0001"));
		}
	},{
		type: "BOOLEAN",
		aliases: ['BOOL'],
		serialize: function(value){
			if(value === null) return "jsqlNull";
			return value === true || value.toUpperCase() == "TRUE" || value == 1 ? 
				"1" : "0" ;
		},
		unserialize: function(value){
			if(value === "jsqlNull") return null;
			return value === true || value.toUpperCase() == "TRUE" || value == 1 ; 
		}
	},{
		type: "CHAR",
		serialize: function(value, args){ 
			if(value === null) return "jsqlNull";
			return ""+value; 
		},
		unserialize: function(value, args){ 
			if(value === "jsqlNull") return null;
			var targetLength = args[0]>>0, padString = ' ';
			if (value.length > targetLength) return value.substr(0, args[0]);
			else {
				targetLength = targetLength-value.length;
				if (targetLength > padString.length)
					padString += padString.repeat(targetLength/padString.length); 
				return String(value) + padString.slice(0,targetLength);
			}
			return ""+value; 
		}
	},{
		type: "VARCHAR",
		aliases: ["LONGTEXT", "MEDIUMTEXT"],
		serialize: function(value, args){ 
			if(value === null) return "jsqlNull";
			return ""+value; 
		},
		unserialize: function(value, args){ 
			if(value === "jsqlNull") return null;
			return ""+value; 
		}
	},{
		type: "DATE",
		serialize: function(value){ 
			if(value === null) return "jsqlNull";
			if(!(value instanceof Date)) return new Date(value).getTime();
			return value.getTime(); 
		},
		unserialize: function(value){ 
			if(value === "jsqlNull") return null;
			return new Date(value);
		}
	},{
		type: "AMBI",
		serialize: function(value){
			if(value === null) return "jsqlNull";
			if(value instanceof Date) return value.getTime();
			if(typeof value === "function") return "jSQLFunct-"+value.toString();
			if(!isNaN(parseFloat(value)) && isFinite(value)) return value;
			return ""+value;
		},
		unserialize: function(value){ 
			if(value === "jsqlNull") return null;
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
		if(typeof type !== "object") return _throw(new jSQL_Error("0003"));
		if(undefined === type.type) return _throw(new jSQL_Error("0004"));
		if("function" !== typeof type.serialize) return _throw(new jSQL_Error("0005"));
		if("function" !== typeof type.unserialize) return _throw(new jSQL_Error("0006"));
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
		return _throw(new jSQL_Error("0007"));
	};
}
		

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

	// Methods that every query class should implement
	var methods = ['init', 'ifNotExists', 'execute', 'fetch', 'ignore', 
		'fetchAll', 'values', 'set', 'where', 'from', 'orderBy', 'asc',
		'desc', 'limit', 'distinct'];
	var queryTypeConstructors = {
		CREATE: jSQLCreateQuery,
		UPDATE: jSQLUpdateQuery,
		SELECT: jSQLSelectQuery,
		INSERT: jSQLInsertQuery,
		DROP: jSQLDropQuery,
		DELETE: jSQLDeleteQuery
	};
	for(var i=0; i<methods.length; i++)(function(i){
		self[methods[i]] = function(){
			var q = new queryTypeConstructors[self.type];
			if(typeof q[methods[i]] == "function") return q[methods[i]].apply(self, arguments);
			else return _throw(new jSQL_Error("0022"));
		};
	})(i);
}


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


function jSQLDropQuery(){
	this.init = function(tablename){
		this.tablename = tablename;
		return this;
	};
	this.execute = function(){ 
		if(undefined === jSQL.tables[this.tablename]) return _throw(new jSQL_Error("0021"));
		// Delete the table
		delete jSQL.tables[this.tablename];
		return this; 
	};
	this.fetch = function(){ return null; };
	this.fetchAll = function(){ return []; };
}


function jSQLInsertQuery(){
	this.init = function(table){
		this.table = table;
		this.ignoreFlag = false;
		return this;
	};
	this.values = function(data){
		if(undefined === jSQL.tables[this.table])
			return _throw(new jSQL_Error("0021"));
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
		jSQL.tables[this.table].insertRow(this.data, this.ignoreFlag);
		return this;
	};
	this.ignore = function(){ this.ignoreFlag=true; return this; };
	this.fetch = function(){ return null; };
	this.fetchAll = function(){ return []; };
}


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
				this.table.keys.primary.map[new_rows[i].pk_vals] = new_rows[i].rowIndex;
				break;
			}
			for(var k=0; ukey=this.table.keys.unique[k]; k++){
				for(var col in this.table.keys.unique[k].map){
					if(!this.table.keys.unique[k].map.hasOwnProperty(col) || 
						this.table.keys.unique[k].map[col] != new_rows[i].rowIndex) continue;
					delete this.table.keys.unique[k].map[col];
					this.table.keys.unique[k].map[new_rows[i].uni_vals[k]] = new_rows[i].rowIndex;
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

function jSQLCreateQuery(){
	this.init = function(tablename, columns, types, keys, auto_increment){
		this.tablename = tablename;
		this.columns = columns;
		this.coltypes = types;
		this.keys = keys;
		this.ai_col = auto_increment;
		return this;
	};
	this.ifNotExists = function(){ this.INEFlag=true; return this; };
	this.execute = function(data){ 
		if(undefined !== data) this.data = data; 
		if(!(this.INEFlag && jSQL.tables.hasOwnProperty(this.tablename))){
			jSQL.tables[this.tablename] = new jSQLTable(this.tablename, this.columns, this.data, this.coltypes, this.keys, this.ai_col);
		}
		return this;
	};
	this.fetch = function(){ return null; };
	this.fetchAll = function(){ return []; };
}


function jSQLLexer(input) {
	this.input = input;
	this.pos = 0;
	this.real_pos = 0;
	this.tokens = [];
	this.token_matches = [];
}

jSQLLexer.prototype.getNextToken = function(){
	var r;
	for(var i=0; i<jSQLLexer.token_types.length; i++){
		while ((r = jSQLLexer.token_types[i].pattern.exec(this.input)) != null) {
			if(r.index !== this.pos) continue;
			var token = new jSQLToken(this.pos, r[0], i);
			this.pos += token.length;
			return token;
		}
	}
	return false;
};

jSQLLexer.prototype.getTokens = function(){	
	if(this.tokens.length) return this.tokens;
	this.pos = 0; this.tokens = [];
	var throwaway = ["COMMENT", "WHITESPACE"], token;
	while ((token = this.getNextToken()) != false) 
		if(throwaway.indexOf(token.type) === -1)
			this.tokens.push(token);
	if(this.pos !== this.input.length){
		var pos;
		if(this.tokens.length){
			var lastToken = this.tokens[this.tokens.length-1];
			pos = lastToken.input_pos + lastToken.length;
		}else pos = 0;
		return _throw(new jSQL_Lexer_Error(pos, this.input)); 
	}
	return this.tokens;
};



jSQLLexer.token_types = [
	
	// STRINGs
	{pattern: /"(?:[^"\\]|\\.)*"/g,
		type: 'STRING',
		name: "DQ STRING"},
	{pattern: /'(?:[^'\\]|\\.)*'/g,
		type: 'STRING',
		name: "SQ STRING"},

	// COMMENTs
	{pattern: /--.*[\n\r$]/g,
		type: 'COMMENT',
		name: "SINGLE LINE COMMENT"},
	{pattern: /\/\*([\s\S]*?)\*\//g,
		type: 'COMMENT',
		name: "MULTI LINE COMMENT"},

	// WHITESPACE
	{pattern: /\r?\n|\r/g,
		type: 'WHITESPACE',
		name: "LINEBREAK"},
	{pattern: /[ \t]/g,
		type: 'WHITESPACE',
		name: "WHITESPACE"},

	// NUMBERs
	{pattern: /[?-]?\d+.\.\d+/g,
		type: 'NUMBER',
		name: 'FLOAT'},
	{pattern: /[?-]?\d+/g,
		type: 'NUMBER',
		name: 'INTEGER'},

	// QUALIFIERs
	{pattern: /if not exists/gi,
		type: 'QUALIFIER',
		name: "IF NOT EXISTS"},

	// SYMBOLs
	{pattern: /!=/gi,
		type: 'SYMBOL',
		name: "NOT EQUAL"},
	{pattern: /<>/gi,
		type: 'SYMBOL',
		name: "NOT EQUAL"},
	{pattern: /\(/gi,
		type: 'SYMBOL',
		name: "LEFT PEREN"},
	{pattern: /\)/gi,
		type: 'SYMBOL',
		name: "RIGHT PEREN"},
	{pattern: /,/gi,
		type: 'SYMBOL',
		name: "COMMA"},
	{pattern: /\?/gi,
		type: 'SYMBOL',
		name: "QUESTION MARK"},
	{pattern: /,/gi,
		type: 'SYMBOL',
		name: "COMMA"},
	{pattern: /\*/gi,
		type: 'SYMBOL',
		name: "ASTERISK"},
	{pattern: /;/gi,
		type: 'SYMBOL',
		name: "SEMICOLON"},
	{pattern: /=/gi,
		type: 'SYMBOL',
		name: "EQUALS"},
	{pattern: />/gi,
		type: 'SYMBOL',
		name: "GREATER THAN"},
	{pattern: /</gi,
		type: 'SYMBOL',
		name: "LESS THAN"},

	// KEYWORDs
	{pattern: /primary key/gi,
		type: 'KEYWORD',
		name: "PRIMARY KEY"},
	{pattern: /unique key/gi,
		type: 'KEYWORD',
		name: "UNIQUE KEY"},
	{pattern: /values/gi,
		type: 'KEYWORD',
		name: "VALUES"},
	{pattern: /from/gi,
		type: 'KEYWORD',
		name: "FROM"},
	{pattern: /auto_increment/gi,
		type: 'KEYWORD',
		name: "AUTO_INCREMENT"},
	{pattern: /ignore/gi,
		type: 'KEYWORD',
		name: "IGNORE"},
	{pattern: /into/gi,
		type: 'KEYWORD',
		name: "INTO"},
	{pattern: /all/gi,
		type: 'KEYWORD',
		name: "ALL"},
	{pattern: /distinct/gi,
		type: 'KEYWORD',
		name: "DISTINCT"},
	{pattern: /distinctrow/gi,
		type: 'KEYWORD',
		name: "DISTINCTROW"},
	{pattern: /where/gi,
		type: 'KEYWORD',
		name: "WHERE"},
	{pattern: /and/gi,
		type: 'KEYWORD',
		name: "AND"},
	{pattern: /like/gi,
		type: 'KEYWORD',
		name: "LIKE"},
	{pattern: /order by/gi,
		type: 'KEYWORD',
		name: "ORDER BY"},
	{pattern: /or/gi,
		type: 'KEYWORD',
		name: "OR"},
	{pattern: /limit/gi,
		type: 'KEYWORD',
		name: "LIMIT"},
	{pattern: /offset/gi,
		type: 'KEYWORD',
		name: "OFFSET"},
	{pattern: /asc/gi,
		type: 'KEYWORD',
		name: "ASC"},
	{pattern: /desc/gi,
		type: 'KEYWORD',
		name: "DESC"},
	{pattern: /set/gi,
		type: 'KEYWORD',
		name: "SET"},
	{pattern: /not null/gi,
		type: 'KEYWORD',
		name: "NOT NULL"},
	{pattern: /null/gi,
		type: 'KEYWORD',
		name: "NULL"},
	{pattern: /default/gi,
		type: 'KEYWORD',
		name: "DEFAULT"},
	

	// DIRECTIVEs
	{pattern: /create table/gi,
		type: 'DIRECTIVE',
		name: "CREATE TABLE"},
	{pattern: /insert/gi,
		type: 'DIRECTIVE',
		name: "INSERT"},
	{pattern: /delete from/gi,
		type: 'DIRECTIVE',
		name: "DELETE FROM"},
	{pattern: /drop table/gi,
		type: 'DIRECTIVE',
		name: "DROP TABLE"},
	{pattern: /update/gi,
		type: 'DIRECTIVE',
		name: "UPDATE"},
	{pattern: /select/gi,
		type: 'DIRECTIVE',
		name: "SELECT"},

	// IDENTIFIERs are developer specified so should be checked last
	{pattern: /`[0-9a-zA-Z$_]*[0-9a-zA-Z$_]`/gi,
		type: 'IDENTIFIER',
		name: "QTD IDENTIFIER"},
	{pattern: /[0-9a-zA-Z$_]*[0-9a-zA-Z$_]/gi,
		type: 'IDENTIFIER',
		name: "UNQTD IDENTIFIER"}
];



function jSQLToken(pos, literal, tok_index){
	this.type_id = tok_index;
	this.input_pos = pos;
	this.literal = literal;
	this.value = literal;
	this.length = literal.length;
	this.type = jSQLLexer.token_types[tok_index].type;
	this.name = jSQLLexer.token_types[tok_index].name;
	
	if(this.type === "IDENTIFIER" && this.name === "UNQTD IDENTIFIER" && jSQL.types.exists(this.literal)) 
		this.name = "DATA TYPE";
	if(this.type === "IDENTIFIER" && this.name === "QTD IDENTIFIER")
		this.value = literal.replace(/`/g,'');
	if(this.type === "STRING" && this.name === "DQ STRING")
		this.value = literal.substr(1, literal.length - 2).replace(/\"/g, '"');
	if(this.type === "STRING" && this.name === "SQ STRING")
		this.value = literal.substr(1, literal.length - 2).replace(/\'/g, "'");
	if(this.type === "NUMBER") this.value = parseFloat(this.literal);
	if(this.type === "KEYWORD" && this.name === "NULL") this.value = null;
}


function jSQLParseQuery(query){

	var tokens = jSQL.tokenize(query);
	
	if(!tokens || !Array.isArray(tokens) || !tokens.length) 
		return _throw(new jSQL_Error("0041"));
	
	if(tokens[0].type !== "DIRECTIVE") 
		return _throw(new jSQL_Parse_Error(tokens[0], "DIRECTIVE"));
	
	var directive = tokens.shift();
	switch(directive.name){
		case "CREATE TABLE":
			return jSQLParseCreateTokens(tokens);
			break;
		case "INSERT":
			return jSQLParseInsertTokens(tokens);
			break;
		case "SELECT":
			return jSQLParseSelectTokens(tokens);
			break;
		case "UPDATE":
			return jSQLParseUpdateTokens(tokens);
			break;
		case "DELETE FROM":
			return jSQLParseDeleteTokens(tokens);
			break;
		case "DROP TABLE":
			return jSQLParseDropTokens(tokens);
			break;
	}
	
	return _throw(new jSQL_Error("0041"));
}

jSQLParseQuery.validateTableNameToken = function(token){
	for(var name in jSQL.tables){
		if(!jSQL.tables.hasOwnProperty(name)) continue;
		if(token.value.toUpperCase() == name.toUpperCase()){
			return name;
		}
	}
	return _throw(new jSQL_Error("0021"));
};

jSQLParseQuery.validateColumnName = function(column_name, table_name){
	for(var i = jSQL.tables[table_name].columns.length; i--;){
		if(column_name.toUpperCase() === jSQL.tables[table_name].columns[i].toUpperCase())
			return jSQL.tables[table_name].columns[i];
	}
	return _throw(new jSQL_Error("0013"));
};

function jSQLParseCreateTokens(tokens){
	var table_name = false,
		token,
		if_not_exists = false,
		keys = [],
		params = {};

	token = tokens.shift();
	
	if(token.type === "QUALIFIER" && token.name === "IF NOT EXISTS"){
		if_not_exists = true;
		token = tokens.shift();
	}
	
	if(token.type === "IDENTIFIER") table_name = token.value;
	
	if(!table_name) return _throw(new jSQL_Parse_Error(token, "TABLE NAME"));
	
	params[table_name] = [];
	
	token = tokens.shift();
	if(token.type !== "SYMBOL" || token.name !== "LEFT PEREN") 
		return _throw(new jSQL_Parse_Error(token, "LEFT PEREN"));
	
	while(tokens.length){
		token = tokens.shift();
		if(token.type === "SYMBOL" && token.name === "COMMA") continue;
		if(token.type === "SYMBOL" && token.name === "RIGHT PEREN") break;
		
		// If this line is actually a key definition rather than a column defintion
		if(token.type === "KEYWORD" && (token.name === "UNIQUE KEY" || token.name === "PRIMARY KEY")){
			var key_type = token.name.split(" ")[0].toLowerCase();
			token = tokens.shift();
			if(token.type !== "SYMBOL" || token.name !== "LEFT PEREN") 
				return _throw(new jSQL_Parse_Error(token, "LEFT PEREN"));
			
			var key_cols = [];
			while(tokens.length){
				token = tokens.shift();
				if(token.type === "SYMBOL" && token.name === "COMMA") continue;
				if(token.type === "SYMBOL" && token.name === "RIGHT PEREN") break;
				
				if(token.type === "IDENTIFIER") var key_col_name = token.value;
				else return _throw(new jSQL_Parse_Error(token, "COLUMN NAME"));
				
				key_cols.push(key_col_name);
			}
			
			if(!key_cols.length) return _throw(new jSQL_Parse_Error(token, "COLUMN NAME"));
			
			keys.push({column: key_cols, type: key_type});
			continue;
		}
		
		if(token.type === "IDENTIFIER") var col_name = token.value;
		else return _throw(new jSQL_Parse_Error(token, "COLUMN NAME"));
		
		var column = {name: col_name, type:"AMBI", args:[], null: true, default: undefined};
		
		token = tokens.shift();
		
		// column definition
		if(token.name === "DATA TYPE"){
			column.type = token.literal.toUpperCase();
			token = tokens.shift();
			
			if(token.type === "SYMBOL" && token.name === "LEFT PEREN"){
				while(tokens.length){
					token = tokens.shift();
					if(token.type === "SYMBOL" && token.name === "COMMA") continue;
					if(token.type === "SYMBOL" && token.name === "RIGHT PEREN") break;
					if(token.type === "STRING" || token.type === "NUMBER"){
						column.args.push(token.value);
						continue;
					}
					return _throw(new jSQL_Parse_Error(token, "DATA TYPE PARAM OR CLOSING PEREN"));
				}
				token = tokens.shift();
			}
		}
		
		if(token.type === "KEYWORD" && (token.name === "NULL" || token.name === "NOT NULL")){
			column.null = token.name === "NULL";
			token = tokens.shift();
		}
		
		if(token.type === "KEYWORD" && token.name === "DEFAULT"){
			column.default = tokens.shift().value;
			token = tokens.shift();
		}
		
		if(token.type === "KEYWORD" && token.name === "AUTO_INCREMENT"){
			column.auto_increment = true;
			token = tokens.shift();
		}

		if(token.type === "KEYWORD" && (token.name === "UNIQUE KEY" || token.name === "PRIMARY KEY")){
			keys.push({column: col_name, type: token.name.split(" ")[0].toLowerCase()});
			token = tokens.shift();
		}
		
		params[table_name].push(column);
		
	}
	
	if(tokens.length){
		token = tokens.shift();
		if(token.type !== "SYMBOL" || token.name !== "SEMICOLON") 
			return _throw(new jSQL_Parse_Error(token, "END OF STATEMENT"));
	}
	
	var query = jSQL.createTable(params, keys);
	if(if_not_exists) query.ifNotExists();
	
	return query;
	
}

function jSQLParseInsertTokens(tokens){
	var table_name, cols=[], values = [], ignore = false;
	
	var token = tokens.shift();
	
	if(token.type === "KEYWORD" && token.name === "IGNORE"){
		ignore = true;
		token = tokens.shift();
	}
	
	if(token.type !== "KEYWORD" && token.name === "INTO")
		return _throw(new jSQL_Parse_Error(token, "INTO"));
	
	token = tokens.shift();
	table_name = jSQLParseQuery.validateTableNameToken(token);
	
	token = tokens.shift();
	if(token.type !== "KEYWORD" && token.name !== "VALUES"){
		
		if(token.type !== "SYMBOL" || token.name !== "LEFT PEREN") 
			return _throw(new jSQL_Parse_Error(token, "COLUMN LIST OR VALUES"));
		
		while(tokens.length){
			token = tokens.shift();
			if(token.type === "SYMBOL" && token.name === "COMMA") continue;
			if(token.type === "SYMBOL" && token.name === "RIGHT PEREN"){
				token = tokens.shift();
				break;
			}
			
			if(token.type === "IDENTIFIER") 
				var colname = jSQLParseQuery.validateColumnName(token.value, table_name);
			else return _throw(new jSQL_Parse_Error(token, "COLUMN NAME"));
			
			cols.push(colname);
		}
	}
	
	if(token.type !== "KEYWORD" && token.name !== "VALUES")
		return _throw(new jSQL_Parse_Error(token, "VALUES"));
	
	token = tokens.shift();
	if(token.type !== "SYMBOL" || token.name !== "LEFT PEREN") 
		return _throw(new jSQL_Parse_Error(token, "VALUES LIST"));
	
	while(tokens.length){
		token = tokens.shift();
		if(token.type === "SYMBOL" && token.name === "COMMA") continue;
		if(token.type === "SYMBOL" && token.name === "RIGHT PEREN") break;
		values.push(token.value);
	}
	
	if(tokens.length){
		token = tokens.shift();
		if(token.type !== "SYMBOL" || token.name !== "SEMICOLON") 
			return _throw(new jSQL_Parse_Error(token, "END OF STATEMENT"));
	}
	
	if(!cols.length){
		for(var i=0;  i<values.length; i++){
			if(undefined === jSQL.tables[table_name].columns[i]) return _throw(new jSQL_Error("0032"));
			cols.push(jSQL.tables[table_name].columns[i]);
		}
	}
	
	if(values.length !== cols.length) return _throw(new jSQL_Error("0033"));
	
	var data = {};
	for(var i=0; i<cols.length; i++){
		data[cols[i]] = values[i];
	}

	var q = jSQL.insertInto(table_name).values(data);
	return ignore ? q.ignore() : q;
	
}



function jSQLParseSelectTokens(tokens){
	var table_name, columns = [], query, orderColumns = [], isDistinct = false;
	
	var token = tokens.shift();
	if(token.type === "KEYWORD" && token.name === "ALL") token = tokens.shift();
	if(token.type === "KEYWORD" && (token.name === "DISTINCT" || token.name === "DISTINCTROW")){
		isDistinct = true;
		token = tokens.shift();
	}
	
	while(tokens.length){
		columns.push(token.value);
		token = tokens.shift();
		if(token.type === "SYMBOL" && token.name === "COMMA"){
			token = tokens.shift();
			continue;
		}
		if(token.type === "KEYWORD" && token.name === "FROM") break;
	}
	
	if(token.type !== "KEYWORD" && token.name !== "FROM")
		return _throw(new jSQL_Parse_Error(token, "FROM"));
	
	token = tokens.shift();
	table_name =  jSQLParseQuery.validateTableNameToken(token);
	
	if(columns.length == 1 && columns[0] == "*") columns = '*';
	else for(var i=0;i<columns.length;i++){
		columns[i] = jSQLParseQuery.validateColumnName(columns[i], table_name);
	}
	
	query = jSQL.select(columns).from(table_name);
	if(isDistinct) query = query.distinct();
	query = jSQLParseWhereClause(query, tokens, table_name);

	return query;
}



function jSQLParseUpdateTokens(tokens){
	var table_name, query, newVals = {};
	var token = tokens.shift();
	
	table_name = jSQLParseQuery.validateTableNameToken(token);
	token = tokens.shift();
	
	if(token.type !== "KEYWORD" && token.name !== "SET")
		return _throw(new jSQL_Parse_Error(token, "SET"));
	
	while(tokens.length){
		var column_name = jSQLParseQuery.validateColumnName(tokens.shift().value, table_name);
		token = tokens.shift();
		if(token.type !== 'SYMBOL' && token.name !== 'EQUALS')
			return _throw(new jSQL_Parse_Error(token, "EQUALS"));
		var value = tokens.shift().value;
		newVals[column_name] = value;
		if(!tokens.length) break;
		token = tokens.shift();
		if(token.type === "SYMBOL" && token.name === "COMMA") continue;
		if(token.type === "KEYWORD" && token.name === "WHERE"){
			tokens.unshift(token);
			break;
		}
	}
	
	query = jSQL.update(table_name).set(newVals);
	query = jSQLParseWhereClause(query, tokens, table_name);
	return query;
}

function jSQLParseDeleteTokens(tokens){
	var token = tokens.shift();
	var table_name = jSQLParseQuery.validateTableNameToken(token);
	var query = jSQL.deleteFrom(table_name);
	query = jSQLParseWhereClause(query, tokens, table_name);
	return query;
}

function jSQLParseDropTokens(tokens){
	var token = tokens.shift();
	var table_name = jSQLParseQuery.validateTableNameToken(token);
	return jSQL.dropTable(table_name);
}

function jSQLParseWhereClause(query, tokens, table_name){
	var orderColumns = [];
	while(tokens.length){
		var token = tokens.shift();
		switch(token.type){
			case "KEYWORD":
				switch(token.name){
					case "WHERE":
					case "AND":
						query = query.where(jSQLParseQuery.validateColumnName(tokens.shift().value, table_name));
						break;
					case "LIKE":
						var substr = tokens.shift().value;
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
						query = query.or(jSQLParseQuery.validateColumnName(tokens.shift().value, table_name));
						break;
					case "LIMIT":
						var limit = tokens.shift().value, offset, commaFound=false;
						token = tokens.shift();
						if(token.type === "SYMBOL" && token.name === "COMMA") commaFound = true;
						else tokens.unshift(token);
						if(commaFound){
							offset = limit;
							limit = tokens.shift().value;
						}
						if(tokens.length && !commaFound){
							var token = tokens.shift();
							if(token.type === "KEYWORD" && token.name === "OFFSET"){
								offset = tokens.shift().value;
							}else tokens.unshift(token);
						}
						query = query.limit(limit, offset);
						break;
					case "ORDER BY":
						while(tokens.length){
							var token = tokens.shift();
							if(token.type === "SYMBOL" && token.name === "COMMA") continue;
							try{
								var column_name = jSQLParseQuery.validateColumnName(token.value, table_name);
								orderColumns.push(column_name);
							}catch(e){
								tokens.unshift(token); 
								break;
							}
						}
						query = query.orderBy(orderColumns);
						break;
					case "ASC":
						if(!orderColumns.length) return _throw(new jSQL_Error("0026"));
						query = query.asc();
						break;
					case "DESC":
						if(!orderColumns.length) return _throw(new jSQL_Error("0027"));
						query = query.desc();
						break;	
					default: return _throw(new jSQL_Parse_Error(token));
				}
				break;
			case "SYMBOL":
				switch(token.name){
					case "EQUALS":
						query = query.equals(tokens.shift().value);
						break;
					case "GREATER THAN":
						query = query.greaterThan(tokens.shift().value);
						break;
					case "LESS THAN":
						query = query.lessThan(tokens.shift().value);
						break;
					case "NOT EQUAL":
						query = query.doesNotEqual(tokens.shift().value);
						break;
					default: return _throw(new jSQL_Parse_Error(token));
				}
				break;
			default: return _throw(new jSQL_Parse_Error(token, "SYMBOL OR KEYWORD"));
		}
	}
	return query;
}

function jSQLWhereClause(context){
	var self = this;
	self.context = context;
	self.pendingColumn = "";
	self.conditions = [];
	self.LIMIT = 0;
	self.OFFSET = 0;
	self.finalConditions = [];
	self.sortColumn = [];
	self.sortDirection = "ASC";
	self.isDistinct = false;

	self.where = function(column){
		if(self.pendingColumn !== "") return _throw(new jSQL_Error("0042"));
		if('string' != typeof column) return _throw(new jSQL_Error("0043"));
		self.pendingColumn = column;
		return self;
	};

	self.equals = function(value){
		if(self.pendingColumn == "") return _throw(new jSQL_Error("0044"));
		self.conditions.push({col: self.pendingColumn, type: '=', value: value});
		self.pendingColumn = "";
		return self;
	};

	self.preparedLike = function(){
		if(self.pendingColumn == "") return _throw(new jSQL_Error("0045"));
		self.conditions.push({col: self.pendingColumn, type: 'pl', value: "?"});
		self.pendingColumn = "";
		return self;
	};

	self.doesNotEqual = function(value){
		if(self.pendingColumn == "") return _throw(new jSQL_Error("0046"));
		self.conditions.push({col: self.pendingColumn, type: '!=', value: value});
		self.pendingColumn = "";
		return self;
	};

	self.lessThan = function(value){
		if(self.pendingColumn == "") return _throw(new jSQL_Error("0047"));
		self.conditions.push({col: self.pendingColumn, type: '<', value: value});
		self.pendingColumn = "";
		return self;
	};

	self.greaterThan = function(value){
		if(self.pendingColumn == "") return _throw(new jSQL_Error("0048"));
		self.conditions.push({col: self.pendingColumn, type: '>', value: value});
		self.pendingColumn = "";
		return self;
	};

	self.contains = function(value){
		if(self.pendingColumn == "") return _throw(new jSQL_Error("0049"));
		self.conditions.push({col: self.pendingColumn, type: '%%', value: value});
		self.pendingColumn = "";
		return self;
	};

	self.endsWith = function(value){
		if(self.pendingColumn == "") return _throw(new jSQL_Error("0050"));
		self.conditions.push({col: self.pendingColumn, type: '%-', value: value});
		self.pendingColumn = "";
		return self;
	};

	self.beginsWith = function(value){
		if(self.pendingColumn == "") return _throw(new jSQL_Error("0051"));
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

	self.limit = function(limit, offset){
		self.LIMIT = parseInt(limit);
		if(undefined !== offset) 
			self.OFFSET = parseInt(offset);
		return self;
	};

	self.orderBy = function(columns){
		if(!Array.isArray(columns)) columns = [columns];
		self.sortColumn = columns;
		return self;
	};

	self.asc = function(){
		if('' == self.sortColumn) return _throw(new jSQL_Error("0052"));
		self.sortDirection = "ASC";
		return self;
	};

	self.desc = function(){
		if('' == self.sortColumn) return _throw(new jSQL_Error("0053"));
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

	self.getResultRowIndexes = function(){
		var resultRowIndexes = [];
		for(var i=0; i<self.context.table.data.length; i++){
			// LOOPING ROWS
			if(self.finalConditions.length < 1){
				// IF THERE ARE NO CONDITIONS, ADD ROW TO RESULT SET
				resultRowIndexes.push(i);
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
						var col_index = self.context.table.colmap[condition.col];
						var col_value = self.context.table.data[i][col_index];
						switch(condition.type){
							case ">": 
								if(isNaN(parseFloat(col_value)) || col_value <= condition.value)
									safeCondition = false;
								break;
							case "<": 
								if(isNaN(parseFloat(col_value)) || col_value >= condition.value)
									safeCondition = false;
								break;
							case "=": 
								if(col_value != condition.value)
									safeCondition = false;
								break;
							case "!=": break;
								if(col_value == condition.value)
									safeCondition = false;
								break;
							case "%%": 
								if(col_value.indexOf(condition.value) < 0)
									safeCondition = false;
								break;
							case "%-": 
								if(col_value.indexOf(condition.value) != col_value.length - condition.value.length)
									safeCondition = false;
								break;
							case "-%": 
								if(col_value.indexOf(condition.value) != 0)
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
					resultRowIndexes.push(i);
				}
			}
		}

		if(self.sortColumn.length > 0){
			resultRowIndexes.sort(function(a, b){
				a=self.context.table.data[a]; 
				b=self.context.table.data[b];					
				return (function srrrrt(i){					
					if(undefined === self.sortColumn[i]) return 0;
					var sortColumn = self.sortColumn[i];
					var sortColumnIndex = self.context.table.colmap[sortColumn];						
					if(a[sortColumnIndex] < b[sortColumnIndex]) return -1;
					if(a[sortColumnIndex] > b[sortColumnIndex]) return 1;
					return srrrrt(i+1);
				}(0));
			});	
			if(self.sortDirection == "DESC") resultRowIndexes.reverse();
		}

		if(self.isDistinct){
			var resultRows = [];
			for(var i=0; i<resultRowIndexes.length; i++)
				resultRows.push(self.context.table.data[resultRowIndexes[i]]);
			var distinctRows = [], newResultRows = []; 
			for(var i=0; i<resultRows.length; i++){
				var row = {};
				for(var n=0; n<self.context.columns.length; n++){
					row[self.context.columns[n]] = resultRows[i][self.context.table.colmap[self.context.columns[n]]]
				}

				// is this row unique?
				var testRow = JSON.stringify(row);
				if(distinctRows.indexOf(testRow)>-1) continue;
				newResultRows.push(resultRowIndexes[i]);
				distinctRows.push(testRow);
			}
			resultRowIndexes = newResultRows;
		}

		if(self.LIMIT > 0 && resultRowIndexes.length > self.LIMIT){
			if(self.OFFSET > resultRowIndexes.length){
				resultRowIndexes = [];
			}
			if(self.LIMIT > resultRowIndexes.length) self.LIMIT = resultRowIndexes.length;
			if(resultRowIndexes.length){
				resultRowIndexes = resultRowIndexes.slice(self.OFFSET, self.OFFSET+self.LIMIT);
			}
		}

		return resultRowIndexes;
	};
}


/* istanbul ignore next */
var API = {

	cookieAPI: function(){
		var self = this;

		var setCookie = function(cname, cvalue) {
			var d = new Date();
			d.setTime(d.getTime() + 864000000000);
			var expires = "expires="+d.toUTCString();
			document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
		};

		var getCookie = function(cname) {
			var name = cname + "=";
			var ca = document.cookie.split(';');
			for(var i = 0; i < ca.length; i++) {
				var c = ca[i];
				while (c.charAt(0) == ' ') c = c.substring(1);
				if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
			}
			return "";
		};

		self.init = function(modelData, successCallback){
			if("function" !== typeof successCallback) successCallback = function(){};
			for(var i=0, db; db=modelData[i]; i++) self.insert(db.name, db.rows);
			successCallback();
		};

		self.insert = function(model, rows, successCallback){
			if("function" !== typeof successCallback) successCallback = function(){};
			var data;
			try{ data = JSON.parse(getCookie(model)); }
			catch(e){ data = []; }
			if(!Array.isArray(data)) data = [];
			for(var n=0; n<rows.length; n++) data.push(rows[n]);
			var newData = JSON.stringify(data);
			setCookie(model, newData);
			// Make sure the data fits in the cookie, 
			// else revert and throw an error
			if(getCookie(model) !== newData){
				var i=100;
				while(i-- && getCookie(model) !== newData){
					data.pop();
					newData = JSON.stringify(data);
					setCookie(model, newData);
				}
				return _throw(new jSQL_Error("0067"));
			}
			successCallback();
		};

		self.delete = function(model, successCallback){
			if("function" !== typeof successCallback) successCallback = function(){};
			setCookie(model, JSON.stringify([]));
			successCallback();
		};

		self.select = function(model, successCallback){
			if("function" !== typeof successCallback) successCallback = function(){};
			var data = JSON.parse(getCookie(model));
			successCallback(data);
		};
	},

	localStorageAPI: function(){
		var self = this;

		self.init = function(modelData, successCallback){
			if("function" !== typeof successCallback) successCallback = function(){};
			for(var i=0, db; db=modelData[i]; i++) self.insert(db.name, db.rows);
			successCallback();
		};

		self.insert = function(model, rows, successCallback){
			if("function" !== typeof successCallback) successCallback = function(){};
			var data;
			try{ data = JSON.parse(localStorage.getItem(model)); }
			catch(e){ data = []; }
			if(!Array.isArray(data)) data = [];
			for(var n=0; n<rows.length; n++) data.push(rows[n]);
			var newData = JSON.stringify(data);
			localStorage.setItem(model, newData);
			// Make sure the data fits in the cookie, 
			// else revert and throw an error
			if(localStorage.getItem(model) !== newData){
				var i=100;
				while(i-- && localStorage.getItem(model) !== newData){
					data.pop();
					newData = JSON.stringify(data);
					localStorage.setItem(model, newData);
				}
				return _throw(new jSQL_Error("0067"));
			}
			successCallback();
		};

		self.delete = function(model, successCallback){
			if("function" !== typeof successCallback) successCallback = function(){};
			localStorage.setItem(model, JSON.stringify([]));
			successCallback();
		};

		self.select = function(model, successCallback){
			if("function" !== typeof successCallback) successCallback = function(){};
			var data = JSON.parse(localStorage.getItem(model));
			successCallback(data);
		};
	},

	nodeAPI: function(){
		var self = this;
		self.db = null;
		var fs = require('fs');

		// Check that datastores exist.
		// If not, create and populate them.
		self.init = function(modelData, successCallback){
			if("function" !== typeof successCallback) successCallback = function(){};
			if(!fs.existsSync(".jsqldatastore")){
				try {
					fs.writeFileSync(".jsqldatastore", JSON.stringify(modelData));
				} catch (e) {
					return _throw(new jSQL_Error("0064"));
				}
			}
			successCallback();
		};

		self.insert = function(model, rows, successCallback){
			if("function" !== typeof successCallback) successCallback = function(){};
			var data = JSON.parse(fs.readFileSync(".jsqldatastore", {encoding: "utf8"}));
			var i;
			for(i=data.length; i--;){
				if(!data[i].name === model) continue;
				break;
			}
			for(var n=0; n<rows.length; n++) data[i].rows.push(rows[n]);
			fs.writeFileSync(".jsqldatastore", JSON.stringify(data));
			successCallback();
		};

		self.delete = function(model, successCallback){
			if("function" !== typeof successCallback) successCallback = function(){};
			var data = JSON.parse(fs.readFileSync(".jsqldatastore", {encoding: "utf8"}));
			for(var i=data.length; i--;){
				if(!data[i].name === model) continue;
				data[i].rows = [];
				break;
			}
			fs.writeFileSync(".jsqldatastore", JSON.stringify(data));
			successCallback();
		};

		self.select = function(model, successCallback){
			if("function" !== typeof successCallback) successCallback = function(){};
			var data = JSON.parse(fs.readFileSync(".jsqldatastore", {encoding: "utf8"}));
			for(var i=data.length; i--;){
				if(!data[i].name === model) continue;
				successCallback(data[i].rows);
				return;
			}
		};
	},

	indexedDBAPI: function() {
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
				return _throw(new jSQL_Error("0057"));
			}

			if (!indexedDB)
				return _throw(new jSQL_Error("0057"));

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
							return _throw(new jSQL_Error("0058"));
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
						return _throw(new jSQL_Error("0059"));
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
				return _throw(new jSQL_Error("0060"));
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

			transaction.onerror = function(){ return _throw(new jSQL_Error("0061")); };
			store = transaction.objectStore(model);
			for (i in data) {
				if (data.hasOwnProperty(i)) {
					request = store.add(data[i]);
					request.onsuccess = successCallbackInner;
					request.onerror = function(){ return _throw(new jSQL_Error("0062")); };
				}
			}
		};

		// Delete all items from the database
		self.delete = function(model, successCallback) {
			if(typeof successCallback != "function") successCallback = function(){};
			var transaction = self.db.transaction([model], undefined === IDBTransaction.READ_WRITE ? 'readwrite' : IDBTransaction.READ_WRITE), store, request;
			transaction.onerror = function(){ return _throw(new jSQL_Error("0061")); };
			store = transaction.objectStore(model);
			request = store.clear();
			request.onerror = function(){ return _throw(new jSQL_Error("0062")); };
			request.onsuccess = successCallback;
		};

		// Get all data from the datastore
		self.select = function(model, successCallback) {
			if("function" !== typeof successCallback) successCallback = function(){};
			var transaction = self.db.transaction([model], undefined === IDBTransaction.READ_ONLY ? 'readonly' : IDBTransaction.READ_ONLY), store, request, results = [];
			transaction.onerror = function(){ return _throw(new jSQL_Error("0061")); };;
			store = transaction.objectStore(model);
			request = store.openCursor();
			request.onerror = function(){ return _throw(new jSQL_Error("0062")); };
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
	},

	WebSQLAPI: function() {
		var self = this;
		self.db = null;

		// private function to execute a query
		var __runQuery = function(query, data, successCallback, failureCallback) {
			if(typeof successCallback != "function") successCallback = function(){};
			if(typeof failureCallback != "function") failureCallback = function(){ return _throw(new jSQL_Error("0054")); };

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
				}catch(e){ return _throw(new jSQL_Error("0055")); }
			};

			try {
				var dbname = window.location.href.replace(/\W+/g, ""); // use the current url to keep it unique
				self.db = openDatabase("jSQL_"+dbname, "1.0", "jSQL "+dbname, (5 * 1024 * 1024));
			} catch(e){ return _throw(new jSQL_Error("0056")); }

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
};


/* istanbul ignore next */
var persistenceManager = new (function(){
	var self = this;
	self.api = null;
	self.error = false;
	self.loaded = false;
	self.isLoading = false;
	self.initiated = false;
	self.loadingCallbacks = [];
	self.api_default_priority = ['indexedDBAPI', 'WebSQLAPI', 'localStorageAPI', 'cookieAPI'];
	self.api_user_priority = [];

	self.setApiPriority = function(){
		self.api_user_priority = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));
	};

	self.getApi = function(){ 
		var constructor = false;
		try{
			constructor = self.api.constructor.name;
		}catch(e){
			constructor = false;
		}
		return constructor;
	};

	self.commit = function(callback){
		if("function" === typeof callback) callback = function(){};
		if(self.error!==false) return _throw(self.error);
		var rows = [];
		for(var tbl in jSQL.tables){
			if(!jSQL.tables.hasOwnProperty(tbl)) continue;

			var keys = [];
			for(var i=0; i<jSQL.tables[tbl].keys.unique.length; i++)
				keys.push({column: jSQL.tables[tbl].keys.unique[i].column, type: "unique"});
			if(jSQL.tables[tbl].keys.primary.column)
				keys.push({column: jSQL.tables[tbl].keys.primary.column, type: "primary"});

			var data = jSQL.select("*").from(tbl).execute().fetchAll();
			if(!data.length){
				// Save empty tables				
				rows.push({
					table: tbl, 
					data: JSON.stringify(jSQL.tables[tbl].columns), 
					colTypes: JSON.stringify(jSQL.tables[tbl].types), 
					keys: JSON.stringify(keys),
					ai_col: jSQL.tables[tbl].auto_inc_col
				});
			}
			for(var i=data.length; i--;){
				var row = data[i];
				for(var n in row){
					if(!row.hasOwnProperty(n)) continue;
					row[n] = jSQL.tables[tbl].normalizeColumnStoreValue(n, row[n]);
				}
				rows.push({
					table: tbl, 
					data: JSON.stringify(row), 
					colTypes: JSON.stringify(jSQL.tables[tbl].types), 
					keys: JSON.stringify(keys),
					ai_col: jSQL.tables[tbl].auto_inc_col
				});
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

		if(!self.initiated){
			self.init(function(){
				self.rollback(function(){
					self.isLoading = false;
					self.loaded = true;
					while(self.loadingCallbacks.length) 
						self.loadingCallbacks.shift()();
				});
			});
		}else{
			self.rollback(function(){
				self.isLoading = false;
				self.loaded = true;
				while(self.loadingCallbacks.length) 
					self.loadingCallbacks.shift()();
			});
		}

	};

	self.rollback = function(LoadCallback){
		if("function" !== typeof LoadCallback) LoadCallback = function(){};

		// Wait for the schema to be set up
		mute_jsql_errors = true;
		(function waitForSchema(tries){
			try{
				self.api.select("jSQL_data_schema", function(r){
					jSQL.tables = {};
					if(r.length === 0){
						mute_jsql_errors = false;
						LoadCallback();
						return;
					}
					for(var i=r.length; i--;){
						var tablename = r[i].table;
						var rowdata = JSON.parse(r[i].data);
						var colTypes = JSON.parse(r[i].colTypes);
						var keys = JSON.parse(r[i].keys);
						var ai_col = r[i].ai_col;

						// Create the table in memory if it doesn't exist yet
						if(undefined === jSQL.tables[tablename]){
							if(Array.isArray(rowdata)){
								cols = rowdata;
								jSQL.createTable(tablename, cols, colTypes, keys, ai_col).execute();
							}else{
								var cols = [];
								for(var c in rowdata)
									if(rowdata.hasOwnProperty(c))
										cols.push(c);
								jSQL.createTable(tablename, cols, colTypes, keys, ai_col).execute();
							}
						}

						// If it's an array it's just column names and the table is empty
						// So, only do this if the rowdata is actually a rowdata object
						if(!Array.isArray(rowdata)){
							for(var c in rowdata){
								if(!rowdata.hasOwnProperty(c)) continue;
								rowdata[c] = jSQL.tables[tablename].normalizeColumnFetchValue(c, rowdata[c]);
							}
							jSQL.tables[tablename].insertRow(rowdata);
						}
					}

					mute_jsql_errors = false;
					LoadCallback();
					return;
				});
			}catch(e){
				if(tries > 500){
					mute_jsql_errors = false;
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

	// Initiate the database
	self.init = function(successCallback){
		if("function" !== typeof successCallback) successCallback = function(){};
		self.initiated = true;
		if(isNode){
			self.api = new API.nodeAPI();
			self.api.init([{name: "jSQL_data_schema", rows:[]}], successCallback);
		}else{
			var priority = self.api_user_priority.concat(self.api_default_priority);
			var tried = [], APIIsSet = false;

			(function loop(i){
				if(i>=priority.length){
					if(!APIIsSet) return _throw(new jSQL_Error("0063"));
				}
				if(self.api_default_priority.indexOf(priority[i]) === -1) return loop(1+i);
				if(tried.indexOf(priority[i]) > -1) return loop(1+i);

				try{
					self.api = new API[priority[i]]();
					self.api.init([{name: "jSQL_data_schema", rows:[]}], successCallback);
					APIIsSet = true;
				}catch(ex){
					APIIsSet = false;
				}
				if(!APIIsSet) loop(1+i);
			})(0);

		}
	};

})();

function createTable(name, columnsOrData, types, keys, auto_increment){

	// allow for all params to be passed in a single object
	// jSQL.createTable({myTable: [
	//		{ name: "ID", type: "INT", args: [] }, 
	//		{ name: "Name", type: "VARCHAR", args: [30] }
	// ]})
	// 
	// OR, for compund keys
	// 
	// jSQL.createTable({myTable: [
	//		{ name: "ID", type: "INT", args: [] }, 
	//		{ name: "Name", type: "VARCHAR", args: [30] }
	// ]}, [
	//		{ column: ["ID", "Name"], type: "primary" }	
	// ])
	// 
	// OR, for single-column keys
	//
	// jSQL.createTable({myTable: [
	//		{ name: "ID", type: "INT", args: [], key: "primary", auto_increment: true }, 
	//		{ name: "Name", type: "VARCHAR", args: [30] }
	// ]})
	var dataObjNoKeys = undefined === columnsOrData && undefined === types && "object" === typeof name && undefined === keys;
	var dataObjWithKeys = Array.isArray(columnsOrData) && undefined === types && "object" === typeof name && undefined === keys;
	if(dataObjNoKeys || dataObjWithKeys){
		if(dataObjWithKeys) keys = undefined === columnsOrData ? [] : columnsOrData; 
		if(undefined === keys) keys = [];
		columnsOrData = [];
		types = [];
		for(var tblname in name){
			if(!name.hasOwnProperty(tblname))continue;
			var columnDefs = name[tblname];
			name = tblname;
			for(var n=0; n<columnDefs.length; n++){ 
				var col = columnDefs[n].name;
				columnsOrData.push(col);
				types.push({
					type: columnDefs[n].type, 
					args: (undefined===columnDefs[n].args ? []:columnDefs[n].args),
					default: (undefined===columnDefs[n].default?undefined:columnDefs[n].default),
					null: (undefined===columnDefs[n].null?true:columnDefs[n].null),
				});
				// if a key is defined in the row column (only for single column keys)
				if(columnDefs[n].hasOwnProperty("key") && Array.isArray(keys)){
					keys.push({column: columnDefs[n].name, type: columnDefs[n].key});
				}
				// If auto_incerment is defined in the column definitions
				if(columnDefs[n].hasOwnProperty("auto_increment") && columnDefs[n].auto_increment === true){
					auto_increment = columnDefs[n].name;
				}
			}
			break;
		}
	}

	// if a single column was provided
	if(!Array.isArray(columnsOrData)) columnsOrData=[columnsOrData];
	if(undefined === keys) keys = [];
	if(!Array.isArray(keys)) keys=[keys];
	return new jSQLQuery("CREATE").init(name, columnsOrData, types, keys, auto_increment);
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


function tokenize(sql){
	return new jSQLLexer(sql).getTokens();
}

function jSQLReset(){ 
	jSQL.tables = {};
	jSQL.commit(); 
}

function jSQLMinifier(sql){
	var tokens = new jSQLLexer(sql).getTokens();
	var minified_sql = [];
	for(var i=0;i<tokens.length;i++) minified_sql.push(tokens[i].literal);
	return minified_sql.join(' ');
}

function removeQuotes(str){
	var quotes = ['"', "'", "`"];
	for (var i = quotes.length; i--; )
		if (str.substr(0, 1) == quotes[i] && str.substr(str.length - 1, 1) == quotes[i])
			return str.substr(1, str.length - 2);
	return str;
}

function jsql_export(create_tables, table_names){
	create_tables = undefined === create_tables ? true : !!create_tables;
	table_names = table_names || [];
	var dump_buffer = [];
	for(var table in jSQL.tables){
		if(!jSQL.tables.hasOwnProperty(table)) continue;
		if(!table_names.length || ~table_names.indexOf(table)){
			if(create_tables){
				var table_buffer = [];
				for(var i=0; i<jSQL.tables[table].columns.length; i++){
					var col_buffer = [];
					col_buffer.push("`"+jSQL.tables[table].columns[i]+"` ");
					var args = "";
					if(jSQL.tables[table].types[i].args.length) args = JSON.stringify(jSQL.tables[table].types[i].args).trim().slice(1, -1);
					col_buffer.push(jSQL.tables[table].types[i].type+"("+args+") ");
					col_buffer.push(jSQL.tables[table].types[i].null ? 'NULL ' : 'NOT NULL ');
					if(jSQL.tables[table].types[i].default) col_buffer.push('DEFAULT '+JSON.stringify(jSQL.tables[table].types[i].default)+' ');
					if(jSQL.tables[table].columns[i] === jSQL.tables[table].auto_inc_col) col_buffer.push('AUTO_INCREMENT');
					table_buffer.push("\n\t"+(col_buffer.join('').trim()))
				}
				if(jSQL.tables[table].keys.primary.column){
					col_buffer = []; 
					if(Array.isArray(jSQL.tables[table].keys.primary.column)){
						for(var i=0; i<jSQL.tables[table].keys.primary.column.length; i++){
							col_buffer.push('`'+jSQL.tables[table].keys.primary.column[i]+'`');
						}
					}else{
						col_buffer.push('`'+jSQL.tables[table].keys.primary.column+'`');
					}
					table_buffer.push("\n\tPRIMARY KEY ("+(col_buffer.join(','))+")");
				}
				if(jSQL.tables[table].keys.unique.length){
					for(var n=0; n<jSQL.tables[table].keys.unique.length; n++){
						col_buffer = []; 
						if(Array.isArray(jSQL.tables[table].keys.unique[n].column)){
							for(var i=0; i<jSQL.tables[table].keys.unique[n].column.length; i++){
								col_buffer.push('`'+jSQL.tables[table].keys.unique[n].column[i]+'`');
							}
						}else{
							col_buffer.push('`'+jSQL.tables[table].keys.unique[n].column+'`');
						}
						table_buffer.push("\n\tUNIQUE KEY ("+(col_buffer.join(','))+")");
					}
				}
				dump_buffer.push('CREATE TABLE `'+table+'` ('+(table_buffer.join(","))+"\n)");
			}
			for(var i=0; i<jSQL.tables[table].data.length; i++){
				var values = JSON.stringify(jSQL.tables[table].data[i]).trim().slice(1, -1).replace(/"jsqlNull"/g, 'null');
				dump_buffer.push("INSERT INTO `"+table+"` (`"+(jSQL.tables[table].columns.join('`,`'))+"`) VALUES ("+values+")");
			}
		}
	}
	var header = ["-- Exported by jSQL v"+jSQL.version+" "+(new Date().toUTCString())];
	var hwrapper = "-".repeat(header[0].length);
	header.unshift(hwrapper);
	header.push(hwrapper);
	return (header.join("\n"))+"\n"+(dump_buffer.join(";\n"));
}


function jsql_import(dump){
	dump = dump.split(";\n");
	for(var i=0; i<dump.length; i++){
		jSQL.query(dump[i]).execute();
	}
}

return {
	version: "3.2.9",
	tables: {},
	query: jSQLParseQuery,
	createTable: createTable,
	dropTable: dropTable,
	select: select,
	update: update,
	deleteFrom: deleteFrom,
	insertInto: insertInto,
	types: new jSQLDataTypeList(),
	load: persistenceManager.load,
	onError: onError,
	reset: jSQLReset,
	minify: jSQLMinifier,
	commit: persistenceManager.commit,
	rollback: persistenceManager.rollback,
	setApiPriority: persistenceManager.setApiPriority,
	getApi: persistenceManager.getApi,
	tokenize: tokenize,
	export: jsql_export,
    import: jsql_import
};

})();

// Determine if we're running Node or browser
if (isNode) {
	module.exports = jSQL;
} else {
	window.jSQL = jSQL;
}
	
})();
