
function jSQL_Lexer_Error(pos, context) {
	var max_ellipse_len = 25;
	var ellipse_len = context.length > pos + max_ellipse_len ? max_ellipse_len :
		context.length - pos;
	var preview = context.substr(pos, ellipse_len);
	this.error = "0070";
	this.message = "Unknown token near char "+pos+" of "+context.length+" \""+preview+"\".";
	this.stack = undefined;
	var e = new Error();
	if(e.stack) this.stack = e.stack;
	this.toString = function () {
		return "jSQL Lexer Error #"+this.error+" - "+this.message;
	};
}
