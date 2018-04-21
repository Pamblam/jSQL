
function jSQLParseCreateTokens(tokens){
	var table_name = false,
		token,
		if_not_exists = false,
		keys = [],
		params = {},
		temp = false;

	token = tokens.shift();
	
	if(token.type === 'KEYWORD' && token.name === 'TEMPORARY'){
		temp = true;
		token = tokens.shift();
	}
	
	if(token.name !== 'TABLE') return _throw(new jSQL_Parse_Error(token, "TABLE"));
	token = tokens.shift();
	
	if(token.type === "QUALIFIER" && token.name === "IF NOT EXISTS"){
		if_not_exists = true;
		token = tokens.shift();
	}
	
	if(token.type === "IDENTIFIER") table_name = token.value;
	
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
				
				if(token.type === "IDENTIFIER") var key_col_name = token.value;
				else return _throw(new jSQL_Parse_Error(token, "COLUMN NAME"));
				
				key_cols.push(key_col_name);
			}
			
			if(!key_cols.length) return _throw(new jSQL_Parse_Error(token, "COLUMN NAME"));
			
			keys.push({column: key_cols, type: key_type});
			continue;
		}
		
		if(token.type === "IDENTIFIER") var col_name = token.value;
		else return _throw(new jSQL_Parse_Error(token, "COLUMN NAME"));
		
		var column = {name: col_name, type:"AMBI", args:[], null: true, default: undefined};
		
		token = tokens.shift();
		
		// column definition
		if(token.name === "DATA TYPE"){
			column.type = token.literal.toUpperCase();
			token = tokens.shift();
			
			if(token.type === "SYMBOL" && token.name === "LEFT PEREN"){
				while(tokens.length){
					token = tokens.shift();
					if(token.type === "SYMBOL" && token.name === "COMMA") continue;
					if(token.type === "SYMBOL" && token.name === "RIGHT PEREN") break;
					if(token.type === "STRING" || token.type === "NUMBER"){
						column.args.push(token.value);
						continue;
					}
					return _throw(new jSQL_Parse_Error(token, "DATA TYPE PARAM OR CLOSING PEREN"));
				}
				token = tokens.shift();
			}
		}
		
		if(token.type === "KEYWORD" && (token.name === "NULL" || token.name === "NOT NULL")){
			column.null = token.name === "NULL";
			token = tokens.shift();
		}
		
		if(token.type === "KEYWORD" && token.name === "DEFAULT"){
			column.default = tokens.shift().value;
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
		
		params[table_name].push(column);
		
	}
	
	if(tokens.length){
		token = tokens.shift();
		if(token.type !== "SYMBOL" || token.name !== "SEMICOLON") 
			return _throw(new jSQL_Parse_Error(token, "END OF STATEMENT"));
	}
	
	var query = jSQL.createTable(params, keys);
	if(temp) query.temporary();
	if(if_not_exists) query.ifNotExists();
	
	return query;
	
}