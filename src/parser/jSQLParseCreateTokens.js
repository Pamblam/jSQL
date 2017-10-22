
function jSQLParseCreateTokens(tokens){
	var table_name = false,
		token,
		if_not_exists = false,
		keys = [],
		params = {};

	token = tokens.shift();
	
	if(token.type === "QUALIFIER" && token.name === "IF NOT EXISTS"){
		if_not_exists = true;
		token = tokens.shift();
	}
	
	if(token.type === "IDENTIFIER"){
		table_name = jSQLParseQuery.validateIdentifierToken(token, "TABLE NAME");
	}
	
	if(!table_name) return _throw(new jSQL_Parse_Error(token, "TABLE NAME"));
	
	params[table_name] = [];
	
	token = tokens.shift();
	if(token.type !== "SYMBOL" || token.name !== "LEFT PEREN") 
		return _throw(new jSQL_Parse_Error(token, "LEFT PEREN"));
	
	while(tokens.length){
		token = tokens.shift();
		if(token.type === "SYMBOL" && token.name === "COMMA") continue;
		if(token.type === "SYMBOL" && token.name === "RIGHT PEREN") break;
		
		// If this line is actually a key definition rather than a column defintion
		if(token.type === "KEYWORD" && (token.name === "UNIQUE KEY" || token.name === "PRIMARY KEY")){
			var key_type = token.name.split(" ")[0].toLowerCase();
			token = tokens.shift();
			if(token.type !== "SYMBOL" || token.name !== "LEFT PEREN") 
				return _throw(new jSQL_Parse_Error(token, "LEFT PEREN"));
			
			var key_cols = [];
			while(tokens.length){
				token = tokens.shift();
				if(token.type === "SYMBOL" && token.name === "COMMA") continue;
				if(token.type === "SYMBOL" && token.name === "RIGHT PEREN") break;
				
				var key_col_name = jSQLParseQuery.validateIdentifierToken(token, "COLUMN NAME");
				key_cols.push(key_col_name);
			}
			
			if(!key_cols.length) return _throw(new jSQL_Parse_Error(token, "COLUMN NAME"));
			
			keys.push({column: key_cols, type: key_type});
			continue;
		}
		
		var col_name = jSQLParseQuery.validateIdentifierToken(token, "COLUMN NAME");
		
		var column = {name: col_name, type:"AMBI", args:[]};
		
		token = tokens.shift();
		
		// column definition
		if(token.isDataType){
			column.type = token.literal.toUpperCase();
			token = tokens.shift();
			
			if(token.type === "SYMBOL" && token.name === "LEFT PEREN"){
				while(tokens.length){
					token = tokens.shift();
					if(token.type === "SYMBOL" && token.name === "COMMA") continue;
					if(token.type === "SYMBOL" && token.name === "RIGHT PEREN") break;
					if(token.type === "STRING" || token.type === "NUMBER"){
						column.args.push(removeQuotes(token.literal));
						continue;
					}
					return _throw(new jSQL_Parse_Error(token, "DATA TYPE PARAM OR CLOSING PEREN"));
				}
				token = tokens.shift();
			}
			
			if(token.type === "KEYWORD" && token.name === "AUTO_INCREMENT"){
				column.auto_increment = true;
				token = tokens.shift();
			}
			
			if(token.type === "KEYWORD" && (token.name === "UNIQUE KEY" || token.name === "PRIMARY KEY")){
				keys.push({column: col_name, type: token.name.split(" ")[0].toLowerCase()});
				token = tokens.shift();
			}
		}
		
		params[table_name].push(column);
		
	}
	
	if(tokens.length){
		token = tokens.shift();
		if(token.type !== "SYMBOL" || token.name !== "SEMICOLON") 
			return _throw(new jSQL_Parse_Error(token, "END OF STATEMENT"));
	}
	
	var query = jSQL.createTable(params, keys);
	if(if_not_exists) query.ifNotExists();
	
	return query;
	
}