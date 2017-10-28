
function tokenize(sql){
	return new jSQLLexer(sql).getTokens();
}