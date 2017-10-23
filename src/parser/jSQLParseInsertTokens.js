
function jSQLParseInsertTokens(tokens){
	var table_name, cols=[], values = [], ignore = false;
	
	var token = tokens.shift();
	
	if(token.type === "KEYWORD" && token.name === "IGNORE"){
		ignore = true;
		token = tokens.shift();
	}
	
	if(token.type !== "KEYWORD" && token.name === "INTO")
		return _throw(new jSQL_Parse_Error(token, "INTO"));
	
	token = tokens.shift();
	table_name = jSQLParseQuery.validateTableNameToken(token);
	
	token = tokens.shift();
	if(token.type !== "KEYWORD" && token.name !== "VALUES"){
		
		if(token.type !== "SYMBOL" || token.name !== "LEFT PEREN") 
			return _throw(new jSQL_Parse_Error(token, "COLUMN LIST OR VALUES"));
		
		while(tokens.length){
			token = tokens.shift();
			if(token.type === "SYMBOL" && token.name === "COMMA") continue;
			if(token.type === "SYMBOL" && token.name === "RIGHT PEREN"){
				token = tokens.shift();
				break;
			}
			
			if(token.type === "IDENTIFIER") 
				var colname = jSQLParseQuery.validateColumnName(token.value, table_name);
			else return _throw(new jSQL_Parse_Error(token, "COLUMN NAME"));
			
			cols.push(colname);
		}
	}
	
	if(token.type !== "KEYWORD" && token.name !== "VALUES")
		return _throw(new jSQL_Parse_Error(token, "VALUES"));
	
	token = tokens.shift();
	if(token.type !== "SYMBOL" || token.name !== "LEFT PEREN") 
		return _throw(new jSQL_Parse_Error(token, "VALUES LIST"));
	
	while(tokens.length){
		token = tokens.shift();
		if(token.type === "SYMBOL" && token.name === "COMMA") continue;
		if(token.type === "SYMBOL" && token.name === "RIGHT PEREN") break;
		values.push(token.value);
	}
	
	if(tokens.length){
		token = tokens.shift();
		if(token.type !== "SYMBOL" || token.name !== "SEMICOLON") 
			return _throw(new jSQL_Parse_Error(token, "END OF STATEMENT"));
	}
	
	if(!cols.length){
		for(var i=0;  i<values.length; i++){
			if(undefined === jSQL.tables[table_name].columns[i]) return _throw(new jSQL_Error("0032"));
			cols.push(jSQL.tables[table_name].columns[i]);
		}
	}
	
	if(values.length !== cols.length) return _throw(new jSQL_Error("0033"));
	
	var data = {};
	for(var i=0; i<cols.length; i++){
		data[cols[i]] = values[i];
	}

	var q = jSQL.insertInto(table_name).values(data);
	return ignore ? q.ignore() : q;
	
}

