

function jSQLLexer(input) {
	this.input = input;
	this.pos = 0;
	this.real_pos = 0;
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
			this.pos += token.length;
			if(throwaway.indexOf(token.type) === -1) this.tokens.push(token);
			type_id=-1;
			break;
		}
	}
	if(this.pos !== this.input.length){
		var pos;
		if(this.tokens.length){
			var lastToken = this.tokens[this.tokens.length-1];
			pos = lastToken.input_pos + lastToken.length;
		}else pos = 0;
		return _throw(new jSQL_Lexer_Error(pos, this.input)); 
	}
	return this.tokens;
};

jSQLLexer.token_types = [
	
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

	// WHITESPACE
	{pattern: /\r?\n|\r/g,
		type: 'WHITESPACE',
		name: "LINEBREAK"},
	{pattern: /[ \t]/g,
		type: 'WHITESPACE',
		name: "WHITESPACE"},

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
	{pattern: /!=/gi,
		type: 'SYMBOL',
		name: "NOT EQUAL"},
	{pattern: /<>/gi,
		type: 'SYMBOL',
		name: "NOT EQUAL"},
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
	{pattern: /=/gi,
		type: 'SYMBOL',
		name: "EQUALS"},
	{pattern: />/gi,
		type: 'SYMBOL',
		name: "GREATER THAN"},
	{pattern: /</gi,
		type: 'SYMBOL',
		name: "LESS THAN"},

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
	{pattern: /all/gi,
		type: 'KEYWORD',
		name: "ALL"},
	{pattern: /distinct/gi,
		type: 'KEYWORD',
		name: "DISTINCT"},
	{pattern: /distinctrow/gi,
		type: 'KEYWORD',
		name: "DISTINCTROW"},
	{pattern: /where/gi,
		type: 'KEYWORD',
		name: "WHERE"},
	{pattern: /and/gi,
		type: 'KEYWORD',
		name: "AND"},
	{pattern: /like/gi,
		type: 'KEYWORD',
		name: "LIKE"},
	{pattern: /order by/gi,
		type: 'KEYWORD',
		name: "ORDER BY"},
	{pattern: /or/gi,
		type: 'KEYWORD',
		name: "OR"},
	{pattern: /limit/gi,
		type: 'KEYWORD',
		name: "LIMIT"},
	{pattern: /offset/gi,
		type: 'KEYWORD',
		name: "OFFSET"},
	{pattern: /asc/gi,
		type: 'KEYWORD',
		name: "ASC"},
	{pattern: /desc/gi,
		type: 'KEYWORD',
		name: "DESC"},
	{pattern: /set/gi,
		type: 'KEYWORD',
		name: "SET"},

	// DIRECTIVEs
	{pattern: /create table/gi,
		type: 'DIRECTIVE',
		name: "CREATE TABLE"},
	{pattern: /insert/gi,
		type: 'DIRECTIVE',
		name: "INSERT"},
	{pattern: /delete from/gi,
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
	this.value = literal;
	this.length = literal.length;
	this.type = jSQLLexer.token_types[tok_index].type;
	this.name = jSQLLexer.token_types[tok_index].name;
	
	if(this.type === "IDENTIFIER" && this.name === "UNQTD IDENTIFIER" && jSQL.types.exists(this.literal)) 
		this.name = "DATA TYPE";
	if(this.type === "IDENTIFIER" && this.name === "QTD IDENTIFIER")
		this.value = literal.replace(/`/g,'');
	if(this.type === "STRING" && this.name === "DQ STRING")
		this.value = literal.substr(1, literal.length - 2).replace(/\"/g, '"');
	if(this.type === "STRING" && this.name === "SQ STRING")
		this.value = literal.substr(1, literal.length - 2).replace(/\'/g, "'");
	if(this.type === "NUMBER") this.value = parseFloat(this.literal);
}