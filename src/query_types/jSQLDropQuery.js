
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
