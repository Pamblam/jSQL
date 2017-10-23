
function jSQLMinifier(sql){
	var tokens = new jSQLLexer(sql).getTokens();
	var minified_sql = [];
	for(var i=0;i<tokens.length;i++) minified_sql.push(tokens[i].literal);
	return minified_sql.join(' ');
}