
function jSQL_Error(error_no) {
	this.error = error_no;
	this.stack = undefined;
	var e = new Error();
	if(e.stack) this.stack = e.stack;
	/* istanbul ignore next */
	if(jSQL_Error.message_codes[error_no]) this.message = jSQL_Error.message_codes[error_no];
	else this.message = "Unknown error.";
	this.toString = function () {
		if(undefined === this.error) return "jSQL Error - "+this.message;
		return "jSQL Error #"+this.error+" - "+this.message;
	};
}

jSQL_Error.message_codes = {
	"0001": "Corrupted function stored in data.",
	"0003": "Invalid datatype definition.",
	"0004": "DataType must have a `type` property.",
	"0005": "DataType must have a `serialize` function.",
	"0006": "DataType must have an `unserialize` function.",
	"0007": "Unsupported data type.",
	"0010": "Invalid constraint.",
	"0011": "This table already has a primary key.",
	"0012": "renameColumn expects and old column name and a new one, both must be strings.",
	"0013": "Column does not exist.",
	"0014": "Data must be an array.",
	"0015": "Data not structured properly.",
	"0016": "Cannot insert a null value in a primary column.",
	"0017": "Primary Key violated.",
	"0018": "Cannot insert a null value in a unique column.",
	"0019": "Unique key violated.",
	"0020": "Data type's serialize() method did not return a string.",
	"0021": "Table does not exist.",
	"0022": "Method does not apply to query type.",
	"0023": "Fetch expects paramter one to be 'ASSOC', 'ARRAY', or undefined.",
	"0024": "Expected number or quoted string.",
	"0025": "Expected 'ORDER BY'.",
	"0026": "Must call ORDER BY before using ASC.",
	"0027": "Must call ORDER BY before using DESC.",
	"0028": "Unintelligible query. Expected 'FROM'.",
	"0029": "Unintelligible query. Expected 'TABLE'.",
	"0030": "Unintelligible query. Expected 'INTO'.",
	"0031": "Unintelligible query. Expected 'VALUES'.",
	"0032": "Unintelligible query. Too many values.",
	"0033": "Unintelligible query. Columns mismatch.",
	"0034": "Invalid Column definition.",
	"0035": "Unintelligible query. Expected 'NOT'.",
	"0036": "Unintelligible query. Expected 'EXISTS'.",
	"0037": "Unintelligible query. expected ')'.",
	"0038": "Invalid Arg definition.",
	"0039": "Unintelligible query. Expected 'SET'.",
	"0040": "Unintelligible query. Expected 'FROM'.",
	"0041": "Unintelligible query. WTF?",
	"0042": "Must add a conditional before adding another 'Where' condition.",
	"0043": "Column name must be a string.",
	"0044": "Must add a 'where' clause before the 'equals' call.",
	"0045": "Must add a 'where' clause before the 'preparedLike' call.",
	"0046": "Must add a 'where' clause before the 'doesNotEqual' call.",
	"0047": "Must add a 'where' clause before the 'lessThan' call.",
	"0048": "Must add a 'where' clause before the 'greaterThan' call.",
	"0049": "Must add a 'where' clause before the 'contains' call.",
	"0050": "Must add a 'where' clause before the 'endsWith' call.",
	"0051": "Must add a 'where' clause before the 'beginsWith' call.",
	"0052": "Must use orderBy clause before using ASC.",
	"0053": "Must use orderBy clause before using DESC.",
	"0054": "Could not execute query.",
	"0055": "Error creating table.",
	"0056": "Error opening database.",
	"0057": "indexedDB is not supported in this browser.",
	"0058": "Could not add data after 10 seconds.",
	"0059": "Error updating datastore version.",
	"0060": "Could not connect to the indexedDB datastore.",
	"0061": "Could not initiate a transaction.",
	"0062": "Could not initiate a request.",
	"0063": "Browser doesn't support Web SQL or IndexedDB.",
	"0064": "Unable towrite to datastore file.",
	"0065": "AUTO_INCREMENT column must be a key.",
	"0066": "AUTO_INCREMENT column must be an INT type.",
	"0067": "API is out of memory, cannot store more data.",
	"0068": "Invalid ENUM value.",
	"0069": "NUMERIC or INT type invalid or out of range.",
	"0070": "Unknown Lexer Error.",
	"0071": "Unknown Parser Error.",
	"0072": "Inserting null into a non-null column."
};