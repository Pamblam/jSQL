
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