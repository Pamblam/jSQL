
function select(cols){
	if(!Array.isArray(cols)) cols=[cols];
	return new jSQLQuery("SELECT").init(cols);
}
