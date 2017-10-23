
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