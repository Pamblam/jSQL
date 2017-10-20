
function dropTable(tablename){
	return new jSQLQuery("DROP").init(tablename);
}
