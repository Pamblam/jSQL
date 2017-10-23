
function jSQLParseDropTokens(tokens){
	var token = tokens.shift();
	var table_name = jSQLParseQuery.validateTableNameToken(token);
	return jSQL.dropTable(table_name);
}