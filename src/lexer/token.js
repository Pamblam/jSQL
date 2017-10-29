

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
	if(this.type === "KEYWORD" && this.name === "NULL") this.value = null;
}
