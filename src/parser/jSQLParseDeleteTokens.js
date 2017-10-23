
function jSQLParseDeleteTokens(tokens){
	var token = tokens.shift();
	var table_name = jSQLParseQuery.validateTableNameToken(token);
	var query = jSQL.deleteFrom(table_name);
	query = jSQLParseWhereClause(query, tokens, table_name);
	return query;
}