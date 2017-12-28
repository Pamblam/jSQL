

function jsql_import(dump){
	dump = dump.split(";\n");
	for(var i=0; i<dump.length; i++){
		jSQL.query(dump[i]).execute();
	}
}