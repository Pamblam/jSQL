
function jSQLParseWhereClause(query, tokens, table_name){
	var orderColumns = [];
	while(tokens.length){
		var token = tokens.shift();
		switch(token.type){
			case "KEYWORD":
				switch(token.name){
					case "WHERE":
					case "AND":
						query = query.where(jSQLParseQuery.validateColumnName(tokens.shift().value, table_name));
						break;
					case "LIKE":
						var substr = tokens.shift().value;
						// "%text%" - Contains text
						if(substr.substr(0,1)=="%" && substr.substr(substr.length-1,1)=="%"){
							query = query.contains(substr.substr(1,substr.length-2));
						// "%text" - Ends with text
						}else if(substr.substr(0,1)=="%"){
							query = query.endsWith(substr.substr(1,substr.length-1));
						// "text%" - Begins with text
						}else if(substr.substr(substr.length-1,1)=="%"){
							query = query.beginsWith(substr.substr(0,substr.length-1));
						}else if(substr === "?"){
							// Is a pepared statement, no value available at this time
							query = query.preparedLike();
						}else{
							// no "%" on either side. jSQL only supports % when 
							// the string begins or ends with it, so treat it like an equal
							query = query.equals(substr);
						}
						break;
					case "OR":
						query = query.or(jSQLParseQuery.validateColumnName(tokens.shift().value, table_name));
						break;
					case "LIMIT":
						var limit = tokens.shift().value, offset, commaFound=false;
						token = tokens.shift();
						if(token.type === "SYMBOL" && token.name === "COMMA") commaFound = true;
						else tokens.unshift(token);
						if(commaFound){
							offset = limit;
							limit = tokens.shift().value;
						}
						if(tokens.length && !commaFound){
							var token = tokens.shift();
							if(token.type === "KEYWORD" && token.name === "OFFSET"){
								offset = tokens.shift().value;
							}else tokens.unshift(token);
						}
						query = query.limit(limit, offset);
						break;
					case "ORDER BY":
						while(tokens.length){
							var token = tokens.shift();
							if(token.type === "SYMBOL" && token.name === "COMMA") continue;
							try{
								var column_name = jSQLParseQuery.validateColumnName(token.value, table_name);
								orderColumns.push(column_name);
							}catch(e){
								tokens.unshift(token); 
								break;
							}
						}
						query = query.orderBy(orderColumns);
						break;
					case "ASC":
						if(!orderColumns.length) return _throw(new jSQL_Error("0026"));
						query = query.asc();
						break;
					case "DESC":
						if(!orderColumns.length) return _throw(new jSQL_Error("0027"));
						query = query.desc();
						break;	
					default: return _throw(new jSQL_Parse_Error(token));
				}
				break;
			case "SYMBOL":
				switch(token.name){
					case "EQUALS":
						query = query.equals(tokens.shift().value);
						break;
					case "GREATER THAN":
						query = query.greaterThan(tokens.shift().value);
						break;
					case "LESS THAN":
						query = query.lessThan(tokens.shift().value);
						break;
					case "NOT EQUAL":
						query = query.doesNotEqual(tokens.shift().value);
						break;
					default: return _throw(new jSQL_Parse_Error(token));
				}
				break;
			default: return _throw(new jSQL_Parse_Error(token, "SYMBOL OR KEYWORD"));
		}
	}
	return query;
}