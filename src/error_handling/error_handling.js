
var error_handler_function = function(){};
var mute_jsql_errors = false;
function _throw(e, skip){
	if(skip !== true && mute_jsql_errors !== true) error_handler_function(e);
	throw e;
};

function onError(funct){
	if(typeof funct === "function") error_handler_function = funct;
}
