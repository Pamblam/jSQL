

function jSQLLexer(input) {
	this.input = input;
	this.pos = 0;
	this.tokens = [];
	this.token_matches = [];
}

jSQLLexer.prototype.getTokenMatches = function(){
	if(this.token_matches.length) return this.token_matches;
	this.token_matches = []
	var r;
	for(var i=0; i<jSQLLexer.token_types.length; i++){
		this.token_matches[i] = [];
		while ((r = jSQLLexer.token_types[i].pattern.exec(this.input)) != null) {
			this.token_matches[i].push(r);
		}
	}
	return this.token_matches;
};

jSQLLexer.prototype.getTokens = function(){	
	if(this.tokens.length) return this.tokens;
	this.pos = 0;
	var matches = this.getTokenMatches(),
	throwaway = ["COMMENT", "WHITESPACE"];
	for(var type_id=0; type_id<matches.length; type_id++){
		if(this.pos >= this.input.length) break;
		for(var match_index=0; match_index<matches[type_id].length; match_index++){
			var r = matches[type_id][match_index];
			if(r.index !== this.pos) continue;
			var token = new jSQLToken(this.pos, r[0], type_id);
			if(throwaway.indexOf(token.type) === -1) this.tokens.push(token);
			this.pos += token.length;
			type_id=0;
			break;
		}
	}
	if(this.pos !== this.input.length)
		return _throw(new jSQL_Lexer_Error(this.pos, this.input)); 
	
	return this.tokens;
};

jSQLLexer.token_types = [
	
	// WHITESPACE
	{pattern: /[\n\r]/g,
		type: 'WHITESPACE',
		name: "LINEBREAK"},
	{pattern: /[ \t]/g,
		type: 'WHITESPACE',
		name: "WHITESPACE"},
	
	// STRINGs
	{pattern: /"(?:[^"\\]|\\.)*"/g,
		type: 'STRING',
		name: "DQ STRING"},
	{pattern: /'(?:[^'\\]|\\.)*'/g,
		type: 'STRING',
		name: "SQ STRING"},

	// COMMENTs
	{pattern: /--.*[\n\r$]/g,
		type: 'COMMENT',
		name: "SINGLE LINE COMMENT"},
	{pattern: /\/\*([\s\S]*?)\*\//g,
		type: 'COMMENT',
		name: "MULTI LINE COMMENT"},

	// NUMBERs
	{pattern: /\d+/g,
		type: 'NUMBER',
		name: 'INTEGER'},
	{pattern: /\d+.\.\d+/g,
		type: 'NUMBER',
		name: 'FLOAT'},

	// QUALIFIERs
	{pattern: /if not exists/gi,
		type: 'QUALIFIER',
		name: "IF NOT EXISTS"},

	// SYMBOLs
	{pattern: /\(/gi,
		type: 'SYMBOL',
		name: "LEFT PEREN"},
	{pattern: /\)/gi,
		type: 'SYMBOL',
		name: "RIGHT PEREN"},
	{pattern: /,/gi,
		type: 'SYMBOL',
		name: "COMMA"},
	{pattern: /\?/gi,
		type: 'SYMBOL',
		name: "QUESTION MARK"},
	{pattern: /,/gi,
		type: 'SYMBOL',
		name: "COMMA"},
	{pattern: /\*/gi,
		type: 'SYMBOL',
		name: "ASTERISK"},
	{pattern: /;/gi,
		type: 'SYMBOL',
		name: "SEMICOLON"},

	// KEYWORDs
	{pattern: /primary key/gi,
		type: 'KEYWORD',
		name: "PRIMARY KEY"},
	{pattern: /unique key/gi,
		type: 'KEYWORD',
		name: "UNIQUE KEY"},
	{pattern: /values/gi,
		type: 'KEYWORD',
		name: "VALUES"},
	{pattern: /from/gi,
		type: 'KEYWORD',
		name: "FROM"},
	{pattern: /auto_increment/gi,
		type: 'KEYWORD',
		name: "AUTO_INCREMENT"},
	{pattern: /ignore/gi,
		type: 'KEYWORD',
		name: "IGNORE"},
	{pattern: /into/gi,
		type: 'KEYWORD',
		name: "INTO"},

	// DIRECTIVEs
	{pattern: /create table/gi,
		type: 'DIRECTIVE',
		name: "CREATE TABLE"},
	{pattern: /insert/gi,
		type: 'DIRECTIVE',
		name: "INSERT"},
	{pattern: /devare from/gi,
		type: 'DIRECTIVE',
		name: "DELETE FROM"},
	{pattern: /drop table/gi,
		type: 'DIRECTIVE',
		name: "DROP TABLE"},
	{pattern: /update/gi,
		type: 'DIRECTIVE',
		name: "UPDATE"},
	{pattern: /select/gi,
		type: 'DIRECTIVE',
		name: "SELECT"},

	// IDENTIFIERs are developer specified so should be checked last
	{pattern: /`[0-9a-zA-Z$_]*[0-9a-zA-Z$_]`/gi,
		type: 'IDENTIFIER',
		name: "QTD IDENTIFIER"},
	{pattern: /[0-9a-zA-Z$_]*[0-9a-zA-Z$_]/gi,
		type: 'IDENTIFIER',
		name: "UNQTD IDENTIFIER"}
];

function jSQLToken(pos, literal, tok_index){
	this.type_id = tok_index;
	this.input_pos = pos;
	this.literal = literal;
	this.length = literal.length;
	this.type = jSQLLexer.token_types[tok_index].type;
	this.name = jSQLLexer.token_types[tok_index].name;
	this.isDataType = this.type === "IDENTIFIER" 
		&& this.name === "UNQTD IDENTIFIER"
		&& jSQL.types.exists(this.literal);
}