
function jSQLParseQuery(query){

	var tokens = new jSQLLexer(query).getTokens();
	
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