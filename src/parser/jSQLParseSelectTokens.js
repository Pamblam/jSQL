
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

