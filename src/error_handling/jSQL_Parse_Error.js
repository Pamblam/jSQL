
function jSQL_Parse_Error(tok, exp) {
	this.error = "0071";
	this.message = "Unexpected "+tok.type+" ("+tok.name+") at character "+tok.input_pos+".";
	if(exp) this.message += " Expected "+exp+".";
	this.stack = undefined;
	var e = new Error();
	if(e.stack) this.stack = e.stack;
	this.toString = function () {
		return "jSQL Parse Error #"+this.error+" - "+this.message;
	};
}
