

function jSQLLexer(input) {
	this.input = input;
	this.pos = 0;
	this.real_pos = 0;
	this.tokens = [];
	this.token_matches = [];
}

jSQLLexer.prototype.getNextToken = function(){
	var r;
	for(var i=0; i<jSQLLexer.token_types.length; i++){
		while ((r = jSQLLexer.token_types[i].pattern.exec(this.input)) != null) {
			if(r.index !== this.pos) continue;
			var token = new jSQLToken(this.pos, r[0], i);
			this.pos += token.length;
			return token;
		}
	}
	return false;
};

jSQLLexer.prototype.getTokens = function(){	
	if(this.tokens.length) return this.tokens;
	this.pos = 0; this.tokens = [];
	var throwaway = ["COMMENT", "WHITESPACE"], token;
	while ((token = this.getNextToken()) != false) 
		if(throwaway.indexOf(token.type) === -1)
			this.tokens.push(token);
	if(this.pos !== this.input.length){
		var pos;
		if(this.tokens.length){
			var lastToken = this.tokens[this.tokens.length-1];
			pos = lastToken.input_pos + lastToken.length;
		}else pos = 0;
		console.log(this.tokens.map(function(t){return t.literal}).join(' '));
		return _throw(new jSQL_Lexer_Error(pos, this.input)); 
	}
	return this.tokens;
};

