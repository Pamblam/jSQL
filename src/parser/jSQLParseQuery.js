
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
		case "DELETE FROM":
			
			break;
		case "DROP TABLE":
			
			break;
		case "UPDATE":
			
			break;
	}
	
	return _throw(new jSQL_Error("0041"));
}

// make sure its not a data type name and trim quotes
jSQLParseQuery.validateIdentifierToken = function(token, exp){
	if (token.name !== "QTD IDENTIFIER" && jSQL.types.exists(removeQuotes(token.literal))) {
		token.name = "DATA TYPE";
		return _throw(new jSQL_Parse_Error(token, exp));
	}
	return removeQuotes(token.literal);
};